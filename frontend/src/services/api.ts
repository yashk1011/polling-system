import axios from 'axios';
import type { ActivePollResponse, PollHistoryItem } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const pollApi = {
  /**
   * Get the active poll
   */
  getActivePoll: async (studentName?: string): Promise<ActivePollResponse | null> => {
    try {
      const params = studentName ? { studentName } : {};
      const response = await api.get('/polls/active', { params });
      return response.data.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Get poll history (Teacher only)
   */
  getPollHistory: async (): Promise<PollHistoryItem[]> => {
    const response = await api.get('/polls/history');
    return response.data.history;
  },

  /**
   * Create a new poll (Teacher only)
   * Note: sockets are used for the main flow; this REST helper is kept for completeness.
   */
  createPoll: async (
    question: string,
    options: string[],
    correctOptionIndex: number,
    timerDuration: number,
  ) => {
    const response = await api.post('/polls', {
      question,
      options,
      correctOptionIndex,
      timerDuration,
    });
    return response.data.poll;
  },

  /**
   * End a poll (Teacher only)
   */
  endPoll: async (pollId: string) => {
    const response = await api.post(`/polls/${pollId}/end`);
    return response.data;
  },
};

export default api;
