const nodemailer = require('nodemailer');
const crypto = require('crypto');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // ton email: hisseinmhtdrya@gmail.com
    pass: process.env.EMAIL_PASS  // mot de passe d'application si 2FA activé
  }
});

// Fonction existante : envoi email de vérification
const sendVerificationEmail = async (to, token) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: to,
    subject: 'Vérification de votre email',
    text: `Votre code de vérification est : ${token}`
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email de vérification envoyé');
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    throw error;
  }
};

// Fonction existante : notification admin
const sendAdminNotification = async (message) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.ADMIN_EMAIL,
    subject: 'Notification Administrateur',
    text: message
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Notification admin envoyée');
  } catch (error) {
    console.error('Erreur notification admin:', error);
    throw error;
  }
};

// --- Nouvelle fonction : envoi OTP toujours à ton email ---
const generateOTP = () => crypto.randomInt(100000, 999999).toString();

const sendOTP = async () => {
  const otp = generateOTP();

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: 'hisseinmhtdrya@gmail.com', // <-- forcé
    subject: 'Votre code OTP',
    text: `Voici votre code OTP : ${otp}`
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('OTP envoyé à hisseinmhtdrya@gmail.com :', otp);
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'OTP :', error);
    throw error;
  }

  return otp; // tu peux stocker dans la BD si nécessaire
};

module.exports = {
  sendVerificationEmail,
  sendAdminNotification,
  sendOTP // <-- export de la nouvelle fonction
};
