import { useState, useEffect, useCallback } from 'react';
import { pollApi } from '../services/api';
import type { Poll, PollResults } from '../types';

interface UsePollStateProps {
  studentName?: string;
  isTeacher?: boolean;
}

export const usePollState = ({ studentName }: UsePollStateProps = {}) => {
  const [activePoll, setActivePoll] = useState<Poll | null>(null);
  const [results, setResults] = useState<PollResults | null>(null);
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivePoll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await pollApi.getActivePoll(studentName);

      if (data) {
        setActivePoll(data.poll);
        setResults(data.results);
        setRemainingTime(data.remainingTime);
        setHasVoted(data.hasVoted || false);
      } else {
        setActivePoll(null);
        setResults(null);
        setRemainingTime(0);
        setHasVoted(false);
      }
    } catch (err: any) {
      console.error('Error fetching active poll:', err);
      setError(err.message || 'Failed to fetch active poll');
    } finally {
      setLoading(false);
    }
  }, [studentName]);


  useEffect(() => {
    fetchActivePoll();
  }, [fetchActivePoll]);

  const updatePoll = (poll: Poll, time: number) => {
    setActivePoll(poll);
    setRemainingTime(time);
    setHasVoted(false);
  };

  const updateResults = (newResults: PollResults) => {
    setResults(newResults);
  };

  const markAsVoted = () => {
    setHasVoted(true);
  };

  const clearPoll = () => {
    setActivePoll(null);
    setResults(null);
    setRemainingTime(0);
    setHasVoted(false);
  };

  return {
    activePoll,
    results,
    remainingTime,
    hasVoted,
    loading,
    error,
    updatePoll,
    updateResults,
    markAsVoted,
    clearPoll,
    refetch: fetchActivePoll,
  };
};
