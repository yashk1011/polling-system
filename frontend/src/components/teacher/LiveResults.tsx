import React from 'react';
import type { PollResults } from '../../types';
import './LiveResults.css';

interface LiveResultsProps {
  results: PollResults | null;
  remainingTime: number;
}

export const LiveResults: React.FC<LiveResultsProps> = ({ results, remainingTime }) => {
  if (!results) {
    return (
      <div className="live-results">
        <p className="no-results">No active poll. Create one to see live results!</p>
      </div>
    );
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="live-results">
      <div className="results-header">
        <h2>Live Results</h2>
        <div className="timer-display">
          Time Remaining: <span className="time">{formatTime(remainingTime)}</span>
        </div>
      </div>

      <div className="question-display">
        <h3>{results.question}</h3>
        <p className="total-votes">{results.totalVotes} votes</p>
      </div>

      <div className="results-chart">
        {results.votes.map((vote, index) => (
          <div key={index} className="result-item">
            <div className="result-label">
              <span className="option-text">{vote.option}</span>
              <span className="vote-count">
                {vote.count} ({vote.percentage}%)
              </span>
            </div>
            <div className="result-bar-container">
              <div
                className="result-bar"
                style={{
                  width: `${vote.percentage}%`,
                  backgroundColor: `hsl(${(index * 360) / results.votes.length}, 70%, 60%)`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
