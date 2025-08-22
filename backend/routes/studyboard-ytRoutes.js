import express from 'express';
import {
  createStudyBoard,
  saveStudyBoard,
  getUserStudyBoards,
  getStudyBoard,
  getPublicStudyBoards,
  toggleLikeDislike,
  removeLikeDislike,
  updateStudyBoardName,
  deleteStudyBoard,
  getGroupStudyBoards
} from '../controllers/studyboard-ytControllers.js';

const router = express.Router();

// Create temporary study board from YouTube video (not saved)
router.post('/create', createStudyBoard);

// Save study board with visibility options
router.post('/save', saveStudyBoard);

// Get public study boards
router.get('/public', getPublicStudyBoards);

// Like/Dislike study board
router.post('/:id/like-dislike', toggleLikeDislike);

// Remove like/dislike
router.delete('/:id/like-dislike', removeLikeDislike);

// Get user's study boards
router.get('/user/:userId', getUserStudyBoards);

// Get study boards for a specific group
router.get('/group/:groupId', getGroupStudyBoards);

// Get specific study board
router.get('/board/:id', getStudyBoard);

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
