import express from 'express';
import { summarizeVideo, getTranscript } from '../controllers/youtubeController.js';

const router = express.Router();

// POST /api/youtube/summarize
// Summarize a YouTube video
router.post('/summarize', summarizeVideo);

// POST /api/youtube/transcript
// Get transcript of a YouTube video
router.post('/transcript', getTranscript);

// GET /api/youtube/health
// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'YouTube API service is running',
    timestamp: new Date().toISOString()
  });
});

export default router;
