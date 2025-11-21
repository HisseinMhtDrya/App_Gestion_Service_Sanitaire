import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  createConsultation,
  getMyConsultations,
  getConsultationById,
  updateConsultation
} from '../controllers/consultationController.js';

const router = express.Router();

router.use(protect); // Toutes les routes nécessitent un token

// Médecin uniquement
router.post('/', authorize('medecin'), createConsultation); 
router.get('/my-consultations', authorize('medecin'), getMyConsultations); 
router.get('/:id', authorize('medecin'), getConsultationById); 
router.put('/:id', authorize('medecin'), updateConsultation);

export default router;
