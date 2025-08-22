import express from 'express';
import {
  getPublicStudyBoards,
  toggleLikeDislike,
  removeLikeDislike,
  getStudyBoard
} from '../controllers/studyboard-ytControllers.js';

const router = express.Router();

// Get all public study boards with pagination and sorting
router.get('/', getPublicStudyBoards);

// Get specific public study board
router.get('/:id', getStudyBoard);

// Like/Dislike a public study board
router.post('/:id/like-dislike', toggleLikeDislike);

// Remove like/dislike from a public study board
router.delete('/:id/like-dislike', removeLikeDislike);

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: "Public Study Board API is running",
    timestamp: new Date().toISOString()
  });
});

export default router;
