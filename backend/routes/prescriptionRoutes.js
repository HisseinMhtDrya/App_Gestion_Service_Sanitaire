import express from 'express';
import {
  createPrescription,
  getPatientPrescriptions,
  getMyPrescriptions,
  getPrescription,
  generatePrescriptionPDF,
  updatePrescription,
  deletePrescription
} from '../controllers/prescriptionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// --- Ordonnances CRUD ---
router.post('/', protect, createPrescription);
router.get('/doctor/my-prescriptions', protect, getMyPrescriptions);
router.get('/patient/:patientId', protect, getPatientPrescriptions);
router.get('/:id', protect, getPrescription);
router.put('/:id', protect, updatePrescription);
router.delete('/:id', protect, deletePrescription);

// --- PDF ---
router.get('/:id/pdf', protect, generatePrescriptionPDF);

export default router;
