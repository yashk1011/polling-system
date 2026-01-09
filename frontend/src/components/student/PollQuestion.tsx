import React, { useState } from 'react';
import type { Poll } from '../../types';
import { usePollTimer } from '../../hooks/usePollTimer';
import './PollQuestion.css';

interface PollQuestionProps {
  poll: Poll;
  remainingTime: number;
  onSubmitVote: (optionIndex: number) => void;
  hasVoted: boolean;
}

export const PollQuestion: React.FC<PollQuestionProps> = ({
  poll,
  remainingTime,
  onSubmitVote,
  hasVoted,
}) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { formattedTime } = usePollTimer({
    initialTime: remainingTime,
    onTimeout: () => {

    },
  });

  const handleSubmit = async () => {
    if (selectedOption === null || hasVoted || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    onSubmitVote(selectedOption);

  };

  if (hasVoted) {
    return (
      <div className="poll-question">
        <div className="voted-message">
          <h2>✓ Vote Submitted!</h2>
          <p>Waiting for results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="poll-question">
      <div className="question-header">
        <h2>{poll.question}</h2>
        <div className="timer-badge">
          {formattedTime}
        </div>
      </div>

      <div className="options-container">
        {poll.options.map((option, index) => (
          <button
            key={index}
            className={`option-btn ${selectedOption === index ? 'selected' : ''}`}
            onClick={() => setSelectedOption(index)}
            disabled={isSubmitting}
          >
            <span className="option-number">{index + 1}</span>
            <span className="option-text">{option}</span>
          </button>
        ))}
      </div>

      <button
        className="btn-submit-vote"
        onClick={handleSubmit}
        disabled={selectedOption === null || isSubmitting}
      >
        {isSubmitting ? 'Submitting...' : 'Submit Vote'}
      </button>
    </div>
  );
};
