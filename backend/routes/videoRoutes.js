import express from 'express';
import { generateVideo } from '../controllers/videoController.js';

const router = express.Router();

// POST /api/video - Generate video from idea
router.post('/', generateVideo);

export default router;
