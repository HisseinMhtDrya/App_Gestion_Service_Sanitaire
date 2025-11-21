import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { getCurrentPatient } from '../controllers/patientController.js';

const router = express.Router();

router.get('/me', protect, authorize('patient'), getCurrentPatient);

export default router;
