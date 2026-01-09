import React, { useEffect, useState, useRef } from 'react';
import './ChatPopup.css';

interface ChatMessage {
  id: string;
  message: string;
  senderName: string;
  role: 'teacher' | 'student';
  timestamp: string;
}

interface ChatPopupProps {
  role: 'teacher' | 'student';
  students?: { id: string; name: string }[];
  onRemoveStudent?: (id: string) => void;
  emit: (event: string, data?: any) => void;
  on: (event: string, handler: (data: any) => void) => void;
  off: (event: string, handler?: (data: any) => void) => void;
  isConnected: boolean;
}

export const ChatPopup: React.FC<ChatPopupProps> = ({
  role,
  students = [],
  onRemoveStudent,
  emit,
  on,
  off,
  isConnected,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'participants'>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleMessage = (data: ChatMessage) => {
      setMessages((prev) => [...prev, data]);
    };

    on('chat-message', handleMessage);

    return () => {
      off('chat-message', handleMessage);
    };
  }, [on, off]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || !isConnected) return;
    emit('chat-message', { message: input.trim() });
    setInput('');
  };

  const showParticipantsTab = role === 'teacher' && students.length > 0 && onRemoveStudent;

  return (
    <div className="chat-popup">
      <button
        type="button"
        className="chat-toggle"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Open class chat"
      >
        <span className="chat-toggle-icon" />
      </button>

      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <div className="chat-tabs">
              <button
                type="button"
                className={`chat-tab ${activeTab === 'chat' ? 'active' : ''}`}
                onClick={() => setActiveTab('chat')}
              >
                Chat
              </button>
              {showParticipantsTab && (
                <button
                  type="button"
                  className={`chat-tab ${activeTab === 'participants' ? 'active' : ''}`}
                  onClick={() => setActiveTab('participants')}
                >
                  Participants
                </button>
              )}
            </div>
            <span className="chat-role-pill">{role === 'teacher' ? 'Teacher' : 'Student'}</span>
          </div>

          {activeTab === 'chat' && (
            <>
              <div className="chat-messages">
                {messages.length === 0 ? (
                  <p className="chat-empty">No messages yet. Say hello!</p>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`chat-message ${
                        msg.role === 'teacher' ? 'from-teacher' : 'from-student'
                      }`}
                    >
                      <div className="chat-meta">
                        <span className="chat-sender">{msg.senderName}</span>
                        <span className="chat-time">
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div className="chat-text">{msg.message}</div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
              <div className="chat-input-row">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={isConnected ? 'Type a message…' : 'Connecting…'}
                  disabled={!isConnected}
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!isConnected || !input.trim()}
                >
                  Send
                </button>
              </div>
            </>
          )}

          {activeTab === 'participants' && showParticipantsTab && (
            <div className="participants-pane">
              <div className="participants-header-row">
                <span>Name</span>
                <span>Action</span>
              </div>
              {students.length === 0 ? (
                <p className="chat-empty">No students connected.</p>
              ) : (
                <ul className="participants-list">
                  {students.map((s) => (
                    <li key={s.id} className="participant-row">
                      <span className="participant-name">{s.name}</span>
                      <button
                        type="button"
                        className="participant-kick"
                        onClick={() => onRemoveStudent(s.id)}
                      >
                        Kick out
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};


