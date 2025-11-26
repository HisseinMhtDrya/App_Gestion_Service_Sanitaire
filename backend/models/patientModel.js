import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  age: { type: Number },
  gender: { type: String, enum: ['male', 'female'] },
}, { timestamps: true });

export default mongoose.models.Patient || mongoose.model('Patient', patientSchema);
