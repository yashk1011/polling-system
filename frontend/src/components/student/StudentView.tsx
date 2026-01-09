import React, { useEffect, useState } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { usePollState } from '../../hooks/usePollState';
import { StudentOnboarding } from './StudentOnboarding';
import { PollQuestion } from './PollQuestion';
import { ResultsView } from './ResultsView';
import { ChatPopup } from '../common/ChatPopup';
import './StudentView.css';

export const StudentView: React.FC = () => {
  const [studentName, setStudentName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { emit, on, off, isConnected } = useSocket();
  const { activePoll, results, remainingTime, hasVoted, updatePoll, updateResults, markAsVoted, clearPoll } =
    usePollState({ studentName: studentName || undefined });


  useEffect(() => {
    const savedName = sessionStorage.getItem('studentName');
    if (savedName) {
      setStudentName(savedName);
    }
  }, []);


  useEffect(() => {
    if (studentName && isConnected) {
      emit('identify', { name: studentName, role: 'student' });
      emit('join-poll', { studentName });
    }
  }, [studentName, isConnected, emit]);

  useEffect(() => {

    const handlePollStarted = (data: any) => {
      updatePoll(data.poll, data.remainingTime || data.poll.timerDuration);
      if (data.hasVoted) {
        markAsVoted();
      }
    };

    const handlePollUpdate = (data: any) => {
      updateResults(data.results);
    };

    const handlePollEnded = (data: any) => {
      updateResults(data.results);
      setTimeout(() => {
        clearPoll();
      }, 5000);
    };

    const handleVoteRecorded = () => {
      markAsVoted();
      setError(null);
    };

    const handleError = (data: { message: string }) => {
      setError(data.message);
      setTimeout(() => setError(null), 5000);
    };

    const handleRemoved = (data: { reason: string }) => {
      setError(data.reason);
      setStudentName(null);
      sessionStorage.removeItem('studentName');
    };

    on('poll-started', handlePollStarted);
    on('poll-update', handlePollUpdate);
    on('poll-ended', handlePollEnded);
    on('vote-recorded', handleVoteRecorded);
    on('error', handleError);
    on('removed', handleRemoved);

    return () => {
      off('poll-started', handlePollStarted);
      off('poll-update', handlePollUpdate);
      off('poll-ended', handlePollEnded);
      off('vote-recorded', handleVoteRecorded);
      off('error', handleError);
      off('removed', handleRemoved);
    };
  }, [on, off, updatePoll, updateResults, markAsVoted, clearPoll]);

  const handleNameSubmit = (name: string) => {
    setStudentName(name);
    sessionStorage.setItem('studentName', name);
  };

  const handleSubmitVote = (optionIndex: number) => {
    if (!activePoll || !studentName) return;

    emit('submit-vote', {
      pollId: activePoll._id,
      studentName,
      selectedOption: optionIndex,
    });
  };


  if (!studentName) {
    return <StudentOnboarding onSubmit={handleNameSubmit} />;
  }

  return (
    <div className="student-view">
      <header className="student-header">
        <h1>Live Poll</h1>
        <div className="student-info">
          <span className="student-name">👤 {studentName}</span>
          <span className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? '● Connected' : '● Disconnected'}
          </span>
        </div>
      </header>

      {error && <div className="error-banner">{error}</div>}

      <div className="student-content">
        {activePoll && !hasVoted && (
          <PollQuestion
            poll={activePoll}
            remainingTime={remainingTime}
            onSubmitVote={handleSubmitVote}
            hasVoted={hasVoted}
          />
        )}

        {(hasVoted || !activePoll) && results && <ResultsView results={results} />}

        {!activePoll && !results && (
          <div className="waiting-for-poll">
            <h2>Waiting for teacher to start a poll...</h2>
            <div className="spinner"></div>
          </div>
        )}
      </div>

      <ChatPopup
        role="student"
        emit={emit}
        on={on}
        off={off}
        isConnected={isConnected}
      />
    </div>
  );
};
