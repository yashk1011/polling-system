import React, { useState } from 'react';
import './StudentOnboarding.css';

interface StudentOnboardingProps {
  onSubmit: (name: string) => void;
}

export const StudentOnboarding: React.FC<StudentOnboardingProps> = ({ onSubmit }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }

    onSubmit(name.trim());
  };

  return (
    <div className="student-onboarding">
      <div className="onboarding-card">
        <h1>Welcome to Live Polling</h1>
        <p>Enter your name to join the session</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              placeholder="Enter your name"
              autoFocus
              maxLength={50}
            />
          </div>

          {error && <p className="error">{error}</p>}

          <button type="submit" className="btn-join">
            Join Session
          </button>
        </form>
      </div>
    </div>
  );
};
