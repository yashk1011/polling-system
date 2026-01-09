import { Request, Response } from 'express';
import PollService from '../services/PollService';

class PollController {
  
  async createPoll(req: Request, res: Response): Promise<void> {
    try {
      const { question, options, timerDuration, correctOptionIndex } = req.body;


      if (!question || !options || !timerDuration) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      if (!Array.isArray(options) || options.length < 2 || options.length > 4) {
        res.status(400).json({ error: 'Options must be an array with 2-4 items' });
        return;
      }

      if (timerDuration < 10 || timerDuration > 300) {
        res.status(400).json({ error: 'Timer duration must be between 10 and 300 seconds' });
        return;
      }

      const index = typeof correctOptionIndex === 'number' ? correctOptionIndex : 0;
      if (index < 0 || index >= options.length) {
        res.status(400).json({ error: 'correctOptionIndex must be a valid option index' });
        return;
      }

      const poll = await PollService.createPoll(question, options, index, timerDuration);
      res.status(201).json({ success: true, poll });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  
  async getActivePoll(req: Request, res: Response): Promise<void> {
    try {
      const { studentName } = req.query;
      const activePoll = await PollService.getActivePoll(studentName as string);

      if (!activePoll) {
        res.status(404).json({ error: 'No active poll found' });
        return;
      }

      res.status(200).json({ success: true, data: activePoll });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  
  async getPollResults(req: Request, res: Response): Promise<void> {
    try {
      const { pollId } = req.params;
      const results = await PollService.getPollResults(pollId);
      res.status(200).json({ success: true, results });
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }

  
  async getPollHistory(req: Request, res: Response): Promise<void> {
    try {
      const history = await PollService.getPollHistory();
      res.status(200).json({ success: true, history });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  
  async endPoll(req: Request, res: Response): Promise<void> {
    try {
      const { pollId } = req.params;
      await PollService.endPoll(pollId);
      res.status(200).json({ success: true, message: 'Poll ended successfully' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export default new PollController();
