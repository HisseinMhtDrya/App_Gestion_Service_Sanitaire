import express from 'express';
import {
  createAvailability,
  getMyAvailability,
  updateAvailability,
  deleteAvailability
} from '../controllers/availabilityController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, createAvailability);
router.get('/my-availability', protect, getMyAvailability);
router.put('/:id', protect, updateAvailability);
router.delete('/:id', protect, deleteAvailability);

export default router;