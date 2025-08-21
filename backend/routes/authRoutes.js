import express from 'express';
import { registerUser, getUserByFirebaseUid } from '../controllers/authControllers.js';

const router = express.Router();

router.post('/register', registerUser);
router.get('/user/:firebaseUid', getUserByFirebaseUid);

export default router;
