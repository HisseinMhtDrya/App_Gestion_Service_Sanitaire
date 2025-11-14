import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import sendEmail from "../utils/sendEmail.js";
import otpGenerator from 'otp-generator';

// @desc    Inscription utilisateur avec validation par OTP
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const { nom, email, password, poste, role } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "Un utilisateur avec cet email existe déjà",
      });
    }

    // Générer un OTP et l'expiration
    const otp = otpGenerator.generate(6, { digits: true, specialChars: false, upperCase: false });
    const otpExpiration = new Date(Date.now() + process.env.OTP_EXPIRATION_MINUTES * 60000);

    // Créer l'utilisateur mais avec OTP en attente
    const user = await User.create({
      nom,
      email,
      password,
      poste,
      role: role || "membre",
      otp: otp,  // Stocker l'OTP
      otpExpiration: otpExpiration,  // Stocker la date d'expiration
      isActive: false,  // Ne pas activer le compte tout de suite
    });

    // Envoi de l'OTP par email
    const subject = "Votre code OTP pour valider votre inscription";
    const text = `Voici votre code OTP : ${otp}\nIl expire dans ${process.env.OTP_EXPIRATION_MINUTES} minutes.`;

    await sendEmail(email, subject, text);

    res.status(201).json({
      success: true,
      message: "Un OTP a été envoyé à votre email pour valider votre inscription",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Vérifier l'OTP et activer le compte utilisateur
// @route   POST /api/auth/verify-otp
// @access  Public
export const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    // Vérifier si les champs nécessaires sont présents
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Veuillez fournir un e-mail et un OTP",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
    }

    // Vérifier si l'OTP est correct
    if (user.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "OTP incorrect",
      });
    }

    // Vérifier si l'OTP est expiré
    if (user.otpExpiration < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "OTP expiré. Veuillez demander un nouveau code.",
      });
    }

    // Activer le compte de l'utilisateur
    user.isActive = true;
    user.otp = undefined;  // Supprimer l'OTP après vérification
    user.otpExpiration = undefined;  // Supprimer l'expiration de l'OTP

    await user.save();

    // Répondre avec un token JWT
    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        nom: user.nom,
        email: user.email,
        role: user.role,
        poste: user.poste,
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la vérification de l'OTP",
    });
  }
};

// @desc    Connexion utilisateur
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Veuillez fournir un email et un mot de passe",
      });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.correctPassword(password, user.password))) {
      return res.status(401).json({
        success: false,
        message: "Email ou mot de passe incorrect",
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Compte désactivé. Contactez l'administrateur.",
      });
    }

    res.json({
      success: true,
      data: {
        _id: user._id,
        nom: user.nom,
        email: user.email,
        role: user.role,
        poste: user.poste,
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la connexion",
    });
  }
};

// @desc    Récupérer le profil utilisateur connecté
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    // Vérifie si l'utilisateur est authentifié
    if (!req.user) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    // Retourne les informations de l'utilisateur connecté
    res.status(200).json({
      id: req.user._id,
      nom: req.user.nom,
      email: req.user.email,
      poste: req.user.poste,
    });
  } catch (error) {
    console.error("Erreur dans getMe :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
