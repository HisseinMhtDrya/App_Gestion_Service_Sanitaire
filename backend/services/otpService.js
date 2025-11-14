const crypto = require('crypto');
const { sendVerificationEmail, sendAdminNotification } = require('./emailService');

// Stockage en mémoire (à remplacer par une base de données en production)
const otpStore = new Map();

const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

const sendVerification = async (email, phoneNumber) => {
  const otp = generateOTP();
  
  // Stocker l'OTP avec une expiration (10 minutes)
  otpStore.set(email, {
    otp,
    expiresAt: Date.now() + 600000, // 10 minutes
    phoneNumber
  });
  
  // Envoyer à l'email de l'utilisateur
  await sendVerificationEmail(email, otp);
  
  // Notifier l'admin
  await sendAdminNotification(
    `Nouvelle demande de vérification:\n` +
    `Email: ${email}\n` +
    `Téléphone: ${phoneNumber}\n` +
    `Code OTP: ${otp}`
  );
  
  return otp;
};

const verifyOTP = (email, otp) => {
  const storedData = otpStore.get(email);
  
  if (!storedData) {
    return { valid: false, message: 'Aucune demande OTP trouvée' };
  }
  
  // Vérifier l'expiration
  if (Date.now() > storedData.expiresAt) {
    otpStore.delete(email);
    return { valid: false, message: 'Le code a expiré' };
  }
  
  // Vérifier le code
  if (storedData.otp !== otp) {
    return { valid: false, message: 'Code OTP invalide' };
  }
  
  // Code valide, on supprime de la mémoire
  otpStore.delete(email);
  return { valid: true, message: 'Code OTP valide' };
};

module.exports = {
  sendVerification,
  verifyOTP,
  generateOTP
};
