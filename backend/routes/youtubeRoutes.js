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

// Chat-related routes
// POST /api/youtube/chat/session
// Create or get existing chat session for a video
router.post("/chat/session", createOrGetChatSession);

// POST /api/youtube/chat/session/:sessionId/message
// Send message and get AI response
router.post("/chat/session/:sessionId/message", sendMessage);

// GET /api/youtube/chat/session/:sessionId
// Get chat history for a specific session
router.get("/chat/session/:sessionId", getChatHistory);

// GET /api/youtube/chat/user/:userId/sessions
// Get all chat sessions for a user
router.get("/chat/user/:userId/sessions", getUserChatSessions);

// DELETE /api/youtube/chat/session/:sessionId
// Delete a chat session
router.delete("/chat/session/:sessionId", deleteChatSession);

export default router;
