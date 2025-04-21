import express from 'express';
import {
  submitVote,
  getResults,
  getVotersForSong,
  submitInitial,
  getAggregatedSongs,
  submitFinalVote,
  getNominatedSongs,
  getFinalVote,
} from '../controllers/voteController.js';

const router = express.Router();

// Vote routes
router.post('/vote', submitVote);
router.post('/submit-initial', submitInitial);
router.post('/submit-final-vote', submitFinalVote);

// Results & Voters routes
router.get('/results', getResults);
router.get('/voters', getVotersForSong);
router.get('/aggregated-songs', getAggregatedSongs);

// Nominated songs & Final vote routes
router.get('/nominated-songs', getNominatedSongs);
router.get('/final-vote', getFinalVote);

export default router;
