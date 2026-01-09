import React from 'react';
import type { PollResults } from '../../types';
import './ResultsView.css';

interface ResultsViewProps {
  results: PollResults;
}

export const ResultsView: React.FC<ResultsViewProps> = ({ results }) => {
  return (
    <div className="results-view">
      <div className="results-header">
        <h2>Poll Results</h2>
        <p className="results-subtitle">{results.question}</p>
      </div>

      <div className="results-stats">
        <p className="total-votes">{results.totalVotes} total votes</p>
      </div>

      <div className="results-chart">
        {results.votes.map((vote, index) => (
          <div key={index} className="result-item">
            <div className="result-header-row">
              <span className="option-letter">{String.fromCharCode(65 + index)}</span>
              <span className="option-text">{vote.option}</span>
              <span className="percentage">{vote.percentage}%</span>
            </div>
            <div className="result-bar-container">
              <div
                className="result-bar"
                style={{
                  width: `${vote.percentage}%`,
                  backgroundColor: `hsl(${(index * 360) / results.votes.length}, 70%, 60%)`,
                }}
              >
                <span className="vote-count">{vote.count}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="waiting-message">
        <p>Waiting for next question...</p>
      </div>
    </div>
  );
};
