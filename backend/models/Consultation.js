import mongoose from 'mongoose';

const consultationSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  diagnosis: { type: String, required: true },
  notes: { type: String },
  prescription: { type: mongoose.Schema.Types.ObjectId, ref: 'Prescription' },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('Consultation', consultationSchema);
