// index.js (ESM)
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import voteRoutes from './routes/vote.js';
import spotifyRoutes from './routes/spotify.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/spotify', spotifyRoutes);
app.use('/api', voteRoutes);

// Default route
app.get('/', (req, res) => res.send('API is running!'));

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
});
