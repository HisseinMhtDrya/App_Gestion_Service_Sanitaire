import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import User from '../models/User.js';
import Appointment from '../models/Appointment.js';
import {
  getUsers,
  getUserProfile,
  updateUserProfile,
  deleteUser,
  getMedecins,
  getUsersByRole
} from '../controllers/userController.js';

const router = express.Router();

// Toutes les routes sont protégées
router.use(protect);

// ----- Utilisateurs classiques -----
router.get('/', authorize('admin', 'medecin'), getUsers);
router.get('/profile', getUserProfile);
router.get('/medecins', getMedecins);
router.put('/profile', updateUserProfile);
router.delete('/:id', authorize('admin'), deleteUser);

router.get('/patients', authorize('medecin', 'admin'), (req, res) => getUsersByRole(req, res, 'patient'));

// ----- Admin dashboard -----

// Liste de tous les utilisateurs pour admin
router.get('/all-users', authorize('admin', 'medecin'), async (req, res) => {
  try {
    // Récupère tous les utilisateurs avec uniquement nom, email et rôle
    const users = await User.find({}, 'nom email role');

    // Réponse uniforme
    res.json({
      success: true,
      data: users
    });
  } catch (err) {
    console.error('Erreur récupération utilisateurs:', err);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des utilisateurs',
      error: err.message
    });
  }
});


// Liste de tous les rendez-vous pour admin
router.get('/appointments', authorize('admin'), async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate('patient', 'nom email')
      .populate('medecin', 'nom email')
      .sort({ date: -1 });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la récupération des rendez-vous', error: err.message });
  }
});

export default router;
