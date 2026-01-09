import { Router } from 'express';
import PollController from '../controllers/PollController';

const router = Router();


router.post('/', PollController.createPoll.bind(PollController));


router.get('/active', PollController.getActivePoll.bind(PollController));


router.get('/history', PollController.getPollHistory.bind(PollController));


router.get('/:pollId/results', PollController.getPollResults.bind(PollController));


router.post('/:pollId/end', PollController.endPoll.bind(PollController));

export default router;
