import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // ← CORRIGEZ ICI : 'User' au lieu de 'Patient'
      required: true
    },
    medecin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // ← CORRIGEZ ICI : 'User' au lieu de 'Medecin'
      required: true
    },
    date: {
      type: String, // ou Date selon votre format
      required: true
    },
    heure: {
      type: String,
      required: true
    },
    duree: {
      type: Number,
      default: 30
    },
    motif: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['en_attente', 'confirme', 'annule', 'termine'],
      default: 'en_attente'
    },
    notes: {
      type: String
    },
    resultats: {
      type: String
    },
    rappelEnvoye: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

const Appointment = mongoose.model('Appointment', appointmentSchema);

export default Appointment;