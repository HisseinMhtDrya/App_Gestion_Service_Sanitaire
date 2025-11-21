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
import Appointment from '../models/Appointment.js';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(protect);

// =====================
// ROUTE À AJOUTER : GET /api/appointments/my
// =====================
router.get('/my', async (req, res) => {
  try {
    const patientId = req.user._id;

    // Récupérer tous les rendez-vous du patient avec infos du médecin
    const appointments = await Appointment.find({ patient: patientId })
      .populate('medecin', '_id nom prenom') // <-- important
      .sort({ date: 1 });

    res.json(appointments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// =====================
// Routes existantes
// =====================
router.post('/', createAppointment);
router.get('/history', getAppointmentHistory);
router.get('/medecin', authorize('medecin'), getMedecinAppointments);
router.get('/availability/:medecinId', getMedecinAvailability);
router.get('/:id', getAppointmentById);
router.put('/:id', updateAppointment);
router.put('/:id/validate', authorize('medecin'), validateAppointment);
router.put('/:id/cancel', cancelAppointment);
router.get('/admin/send-reminders', authorize('admin'), manualSendReminders);

export default router;
