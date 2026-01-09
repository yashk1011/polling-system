import { Router } from 'express';
import PollController from '../controllers/PollController';

const router = Router();

// POST /api/polls - Create new poll
router.post('/', PollController.createPoll.bind(PollController));

// GET /api/polls/active - Get active poll
router.get('/active', PollController.getActivePoll.bind(PollController));

// GET /api/polls/history - Get poll history
router.get('/history', PollController.getPollHistory.bind(PollController));

// GET /api/polls/:pollId/results - Get poll results
router.get('/:pollId/results', PollController.getPollResults.bind(PollController));

// POST /api/polls/:pollId/end - End poll
router.post('/:pollId/end', PollController.endPoll.bind(PollController));

export default router;
