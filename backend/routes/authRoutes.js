import express from 'express';
import { register, login, getMe, verifyOTP } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Route d'inscription
router.post('/register', register);

// Route de connexion
router.post('/login', login);

// Route pour obtenir les informations de l'utilisateur connecté
router.get('/me', protect, getMe);  // Utilisation de la middleware 'protect' pour cette route

// Route de vérification de l'OTP
router.post('/verify-otp', verifyOTP);

export default router;
