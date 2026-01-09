import React, { useEffect, useState } from 'react';
import { pollApi } from '../../services/api';
import type { PollHistoryItem } from '../../types';
import './PollHistory.css';

export const PollHistory: React.FC = () => {
  const [history, setHistory] = useState<PollHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const data = await pollApi.getPollHistory();
        setHistory(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load history');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (loading) {
    return <div className="poll-history"><p>Loading history...</p></div>;
  }

  if (error) {
    return <div className="poll-history"><p className="error">{error}</p></div>;
  }

  if (history.length === 0) {
    return <div className="poll-history"><p>No poll history yet.</p></div>;
  }

  return (
    <div className="poll-history">
      <h2>Poll History</h2>
      <div className="history-list">
        {history.map((item) => (
          <div key={item.poll._id} className="history-item">
            <div className="history-header">
              <h3>{item.poll.question}</h3>
              <p className="history-date">
                {new Date(item.poll.createdAt).toLocaleDateString()} at{' '}
                {new Date(item.poll.createdAt).toLocaleTimeString()}
              </p>
            </div>
            <div className="history-results">
              <p className="total-votes">{item.results.totalVotes} total votes</p>
              {item.results.votes.map((vote, vIdx) => (
                <div key={vIdx} className="history-result-row">
                  <span className="option">{vote.option}</span>
                  <span className="percentage">{vote.percentage}%</span>
                  <span className="count">({vote.count} votes)</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
