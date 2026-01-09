import { useState, useEffect, useRef } from 'react';

interface UsePollTimerProps {
  initialTime: number;
  onTimeout?: () => void;
}

export const usePollTimer = ({ initialTime, onTimeout }: UsePollTimerProps) => {
  const [timeRemaining, setTimeRemaining] = useState(initialTime);
  const [isActive, setIsActive] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {

    setTimeRemaining(initialTime);
    setIsActive(true);
  }, [initialTime]);

  useEffect(() => {
    if (!isActive || timeRemaining <= 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      if (timeRemaining <= 0 && onTimeout) {
        onTimeout();
      }

      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setIsActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, timeRemaining, onTimeout]);

  const stopTimer = () => {
    setIsActive(false);
  };

  const resetTimer = (newTime: number) => {
    setTimeRemaining(newTime);
    setIsActive(true);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    timeRemaining,
    formattedTime: formatTime(timeRemaining),
    isActive,
    stopTimer,
    resetTimer,
  };
};
