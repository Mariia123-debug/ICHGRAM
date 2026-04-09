import express from 'express';
import {
  createPost,
  getAllPosts,
  getMyPosts,
  updatePost,
  deletePost,
  toggleLikePost,
  addCommentToPost,
  deleteCommentFromPost
} from '../controllers/postController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', getAllPosts);
router.get('/me', authMiddleware, getMyPosts);
router.post('/', authMiddleware, createPost);
router.post('/:id/like', authMiddleware, toggleLikePost);
router.post('/:id/comments', authMiddleware, addCommentToPost);
router.delete('/:postId/comments/:commentId', authMiddleware, deleteCommentFromPost);
router.patch('/:id', authMiddleware, updatePost);
router.delete('/:id', authMiddleware, deletePost);

export default router;