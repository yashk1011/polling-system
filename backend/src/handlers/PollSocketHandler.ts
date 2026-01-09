import { Server, Socket } from 'socket.io';
import PollService from '../services/PollService';

type UserRole = 'teacher' | 'student';

interface ConnectedUser {
  id: string;
  name: string;
  role: UserRole;
}

class PollSocketHandler {
  private io: Server;
  private pollTimers: Map<string, NodeJS.Timeout> = new Map();
  private usersBySocket: Map<string, ConnectedUser> = new Map();

  constructor(io: Server) {
    this.io = io;
  }

  /**
   * Broadcast the current list of students to all teachers
   */
  private broadcastStudentList(): void {
    const students = Array.from(this.usersBySocket.values()).filter(
      (u) => u.role === 'student'
    );

    this.io.emit('student-list', {
      students,
    });
  }

  /**
   * Initialize socket event handlers
   */
  handleConnection(socket: Socket): void {
    console.log(`Client connected: ${socket.id}`);

    // Identify user (teacher or student)
    socket.on('identify', (data: { name: string; role: UserRole }) => {
      const { name, role } = data;
      this.usersBySocket.set(socket.id, {
        id: socket.id,
        name,
        role,
      });

      // notify teachers of updated list
      this.broadcastStudentList();
    });

    // Teacher creates a poll
    socket.on('create-poll', async (data) => {
      try {
        const { question, options, correctOptionIndex, timerDuration } = data;
        const poll = await PollService.createPoll(question, options, correctOptionIndex, timerDuration);

        // Broadcast poll to all students
        this.io.emit('poll-started', {
          poll,
          remainingTime: timerDuration,
        });

        // Set timer to auto-end poll
        this.setAutoPollEnd((poll as any)._id as string, timerDuration);
      } catch (error: any) {
        socket.emit('error', { message: error.message });
      }
    });

    // Student submits a vote
    socket.on('submit-vote', async (data) => {
      try {
        const { pollId, studentName, selectedOption } = data;

        // Submit vote through service (handles validation and duplicate check)
        await PollService.submitVote(pollId, studentName, selectedOption);

        // Get updated results
        const results = await PollService.getPollResults(pollId);

        // Broadcast updated results to all clients
        this.io.emit('poll-update', { results });

        // Confirm vote to the student
        socket.emit('vote-recorded', { success: true });
      } catch (error: any) {
        socket.emit('error', { message: error.message });
      }
    });

    // Teacher manually ends poll
    socket.on('end-poll', async (data) => {
      try {
        const { pollId } = data;
        await PollService.endPoll(pollId);

        // Clear auto-end timer if exists
        if (this.pollTimers.has(pollId)) {
          clearTimeout(this.pollTimers.get(pollId)!);
          this.pollTimers.delete(pollId);
        }

        // Get final results
        const results = await PollService.getPollResults(pollId);

        // Broadcast poll ended to all clients
        this.io.emit('poll-ended', { pollId, results });
      } catch (error: any) {
        socket.emit('error', { message: error.message });
      }
    });

    // Student joins - send current poll state if exists
    socket.on('join-poll', async (data) => {
      try {
        const { studentName } = data;
        const activePoll = await PollService.getActivePoll(studentName);

        if (activePoll) {
          socket.emit('poll-started', {
            poll: activePoll.poll,
            remainingTime: activePoll.remainingTime,
            hasVoted: activePoll.hasVoted,
            results: activePoll.results,
          });
        }
      } catch (error: any) {
        socket.emit('error', { message: error.message });
      }
    });

    // Teacher removes a student
    socket.on('remove-student', (data: { studentId: string }) => {
      const { studentId } = data;
      const targetSocket = this.io.sockets.sockets.get(studentId);

      if (targetSocket) {
        targetSocket.emit('removed', {
          reason: 'You have been removed from the session by the teacher.',
        });
        targetSocket.disconnect(true);
      }
    });

    // Chat messages
    socket.on('chat-message', (data: { message: string }) => {
      const user = this.usersBySocket.get(socket.id);
      if (!user || !data.message?.trim()) {
        return;
      }

      const payload = {
        id: `${Date.now()}-${socket.id}`,
        message: data.message.trim(),
        senderName: user.name,
        role: user.role,
        timestamp: new Date().toISOString(),
      };

      this.io.emit('chat-message', payload);
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
      this.usersBySocket.delete(socket.id);
      this.broadcastStudentList();
    });
  }

  /**
   * Set automatic poll end timer
   */
  private setAutoPollEnd(pollId: string, duration: number): void {
    const timeout = setTimeout(async () => {
      try {
        await PollService.endPoll(pollId);
        const results = await PollService.getPollResults(pollId);

        // Broadcast poll ended
        this.io.emit('poll-ended', { pollId, results });

        // Clean up timer
        this.pollTimers.delete(pollId);
      } catch (error) {
        console.error('Error auto-ending poll:', error);
      }
    }, duration * 1000);

    this.pollTimers.set(pollId, timeout);
  }
}

export default PollSocketHandler;
