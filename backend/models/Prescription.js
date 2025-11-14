import mongoose from 'mongoose';

const medicationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Le nom du médicament est requis'],
    trim: true
  },
  dosage: {
    type: String,
    required: [true, 'Le dosage est requis'],
    trim: true
  },
  frequency: {
    type: String,
    required: [true, 'La fréquence est requise'],
    trim: true
  },
  duration: {
    type: String,
    required: [true, 'La durée est requise'],
    trim: true
  },
  instructions: {
    type: String,
    trim: true
  }
});

const prescriptionSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Le patient est requis']
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Le médecin est requis']
  },
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  medications: [medicationSchema],
  diagnosis: {
    type: String,
    required: [true, 'Le diagnostic est requis'],
    trim: true
  },
  instructions: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  },
  issuedDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date,
    required: [true, "La date d'expiration est requise"]
  },
  isPrinted: {
    type: Boolean,
    default: false
  },
  printCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index pour les recherches courantes
prescriptionSchema.index({ patient: 1, issuedDate: -1 });
prescriptionSchema.index({ doctor: 1, issuedDate: -1 });
prescriptionSchema.index({ status: 1 });

export default mongoose.model('Prescription', prescriptionSchema);