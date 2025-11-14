import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    medecin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    heure: {
      type: String,
      required: true,
    },
    duree: {
      type: Number,
      default: 30, // durée en minutes
    },
    status: {
      type: String,
      enum: ['en_attente', 'confirme', 'annule', 'termine'],
      default: 'en_attente',
    },
    motif: {
      type: String,
      required: true,
    },
    notes: {
      type: String,
    },
    resultats: {
      type: String,
    },
    rappelEnvoye: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Index pour éviter les doublons de rendez-vous
appointmentSchema.index({ medecin: 1, date: 1, heure: 1 }, { unique: true });

export default mongoose.model('Appointment', appointmentSchema);