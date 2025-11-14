import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  getUsers,
  getUserProfile,
  updateUserProfile,
  deleteUser,
  getMedecins
} from '../controllers/userController.js';

const router = express.Router();

router.use(protect);

router.get('/', authorize('admin'), getUsers);
router.get('/profile', getUserProfile);
router.get('/medecins', getMedecins);
router.put('/profile', updateUserProfile);
router.delete('/:id', authorize('admin'), deleteUser);

export default router;