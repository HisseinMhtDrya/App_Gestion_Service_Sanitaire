import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  getUsers,
  getUserProfile,
  updateUserProfile,
  deleteUser,
  getMedecins,
  getPatients
} from '../controllers/userController.js';

const router = express.Router();

// Toutes les routes sont protégées
router.use(protect);

// ----- Routes utilisateurs -----
router.get('/', authorize('admin', 'medecin'), getUsers);
router.get('/profile', getUserProfile);
router.put('/profile', updateUserProfile);
router.get('/medecins', getMedecins);
router.get('/patients', authorize('medecin', 'admin'), getPatients);
router.delete('/:id', authorize('admin'), deleteUser);

export default router;