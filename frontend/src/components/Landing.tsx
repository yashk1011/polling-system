import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Landing.css';

type RoleKey = 'student' | 'teacher';

const roles: Record<
  RoleKey,
  {
    title: string;
    description: string;
    route: string;
  }
> = {
  student: {
    title: "I'm a Student",
    description: 'Submit answers and view live poll results in real-time.',
    route: '/student',
  },
  teacher: {
    title: "I'm a Teacher",
    description: 'Create polls, control timers, and view live results.',
    route: '/teacher',
  },
};

export const Landing: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<RoleKey>('student');
  const navigate = useNavigate();

  const handleContinue = () => {
    navigate(roles[selectedRole].route);
  };

  return (
    <div className="landing-page">
      <div className="landing-card">
        <div className="pill">
          <span className="pill-icon">✦</span>
          <span>Intervue Poll</span>
        </div>

        <div className="heading">
          <h1>
            Welcome to the <span className="highlight">Live Polling System</span>
          </h1>
          <p className="subheading">
            Please select the role that best describes you to begin using the live polling system
          </p>
        </div>

        <div className="role-grid">
          {(Object.keys(roles) as RoleKey[]).map((key) => {
            const role = roles[key];
            const isActive = selectedRole === key;
            return (
              <button
                key={key}
                className={`role-card ${isActive ? 'active' : ''}`}
                onClick={() => setSelectedRole(key)}
                type="button"
              >
                <div className="role-title">{role.title}</div>
                <div className="role-desc">{role.description}</div>
              </button>
            );
          })}
        </div>

        <div className="actions">
          <button className="cta" onClick={handleContinue}>
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

