import express from 'express';
import {
  createAppointment,
  validateAppointment,
  getAppointmentHistory,
  getMedecinAvailability,
  updateAppointment,
  getAppointmentById,
  cancelAppointment,
  getMedecinAppointments,
  getPatientAppointments // <-- AJOUTEZ CET IMPORT
} from '../controllers/appointmentController.js';
import { protect, authorize } from '../middleware/auth.js';
import { manualSendReminders } from '../utils/reminderService.js';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(protect);

// =====================
// Routes pour les patients
// =====================
router.get('/my', getPatientAppointments); // Rendez-vous du patient connecté
router.get('/history', getAppointmentHistory); // Historique des rendez-vous

// =====================
// Routes pour les médecins
// =====================
router.get('/medecin', authorize('medecin'), getMedecinAppointments);

// =====================
// Routes générales
// =====================
router.post('/', createAppointment);
router.get('/availability/:medecinId', getMedecinAvailability);
router.get('/:id', getAppointmentById);
router.put('/:id', updateAppointment);
router.put('/:id/validate', authorize('medecin'), validateAppointment);
router.put('/:id/cancel', cancelAppointment);
router.get('/admin/send-reminders', authorize('admin'), manualSendReminders);

export default router;