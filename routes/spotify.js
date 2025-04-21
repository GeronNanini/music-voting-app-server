import express from 'express';
import { getSpotifyToken, searchSpotifySong } from '../controllers/spotifyController.js';

const router = express.Router();

router.get('/token', getSpotifyToken);
router.post('/search', searchSpotifySong);

export default router;
