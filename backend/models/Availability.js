import mongoose from 'mongoose';

const availabilitySchema = new mongoose.Schema({
  medecin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: String, // Format: YYYY-MM-DD
    required: true
  },
  startTime: {
    type: String, // Format: HH:MM
    required: true
  },
  endTime: {
    type: String, // Format: HH:MM
    required: true
  },
  duration: {
    type: Number, // Durée en minutes
    default: 30
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  maxPatients: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

// Empêcher les doublons
availabilitySchema.index({ medecin: 1, date: 1, startTime: 1 }, { unique: true });

export default mongoose.model('Availability', availabilitySchema);