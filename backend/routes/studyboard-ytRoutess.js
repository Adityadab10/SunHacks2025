import express from 'express';
import {
  createStudyBoard,
  getUserStudyBoards,
  getStudyBoard,
  updateStudyBoardName,
  deleteStudyBoard
} from '../controllers/studyboard-ytControllers.js';

const router = express.Router();

// Create study board from YouTube video
router.post('/create', createStudyBoard);

// Get user's study boards
router.get('/user/:userId', getUserStudyBoards);

// Get specific study board
router.get('/:id', getStudyBoard);

// Update study board name
router.put('/:id/name', updateStudyBoardName);

// Delete study board
router.delete('/:id', deleteStudyBoard);

// Health check for study board routes
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: "Study Board YouTube API is running",
    timestamp: new Date().toISOString()
  });
});

export default router;
