import express from 'express';
import { getAllPatientsWithAppointments } from '../controllers/patientController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get(
  '/',
  protect,
  authorize('medecin'),
  getAllPatientsWithAppointments
);

export default router;
