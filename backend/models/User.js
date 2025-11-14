import mongoose from 'mongoose';  // Assure-toi d'importer mongoose

// Définir le schéma de l'utilisateur
const userSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    poste: {
      type: String,
      required: true,
    },
    // Dans models/User.js, modifiez l'enum du rôle :
    role: {
      type: String,
      enum: ['admin', 'medecin', 'patient'],
      default: 'patient',
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
    },
    otpExpiration: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Méthode pour vérifier le mot de passe (à ajouter si tu veux)
userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
  return candidatePassword === userPassword; // Remplacer par la logique réelle de vérification du mot de passe
};

// Créer le modèle User
const User = mongoose.model('User', userSchema);

export default User;
