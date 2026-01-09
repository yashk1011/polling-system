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

  
  private broadcastStudentList(): void {
    const students = Array.from(this.usersBySocket.values()).filter(
      (u) => u.role === 'student'
    );

    this.io.emit('student-list', {
      students,
    });
  }

  
  handleConnection(socket: Socket): void {
    console.log(`Client connected: ${socket.id}`);


    socket.on('identify', (data: { name: string; role: UserRole }) => {
      const { name, role } = data;
      this.usersBySocket.set(socket.id, {
        id: socket.id,
        name,
        role,
      });


      this.broadcastStudentList();
    });


    socket.on('create-poll', async (data) => {
      try {
        const { question, options, correctOptionIndex, timerDuration } = data;
        const poll = await PollService.createPoll(question, options, correctOptionIndex, timerDuration);


        this.io.emit('poll-started', {
          poll,
          remainingTime: timerDuration,
        });


        this.setAutoPollEnd((poll as any)._id as string, timerDuration);
      } catch (error: any) {
        socket.emit('error', { message: error.message });
      }
    });


    socket.on('submit-vote', async (data) => {
      try {
        const { pollId, studentName, selectedOption } = data;


        await PollService.submitVote(pollId, studentName, selectedOption);


        const results = await PollService.getPollResults(pollId);


        this.io.emit('poll-update', { results });


        socket.emit('vote-recorded', { success: true });
      } catch (error: any) {
        socket.emit('error', { message: error.message });
      }
    });


    socket.on('end-poll', async (data) => {
      try {
        const { pollId } = data;
        await PollService.endPoll(pollId);


        if (this.pollTimers.has(pollId)) {
          clearTimeout(this.pollTimers.get(pollId)!);
          this.pollTimers.delete(pollId);
        }


        const results = await PollService.getPollResults(pollId);


        this.io.emit('poll-ended', { pollId, results });
      } catch (error: any) {
        socket.emit('error', { message: error.message });
      }
    });


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

  
  private setAutoPollEnd(pollId: string, duration: number): void {
    const timeout = setTimeout(async () => {
      try {
        await PollService.endPoll(pollId);
        const results = await PollService.getPollResults(pollId);


        this.io.emit('poll-ended', { pollId, results });


        this.pollTimers.delete(pollId);
      } catch (error) {
        console.error('Error auto-ending poll:', error);
      }
    }, duration * 1000);

    this.pollTimers.set(pollId, timeout);
  }
}

export default PollSocketHandler;
