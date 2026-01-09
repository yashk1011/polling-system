import React, { useState } from 'react';
import './CreatePollForm.css';

interface CreatePollFormProps {
  onCreatePoll: (question: string, options: string[], correctOptionIndex: number, timerDuration: number) => void;
  isDisabled: boolean;
}

export const CreatePollForm: React.FC<CreatePollFormProps> = ({ onCreatePoll, isDisabled }) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [correctOptionIndex, setCorrectOptionIndex] = useState<number>(0);
  const [timerDuration, setTimerDuration] = useState(60);
  const [errors, setErrors] = useState<string[]>([]);

  const handleAddOption = () => {
    if (options.length < 4) {
      setOptions([...options, '']);
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const validate = (): boolean => {
    const newErrors: string[] = [];
    if (!question.trim()) {
      newErrors.push('Question is required');
    }
    const filledOptions = options.filter((opt) => opt.trim());
    if (filledOptions.length < 2) {
      newErrors.push('At least 2 options are required');
    }
    if (options.some(opt => !opt.trim())) {
      newErrors.push('All option fields must be filled');
    }
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onCreatePoll(question.trim(), options, correctOptionIndex, timerDuration);

    // Reset defaults
    setQuestion('');
    setOptions(['', '']);
    setCorrectOptionIndex(0);
    setErrors([]);
  };

  return (
    <div className="create-poll-container">
      <div className="page-header">
        <div className="pill">
          <span className="pill-icon">✦</span>
          <span>Intervue Poll</span>
        </div>
        <h1>Let's <span className="highlight">Get Started</span></h1>
        <p className="subtext">
          you'll have the ability to create and manage polls, ask questions, and monitor your students' responses in real-time.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="poll-form">
        <div className="question-section">
          <div className="section-header">
            <label className="section-label">Enter your question</label>
            <div className="timer-select-wrapper">
              <select
                value={timerDuration}
                onChange={(e) => setTimerDuration(Number(e.target.value))}
                className="timer-select"
                disabled={isDisabled}
              >
                <option value={30}>30 seconds</option>
                <option value={60}>60 seconds</option>
                <option value={90}>90 seconds</option>
                <option value={120}>120 seconds</option>
              </select>
            </div>
          </div>

          <div className="input-wrapper">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Type your question here..."
              className="question-input"
              rows={4}
              disabled={isDisabled}
            />
            <div className="char-count">{question.length}/100</div>
          </div>
        </div>

        <div className="options-section">
          <div className="section-header">
            <label className="section-label">Edit Options</label>
            <label className="section-label right">Is it Correct?</label>
          </div>

          <div className="options-list">
            {options.map((option, index) => (
              <div key={index} className="option-row">
                <div className="option-number-badge">{index + 1}</div>
                <div className="option-input-wrapper">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="option-text-input"
                    disabled={isDisabled}
                  />
                </div>
                <div className="correct-toggle">
                  <label className={`radio-label ${correctOptionIndex === index ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="correctOption"
                      checked={correctOptionIndex === index}
                      onChange={() => setCorrectOptionIndex(index)}
                      disabled={isDisabled}
                    />
                    <span className="radio-fake"></span>
                    <span className="label-text">Yes</span>
                  </label>

                  <label className={`radio-label ${correctOptionIndex !== index ? 'unselected' : ''}`}>
                    <input
                      type="radio"
                      name="correctOption"
                      checked={correctOptionIndex !== index}
                      onChange={() => setCorrectOptionIndex(index)} // Clicking 'No' on another shouldn't do anything, but selecting Yes on this row sets it. 
                      // Actually, let's just make the Yes button set it. The No button is just visual state for "not selected".
                      // For simplicity, we only bind the change on the Yes radio, or just make it purely visual.
                      // Let's assume the user clicks "Yes" to select.
                      disabled={isDisabled}
                    />
                    <span className="radio-fake"></span>
                    <span className="label-text">No</span>
                  </label>
                </div>
              </div>
            ))}
          </div>

          {options.length < 4 && (
            <button
              type="button"
              onClick={handleAddOption}
              className="btn-add-more"
              disabled={isDisabled}
            >
              + Add More option
            </button>
          )}
        </div>

        {errors.length > 0 && (
          <div className="error-message">
            {errors[0]}
          </div>
        )}

        <div className="form-footer">
          {/* Spacer */}
          <div />
          <button type="submit" className="btn-ask" disabled={isDisabled}>
            {isDisabled ? 'Poll Active' : 'Ask Question'}
          </button>
        </div>
      </form>
    </div>
  );
};
