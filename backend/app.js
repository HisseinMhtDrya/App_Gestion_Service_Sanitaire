import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import morgan from 'morgan';
import cors from 'cors';
import { connectDB } from './config/db.js';
import Message from './models/Message.js';
// Routes
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import prescriptionRoutes from './routes/prescriptionRoutes.js'; // <-- Ajoutez cette ligne
import './utils/reminderService.js'; // Pour démarrer le service de rappels
import availabilityRoutes from './routes/availability.js';
import consultationRoutes from './routes/consultationRoutes.js';
import patientRoutes from './routes/patientRoutes.js';
import User from './models/User.js';
import sendEmail from './utils/sendEmail.js';
// import adminRoutes from './routes/adminRoutes.js'; // supprimé

dotenv.config();

// Connexion à la base de données
connectDB();

const app = express();
const server = http.createServer(app);
const io = new (await import("socket.io")).Server(server, {
  cors: { origin: "*" }
});

// Middlewares
app.use(cors());
app.options('*', cors());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test de santé de l'API
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'API Health Check', 
    timestamp: new Date().toISOString() 
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/patients', patientRoutes);

// ------------------- ADMIN DASHBOARD -------------------
import { Router } from 'express';
import Appointment from './models/Appointment.js';

const adminRoutes = Router();

// Route Dashboard Admin
adminRoutes.get('/dashboard', async (req, res) => {
  try {
    const totalPatients = await User.countDocuments({ role: 'patient' });
    const totalMedecins = await User.countDocuments({ role: 'medecin' });
    const totalRendezvous = await Appointment.countDocuments();

    const recentPatients = await User.find({ role: 'patient' })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('nom email createdAt');

    const recentAppointments = await Appointment.find()
      .sort({ date: -1 })
      .limit(5)
      .populate('patient', 'nom email')
      .populate('medecin', 'nom email');

    res.json({
      totalPatients,
      totalMedecins,
      totalRendezvous,
      recentPatients,
      recentAppointments
    });
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la récupération du dashboard", error: err.message });
  }
});

app.use('/api/admin', adminRoutes);
// --------------------------------------------------------

// Messagerie : récupération historique
app.get("/api/messages/:user1/:user2", async (req, res) => {
  const { user1, user2 } = req.params;
  try {
    const messages = await Message.find({
      $or: [
        { senderId: user1, receiverId: user2 },
        { senderId: user2, receiverId: user1 }
      ]
    }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la récupération des messages", error: err.message });
  }
});

// Socket.IO : messagerie temps réel
io.on("connection", (socket) => {
  console.log("Nouvel utilisateur connecté :", socket.id);

  socket.on("joinRoom", (userId) => {
    socket.join(userId); // Chaque utilisateur rejoint sa "room" par son ID
    console.log(`Utilisateur ${userId} a rejoint sa room`);
  });

  socket.on("sendMessage", async (data) => {
    try {
      const message = new Message(data);
      await message.save();
      io.to(data.receiverId).emit("receiveMessage", message);

      // Envoyer email au destinataire
      const userReceiver = await User.findById(data.receiverId);
      const userSender = await User.findById(data.senderId);
      if (userReceiver && userReceiver.email) {
        await sendEmail(
          userReceiver.email,
          "Vous avez reçu un nouveau message",
          `Bonjour ${userReceiver.nom},\n\nVous avez reçu un nouveau message de ${userSender?.nom || 'un utilisateur'} :\n\n"${data.content}"\n\nConnectez-vous pour répondre.`
        );
      }
    } catch (err) {
      console.error("Erreur en envoyant le message :", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("Utilisateur déconnecté :", socket.id);
  });
});

// 404 handler
app.use((req, res) => {
  console.log(`❌ Route non trouvée: ${req.method} ${req.url}`);
  res.status(404).json({ 
    message: "Route not found",
    path: req.url,
    method: req.method
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err.stack);
  res.status(500).json({ 
    message: "Server error", 
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});


const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Backend et Socket.IO running on port ${PORT}`);
  console.log(`API disponible sur: http://localhost:${PORT}/api`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Service de rendez-vous activé`);
  console.log(`Service de prescriptions activé`); 
});

