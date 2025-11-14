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
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Toutes les routes protégées
router.use(protect);

// Routes médecin
router.post('/', authorize('medecin'), createPrescription);
router.get('/doctor/my-prescriptions', authorize('medecin'), getMyPrescriptions);

// Routes patient et médecin
router.get('/patient/:patientId', getPatientPrescriptions);
router.get('/:id', getPrescription);
router.get('/:id/pdf', generatePrescriptionPDF);

// Routes modification
router.put('/:id', authorize('medecin'), updatePrescription);
router.delete('/:id', authorize('medecin', 'admin'), deletePrescription);

export default router;