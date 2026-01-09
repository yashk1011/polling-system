export interface Poll {
  _id: string;
  question: string;
  options: string[];
  timerDuration: number;
  status: 'active' | 'completed';
  startedAt: string;
  createdAt: string;
}

export interface Vote {
  option: string;
  count: number;
  percentage: number;
}

export interface PollResults {
  pollId: string;
  question: string;
  options: string[];
  votes: Vote[];
  totalVotes: number;
  status: string;
}

export interface ActivePollResponse {
  poll: Poll;
  results: PollResults;
  remainingTime: number;
  hasVoted?: boolean;
}

export interface PollHistoryItem {
  poll: Poll;
  results: PollResults;
}
