export interface IPoll {

  question: string;
  options: string[];
  correctOptionIndex: number;
  timerDuration: number;
  status: 'active' | 'completed';
  startedAt: Date;
  createdAt: Date;
}

export interface IVote {

  pollId: string;
  studentName: string;
  selectedOption: number;
  timestamp: Date;
}

export interface PollResults {
  pollId: string;
  question: string;
  options: string[];
  votes: {
    option: string;
    count: number;
    percentage: number;
  }[];
  totalVotes: number;
  status: string;
}

export interface ActivePollResponse {
  poll: IPoll;
  results: PollResults;
  remainingTime: number;
  hasVoted?: boolean;
}
