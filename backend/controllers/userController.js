import User from "../models/User.js";

// @desc    Récupérer tous les utilisateurs
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ nom: 1 });

    res.json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des utilisateurs",
    });
  }
};

// @desc    Récupérer un utilisateur
// @route   GET /api/users/:id
// @access  Private
export const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
    }

    // Un utilisateur ne peut voir que son propre profil sauf si admin
    if (req.user.role !== "admin" && req.user.id !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: "Accès non autorisé à cette ressource",
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de l'utilisateur",
    });
  }
};

// @desc    Mettre à jour un utilisateur
// @route   PUT /api/users/:id
// @access  Private
export const updateUser = async (req, res) => {
  try {
    const { nom, email, poste, role, isActive } = req.body;

    let user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
    }

    // Vérifier les permissions : seul admin peut changer le rôle ou activer/désactiver un compte
    if (req.user.role !== "admin" && req.user.id !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: "Accès non autorisé",
      });
    }

    // Seul un admin peut changer le rôle ou le statut actif
    const updateData = { nom, email, poste };
    if (req.user.role === "admin") {
      if (role) updateData.role = role;
      if (isActive !== undefined) updateData.isActive = isActive;
    }

    // Mettre à jour l'utilisateur
    user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    // Gestion des erreurs (par exemple, pour les doublons d'email)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Un utilisateur avec cet email existe déjà",
      });
    }
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour de l'utilisateur",
    });
  }
};

// @desc    Récupérer tous les patients
// @route   GET /api/users/patients
// @access  Private/Medecin/Admin
export const getPatients = async (req, res) => {
  try {
    const patients = await User.find({ role: 'patient' }).select("-password").sort({ nom: 1 });
    
    res.json({
      success: true,
      count: patients.length,
      data: patients,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des patients",
    });
  }
};

// @desc    Récupérer tous les médecins
// @route   GET /api/users/medecins
// @access  Private
export const getMedecins = async (req, res) => {
  try {
    const medecins = await User.find({ role: "medecin" }).select("-password").sort({ nom: 1 });

    res.json({
      success: true,
      count: medecins.length,
      data: medecins,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des médecins",
    });
  }
};

// @desc    Récupérer le profil de l'utilisateur connecté
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération du profil de l'utilisateur",
    });
  }
};

// @desc    Mettre à jour le profil de l'utilisateur connecté
// @route   PUT /api/users/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
  try {
    const { nom, email, poste } = req.body;

    let user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
    }

    // Mettre à jour les informations
    user.nom = nom || user.nom;
    user.email = email || user.email;
    user.poste = poste || user.poste;

    // Enregistrer les modifications
    user = await user.save();

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour du profil",
    });
  }
};

// @desc    Supprimer un utilisateur
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
    }

    // Empêcher la suppression de son propre compte
    if (req.user.id === req.params.id) {
      return res.status(400).json({
        success: false,
        message: "Vous ne pouvez pas supprimer votre propre compte",
      });
    }

    // Supprimer l'utilisateur
    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Utilisateur supprimé avec succès",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression de l'utilisateur",
    });
  }
};

// Fonction générique pour récupérer les utilisateurs selon le rôle
export const getUsersByRole = (role) => async (req, res) => {
  try {
    const users = await User.find({ role });
    res.status(200).json({ success: true, data: users });
  } catch (err) {
    console.error('Erreur chargement utilisateurs:', err);
    res.status(500).json({ success: false, message: 'Erreur lors du chargement des utilisateurs', error: err.message });
  }
};