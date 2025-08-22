import express from 'express';
import {
  createOrGetChatSession,
  sendMessage,
  getChatHistory,
  getUserChatSessions,
  deleteChatSession
} from '../controllers/yt-chat-historyControllers.js';

const router = express.Router();

// Create or get existing chat session for a video
router.post('/session', createOrGetChatSession);

// Send message and get AI response
router.post('/session/:sessionId/message', sendMessage);

// Get chat history for a specific session
router.get('/session/:sessionId', getChatHistory);

// Get all chat sessions for a user
router.get('/user/:userId/sessions', getUserChatSessions);

// Delete a chat session
router.delete('/session/:sessionId', deleteChatSession);

export default router;
