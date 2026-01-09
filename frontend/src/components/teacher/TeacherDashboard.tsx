import React, { useEffect, useState } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { usePollState } from '../../hooks/usePollState';
import { CreatePollForm } from './CreatePollForm';
import { LiveResults } from './LiveResults';
import { PollHistory } from './PollHistory';
import { ChatPopup } from '../common/ChatPopup';
import './TeacherDashboard.css';

export const TeacherDashboard: React.FC = () => {
  const { emit, on, off, isConnected, error: socketError } = useSocket();
  const { activePoll, results, remainingTime, updatePoll, updateResults, clearPoll } =
    usePollState({ isTeacher: true });

  const [showHistory, setShowHistory] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [students, setStudents] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    // Identify this socket as the teacher for chat and presence
    if (isConnected) {
      emit('identify', { name: 'Teacher', role: 'teacher' });
    }
  }, [isConnected, emit]);

  useEffect(() => {
    // Listen for poll events
    const handlePollStarted = (data: any) => {
      updatePoll(data.poll, data.remainingTime);
      setNotification('Poll started successfully!');
      setTimeout(() => setNotification(null), 3000);
    };

    const handlePollUpdate = (data: any) => {
      updateResults(data.results);
    };

    const handlePollEnded = (data: any) => {
      updateResults(data.results);
      clearPoll();
      setNotification('Poll has ended!');
      setTimeout(() => setNotification(null), 3000);
    };

    on('poll-started', handlePollStarted);
    on('poll-update', handlePollUpdate);
    on('poll-ended', handlePollEnded);

    const handleStudentList = (data: { students: { id: string; name: string; role: string }[] }) => {
      setStudents(
        data.students.map((s) => ({
          id: s.id,
          name: s.name,
        }))
      );
    };

    on('student-list', handleStudentList);

    return () => {
      off('poll-started', handlePollStarted);
      off('poll-update', handlePollUpdate);
      off('poll-ended', handlePollEnded);
      off('student-list', handleStudentList);
    };
  }, [on, off, updatePoll, updateResults, clearPoll]);

  const handleCreatePoll = (question: string, options: string[], correctOptionIndex: number, timerDuration: number) => {
    emit('create-poll', { question, options, correctOptionIndex, timerDuration });
  };

  const handleEndPoll = () => {
    if (activePoll) {
      emit('end-poll', { pollId: activePoll._id });
    }
  };

  const handleRemoveStudent = (id: string) => {
    emit('remove-student', { studentId: id });
  };

  return (
    <div className="teacher-dashboard">
      <header className="dashboard-header">
        <h1>Teacher Dashboard</h1>
        <div className="header-actions">
          <div className="connection-status">
            {isConnected ? (
              <span className="status-connected">● Connected</span>
            ) : (
              <span className="status-disconnected">● Disconnected</span>
            )}
          </div>
          <button
            className="btn-toggle-view"
            onClick={() => setShowHistory(!showHistory)}
          >
            {showHistory ? 'Show Live Poll' : 'Show History'}
          </button>
        </div>
      </header>

      {notification && (
        <div className="notification">{notification}</div>
      )}

      {socketError && (
        <div className="error-banner">{socketError}</div>
      )}

      <div className="dashboard-content">
        {!showHistory ? (
          <>
            <div className="dashboard-section">
              <CreatePollForm
                onCreatePoll={handleCreatePoll}
                isDisabled={!!activePoll}
              />
            </div>

            <div className="dashboard-section">
              <LiveResults results={results} remainingTime={remainingTime} />
              {activePoll && (
                <button
                  className="btn-end-poll"
                  onClick={handleEndPoll}
                >
                  End Poll Now
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="dashboard-section full-width">
            <PollHistory />
          </div>
        )}
      </div>

      <ChatPopup
        role="teacher"
        students={students}
        onRemoveStudent={handleRemoveStudent}
        emit={emit}
        on={on}
        off={off}
        isConnected={isConnected}
      />
    </div>
  );
};
