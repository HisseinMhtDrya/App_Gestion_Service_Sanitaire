import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  senderId: { type: String, required: true },   // ID utilisateur qui envoie
  receiverId: { type: String, required: true }, // ID destinataire
  content: { type: String, required: true },   // Contenu du message
  timestamp: { type: Date, default: Date.now } // Date d'envoi
});

export default mongoose.model("Message", messageSchema);
