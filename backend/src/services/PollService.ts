import Poll from '../models/Poll.model';
import Vote from '../models/Vote.model';
import { IPoll, PollResults, ActivePollResponse } from '../types';

class PollService {
  /**
   * Create a new poll
   */
  async createPoll(
    question: string,
    options: string[],
    correctOptionIndex: number,
    timerDuration: number
  ): Promise<IPoll> {
    // Check if there's an active poll
    const activePoll = await Poll.findOne({ status: 'active' });
    if (activePoll) {
      throw new Error('An active poll already exists. Please end it before creating a new one.');
    }

    const poll = new Poll({
      question,
      options,
      correctOptionIndex,
      timerDuration,
      status: 'active',
      startedAt: new Date(),
    });

    await poll.save();
    return poll.toObject();
  }

  /**
   * Get the current active poll with calculated remaining time
   */
  async getActivePoll(studentName?: string): Promise<ActivePollResponse | null> {
    const poll = await Poll.findOne({ status: 'active' });
    if (!poll) {
      return null;
    }

    const elapsedTime = Math.floor((Date.now() - poll.startedAt.getTime()) / 1000);
    const remainingTime = Math.max(0, poll.timerDuration - elapsedTime);

    // Get results
    const results = await this.getPollResults(poll._id.toString());

    // Check if student has voted
    let hasVoted = false;
    if (studentName) {
      const vote = await Vote.findOne({ pollId: poll._id, studentName });
      hasVoted = !!vote;
    }

    return {
      poll: poll.toObject(),
      results,
      remainingTime,
      hasVoted,
    };
  }

  /**
   * Submit a vote for a poll
   */
  async submitVote(pollId: string, studentName: string, selectedOption: number): Promise<void> {
    // Validate poll exists and is active
    const poll = await Poll.findById(pollId);
    if (!poll) {
      throw new Error('Poll not found');
    }

    if (poll.status !== 'active') {
      throw new Error('Poll is no longer active');
    }

    // Check if time has expired
    const elapsedTime = Math.floor((Date.now() - poll.startedAt.getTime()) / 1000);
    if (elapsedTime >= poll.timerDuration) {
      throw new Error('Time limit exceeded');
    }

    // Validate option index
    if (selectedOption < 0 || selectedOption >= poll.options.length) {
      throw new Error('Invalid option selected');
    }

    // Check for duplicate vote (race condition prevention)
    const existingVote = await Vote.findOne({ pollId, studentName });
    if (existingVote) {
      throw new Error('You have already voted on this poll');
    }

    // Create vote
    const vote = new Vote({
      pollId,
      studentName,
      selectedOption,
    });

    await vote.save();
  }

  /**
   * Get poll results with vote counts and percentages
   */
  async getPollResults(pollId: string): Promise<PollResults> {
    const poll = await Poll.findById(pollId);
    if (!poll) {
      throw new Error('Poll not found');
    }

    // Aggregate votes
    const voteAggregation = await Vote.aggregate([
      { $match: { pollId: poll._id } },
      { $group: { _id: '$selectedOption', count: { $sum: 1 } } },
    ]);

    const voteCounts: { [key: number]: number } = {};
    let totalVotes = 0;

    voteAggregation.forEach((item) => {
      voteCounts[item._id] = item.count;
      totalVotes += item.count;
    });

    // Calculate percentages
    const votes = poll.options.map((option, index) => {
      const count = voteCounts[index] || 0;
      const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
      return {
        option,
        count,
        percentage,
      };
    });

    return {
      pollId: poll._id.toString(),
      question: poll.question,
      options: poll.options,
      votes,
      totalVotes,
      status: poll.status,
    };
  }

  /**
   * End the current active poll
   */
  async endPoll(pollId: string): Promise<void> {
    const poll = await Poll.findById(pollId);
    if (!poll) {
      throw new Error('Poll not found');
    }

    poll.status = 'completed';
    await poll.save();
  }

  /**
   * Get poll history with results
   */
  async getPollHistory(): Promise<any[]> {
    const polls = await Poll.find({ status: 'completed' })
      .sort({ createdAt: -1 })
      .limit(20);

    const history = await Promise.all(
      polls.map(async (poll) => {
        const results = await this.getPollResults(poll._id.toString());
        return {
          poll: poll.toObject(),
          results,
        };
      })
    );

    return history;
  }

  /**
   * Check if all students have answered (for the constraint)
   */
  async checkAllStudentsAnswered(pollId: string): Promise<boolean> {
    // This is a simplified check - in a real system, you'd track registered students
    // For now, we'll just return false to allow teacher to manually end polls
    return false;
  }
}

export default new PollService();
