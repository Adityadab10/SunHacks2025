import express from "express";
import {
  summarizeVideo,
  getTranscript,
  getUserYoutubeHistory,
  getYoutubeSummary,
} from "../controllers/youtubeController.js";
// Import chat controllers
import {
  createOrGetChatSession,
  sendMessage,
  getChatHistory,
  getUserChatSessions,
  deleteChatSession
} from "../controllers/yt-chat-historyControllers.js";
import ytChatRoutes from './yt-chat-historyRoutes.js';

const router = express.Router();

// POST /api/youtube/summarize
// Summarize a YouTube video and save to database
router.post("/summarize", summarizeVideo);

// POST /api/youtube/transcript
// Get transcript of a YouTube video
router.post("/transcript", getTranscript);

// GET /api/youtube/history/:userId
// Get user's YouTube video history
router.get("/history/:userId", getUserYoutubeHistory);

// GET /api/youtube/user/:userId/history
// Get user's YouTube history
router.get("/user/:userId/history", getUserYoutubeHistory);

// GET /api/youtube/summary/:id
// Get specific YouTube video summary by ID
router.get("/summary/:id", getYoutubeSummary);

// GET /api/youtube/health
// Health check endpoint
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "YouTube API service is running",
    timestamp: new Date().toISOString(),
  });
});

// Mount chat routes under /chat
router.use('/chat', ytChatRoutes);

// Add a test route to verify chat routes are working
router.get('/chat/test', (req, res) => {
  res.json({ success: true, message: 'Chat routes are connected' });
});

export default router;

