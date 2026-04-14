import express from 'express';
import {
  registerUser,
  loginUser,
  getCurrentUser,
  updateCurrentUser,
  toggleFollowUser,
  getUserProfileById,
  searchUsersByUsername
} from '../controllers/userController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);

router.get('/search', authMiddleware, searchUsersByUsername);

router.get('/me', authMiddleware, getCurrentUser);
router.patch('/me', authMiddleware, updateCurrentUser);

router.get('/:id', authMiddleware, getUserProfileById);
router.post('/:id/follow', authMiddleware, toggleFollowUser);

export default router;