// appointmentRoutes.js
import express from 'express';
import {
  createAppointment,
  validateAppointment,
  getAppointmentHistory,
  getMedecinAvailability,
  updateAppointment,
  getAppointmentById,
  cancelAppointment,
  getMedecinAppointments
} from '../controllers/appointmentController.js';
import { protect, authorize } from '../middleware/auth.js';
import { manualSendReminders } from '../utils/reminderService.js';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(protect);

// @route   POST /api/appointments
// @desc    Créer un nouveau rendez-vous
// @access  Private (Patient)
router.post('/', createAppointment);

// @route   GET /api/appointments/history
// @desc    Obtenir l'historique des rendez-vous
// @access  Private
router.get('/history', getAppointmentHistory);

// @route   GET /api/appointments/medecin
// @desc    Obtenir les rendez-vous d'un médecin (pour le tableau de bord médecin)
// @access  Private (Médecin)
router.get('/medecin', authorize('medecin'), getMedecinAppointments);

// @route   GET /api/appointments/availability/:medecinId
// @desc    Obtenir les disponibilités d'un médecin
// @access  Private
router.get('/availability/:medecinId', getMedecinAvailability);

// @route   GET /api/appointments/:id
// @desc    Obtenir un rendez-vous spécifique
// @access  Private
router.get('/:id', getAppointmentById);

// @route   PUT /api/appointments/:id
// @desc    Mettre à jour un rendez-vous (notes, résultats)
// @access  Private
router.put('/:id', updateAppointment);

// @route   PUT /api/appointments/:id/validate
// @desc    Valider ou refuser un rendez-vous
// @access  Private (Médecin seulement)
router.put('/:id/validate', authorize('medecin'), validateAppointment);

// @route   PUT /api/appointments/:id/cancel
// @desc    Annuler un rendez-vous
// @access  Private (Patient ou Médecin associé)
router.put('/:id/cancel', cancelAppointment);

// @route   GET /api/appointments/admin/send-reminders
// @desc    Déclencher manuellement l'envoi des rappels
// @access  Private (Admin seulement)
router.get('/admin/send-reminders', authorize('admin'), manualSendReminders);

export default router;