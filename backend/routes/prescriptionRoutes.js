import express from 'express';
import {
  createPrescription,
  getPatientPrescriptions,
  getMyPrescriptions,
  getMyPatientPrescriptions, // ⬅ AJOUTEZ CET IMPORT
  getPrescription,
  generatePrescriptionPDF,
  updatePrescription,
  deletePrescription,
  checkUserRole
} from '../controllers/prescriptionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// --- Ordonnances CRUD ---
router.post('/', protect, createPrescription);
router.get('/doctor/my-prescriptions', protect, getMyPrescriptions);
router.get('/patient/my-prescriptions', protect, getMyPatientPrescriptions); // ⬅ AJOUTEZ CETTE ROUTE
router.get('/patient/:patientId', protect, getPatientPrescriptions);
router.get('/:id', protect, getPrescription);
router.put('/:id', protect, updatePrescription);
router.delete('/:id', protect, deletePrescription);

// --- PDF ---
router.get('/:id/pdf', protect, generatePrescriptionPDF);

// --- Debug routes ---
router.get('/check-role', protect, checkUserRole);

export default router;