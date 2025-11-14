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
app.use('/api/prescriptions', prescriptionRoutes); // <-- Ajoutez cette ligne
app.use('/api/availability', availabilityRoutes);

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
  });

  socket.on("sendMessage", async (data) => {
    try {
      const message = new Message(data);
      await message.save();
      io.to(data.receiverId).emit("receiveMessage", message);
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
  console.log(`Service de prescriptions activé`); // <-- Ajoutez cette ligne
});