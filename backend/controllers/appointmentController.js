import Appointment from '../models/Appointment.js';
import User from '../models/User.js';
import sendEmail from '../utils/sendEmail.js';
import Availability from '../models/Availability.js'; // <-- Ajoutez cette importation

// @desc    Créer un nouveau rendez-vous
// @route   POST /api/appointments
// @access  Private
export const createAppointment = async (req, res) => {
  try {
    const { medecinId, date, heure, motif, duree = 30 } = req.body;
    const patientId = req.user._id;

    // Vérifier si le médecin existe et est bien un médecin
    const medecin = await User.findById(medecinId);
    if (!medecin || medecin.role !== 'medecin') {
      return res.status(404).json({
        success: false,
        message: "Médecin non trouvé",
      });
    }

    // Vérifier si le patient existe
    const patient = await User.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient non trouvé",
      });
    }

    // Convertir la date et l'heure en objet Date
    const dateTime = new Date(`${date}T${heure}`);
    const now = new Date();

    // Vérifier que le rendez-vous est dans le futur
    if (dateTime <= now) {
      return res.status(400).json({
        success: false,
        message: "Le rendez-vous doit être dans le futur",
      });
    }

    // Vérifier la disponibilité du médecin
    const existingAppointment = await Appointment.findOne({
      medecin: medecinId,
      date: date,
      heure: heure,
      status: { $in: ['en_attente', 'confirme'] }
    });

    if (existingAppointment) {
      return res.status(400).json({
        success: false,
        message: "Le médecin n'est pas disponible à ce créneau",
      });
    }

    // Créer le rendez-vous
    const appointment = await Appointment.create({
      patient: patientId,
      medecin: medecinId,
      date: date,
      heure: heure,
      duree: duree,
      motif: motif,
      status: 'en_attente'
    });

    // Envoyer une notification au médecin
    const subject = "Nouvelle demande de rendez-vous";
    const text = `Vous avez une nouvelle demande de rendez-vous de ${patient.nom} pour le ${date} à ${heure}. Motif: ${motif}`;

    await sendEmail(medecin.email, subject, text);

    // Populer les données pour la réponse
    await appointment.populate('patient', 'nom email');
    await appointment.populate('medecin', 'nom email poste');

    res.status(201).json({
      success: true,
      data: appointment,
      message: "Rendez-vous créé avec succès, en attente de confirmation du médecin",
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Un rendez-vous existe déjà pour ce créneau",
      });
    }
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Valider ou refuser un rendez-vous
// @route   PUT /api/appointments/:id/validate
// @access  Private (Médecin seulement)
export const validateAppointment = async (req, res) => {
  try {
    const { status } = req.body; // 'confirme' ou 'annule'
    const appointmentId = req.params.id;
    const medecinId = req.user._id;

    // Vérifier que l'utilisateur est un médecin
    if (req.user.role !== 'medecin') {
      return res.status(403).json({
        success: false,
        message: "Accès non autorisé. Réservé aux médecins.",
      });
    }

    const appointment = await Appointment.findById(appointmentId)
      .populate('patient', 'nom email')
      .populate('medecin', 'nom email');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Rendez-vous non trouvé",
      });
    }

    // Vérifier que le médecin est bien celui associé au rendez-vous
    if (appointment.medecin._id.toString() !== medecinId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Vous n'êtes pas autorisé à modifier ce rendez-vous",
      });
    }

    // Mettre à jour le statut
    appointment.status = status;
    await appointment.save();

    // Envoyer une notification au patient
    const statusText = status === 'confirme' ? 'confirmé' : 'annulé';
    const subject = `Rendez-vous ${statusText}`;
    const text = `Votre rendez-vous du ${appointment.date} à ${appointment.heure} a été ${statusText} par le Dr. ${appointment.medecin.nom}.`;

    await sendEmail(appointment.patient.email, subject, text);

    res.status(200).json({
      success: true,
      data: appointment,
      message: `Rendez-vous ${statusText} avec succès`,
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Obtenir l'historique des rendez-vous
// @route   GET /api/appointments/history
// @access  Private
export const getAppointmentHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    const { page = 1, limit = 10, status } = req.query;

    let query = {};

    // Filtrer selon le rôle de l'utilisateur
    if (userRole === 'patient') {
      query.patient = userId;
    } else if (userRole === 'medecin') {
      query.medecin = userId;
    }

    // Filtrer par statut si fourni
    if (status) {
      query.status = status;
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { date: -1, heure: -1 },
      populate: [
        { path: 'patient', select: 'nom email' },
        { path: 'medecin', select: 'nom email poste' }
      ]
    };

    const appointments = await Appointment.find(query)
      .sort({ date: -1, heure: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('patient', 'nom email')
      .populate('medecin', 'nom email poste');

    const total = await Appointment.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        appointments,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      },
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Obtenir les disponibilités d'un médecin (version finale)
// @route   GET /api/appointments/availability/:medecinId
// @access  Private
export const getMedecinAvailability = async (req, res) => {
  try {
    const { medecinId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "La date est requise",
      });
    }

    // Vérifier si le modèle Availability existe (pour compatibilité)
    let availabilitySlots = [];
    try {
      availabilitySlots = await Availability.find({
        medecin: medecinId,
        date: date,
        isAvailable: true
      });
    } catch (error) {
      console.log('Modèle Availability non disponible, utilisation des créneaux par défaut');
    }

    // Récupérer les rendez-vous existants
    const appointments = await Appointment.find({
      medecin: medecinId,
      date: date,
      status: { $in: ['en_attente', 'confirme'] }
    });

    let availableSlots = [];

    if (availabilitySlots.length > 0) {
      // Utiliser les créneaux personnalisés du médecin
      const occupiedSlots = new Set(appointments.map(apt => apt.heure));
      availableSlots = availabilitySlots
        .filter(slot => !occupiedSlots.has(slot.startTime))
        .map(slot => slot.startTime);
    } else {
      // Générer les créneaux automatiquement (fallback)
      availableSlots = generateTimeSlots(date, appointments);
    }

    res.status(200).json({
      success: true,
      data: {
        date,
        availableSlots,
        medecinId,
        totalCustomSlots: availabilitySlots.length,
        totalAvailable: availableSlots.length
      },
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Mettre à jour un rendez-vous (notes, résultats)
// @route   PUT /api/appointments/:id
// @access  Private
export const updateAppointment = async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const { notes, resultats } = req.body;
    const userId = req.user._id;

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Rendez-vous non trouvé",
      });
    }

    // Vérifier les permissions
    const isMedecin = req.user.role === 'medecin' && appointment.medecin.toString() === userId.toString();
    const isPatient = req.user.role === 'patient' && appointment.patient.toString() === userId.toString();

    if (!isMedecin && !isPatient) {
      return res.status(403).json({
        success: false,
        message: "Accès non autorisé",
      });
    }

    // Mettre à jour les champs autorisés
    if (notes !== undefined) appointment.notes = notes;
    if (resultats !== undefined && isMedecin) {
      appointment.resultats = resultats;
    }

    await appointment.save();

    await appointment.populate('patient', 'nom email');
    await appointment.populate('medecin', 'nom email poste');

    res.status(200).json({
      success: true,
      data: appointment,
      message: "Rendez-vous mis à jour avec succès",
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Obtenir un rendez-vous spécifique par ID
// @route   GET /api/appointments/:id
// @access  Private
export const getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patient', 'nom email')
      .populate('medecin', 'nom email poste');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Rendez-vous non trouvé",
      });
    }

    // Vérifier les permissions
    const userId = req.user._id;
    const userRole = req.user.role;
    
    const isPatient = userRole === 'patient' && appointment.patient._id.toString() === userId.toString();
    const isMedecin = userRole === 'medecin' && appointment.medecin._id.toString() === userId.toString();
    const isAdmin = userRole === 'admin';

    if (!isPatient && !isMedecin && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Accès non autorisé à ce rendez-vous",
      });
    }

    res.status(200).json({
      success: true,
      data: appointment,
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Annuler un rendez-vous
// @route   PUT /api/appointments/:id/cancel
// @access  Private (Patient ou Médecin associé)
export const cancelAppointment = async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const userId = req.user._id;
    const userRole = req.user.role;

    const appointment = await Appointment.findById(appointmentId)
      .populate('patient', 'nom email')
      .populate('medecin', 'nom email');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Rendez-vous non trouvé",
      });
    }

    // Vérifier les permissions
    const isPatient = userRole === 'patient' && appointment.patient._id.toString() === userId.toString();
    const isMedecin = userRole === 'medecin' && appointment.medecin._id.toString() === userId.toString();

    if (!isPatient && !isMedecin) {
      return res.status(403).json({
        success: false,
        message: "Accès non autorisé",
      });
    }

    // Vérifier que le rendez-vous n'est pas déjà passé
    const appointmentDateTime = new Date(`${appointment.date}T${appointment.heure}`);
    const now = new Date();
    
    if (appointmentDateTime <= now) {
      return res.status(400).json({
        success: false,
        message: "Impossible d'annuler un rendez-vous déjà passé",
      });
    }

    // Annuler le rendez-vous
    appointment.status = 'annule';
    await appointment.save();

    // Envoyer une notification
    const subject = "Rendez-vous annulé";
    let text = '';
    
    if (isPatient) {
      text = `Le rendez-vous du ${appointment.date} à ${appointment.heure} avec le Dr. ${appointment.medecin.nom} a été annulé par le patient.`;
      await sendEmail(appointment.medecin.email, subject, text);
    } else if (isMedecin) {
      text = `Votre rendez-vous du ${appointment.date} à ${appointment.heure} avec le Dr. ${appointment.medecin.nom} a été annulé.`;
      await sendEmail(appointment.patient.email, subject, text);
    }

    res.status(200).json({
      success: true,
      data: appointment,
      message: "Rendez-vous annulé avec succès",
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Obtenir les rendez-vous d'un médecin (pour tableau de bord)
// @route   GET /api/appointments/medecin
// @access  Private (Médecin)
export const getMedecinAppointments = async (req, res) => {
  try {
    const medecinId = req.user._id;
    const { date, status, page = 1, limit = 10 } = req.query;

    let query = { medecin: medecinId };

    // Filtrer par date si fournie
    if (date) {
      query.date = date;
    }

    // Filtrer par statut si fourni
    if (status) {
      query.status = status;
    }

    const appointments = await Appointment.find(query)
      .sort({ date: 1, heure: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('patient', 'nom email poste');

    const total = await Appointment.countDocuments(query);

    // Statistiques pour le tableau de bord
    const today = new Date().toISOString().split('T')[0];
    const stats = {
      today: await Appointment.countDocuments({ 
        medecin: medecinId, 
        date: today,
        status: 'confirme'
      }),
      pending: await Appointment.countDocuments({ 
        medecin: medecinId, 
        status: 'en_attente' 
      }),
      confirmed: await Appointment.countDocuments({ 
        medecin: medecinId, 
        status: 'confirme' 
      }),
      total: await Appointment.countDocuments({ medecin: medecinId })
    };

    res.status(200).json({
      success: true,
      data: {
        appointments,
        stats,
        pagination: {
          totalPages: Math.ceil(total / limit),
          currentPage: parseInt(page),
          total
        }
      },
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Fonction utilitaire pour générer les créneaux horaires
function generateTimeSlots(date, appointments) {
  const slots = [];
  const startHour = 9; // 9h
  const endHour = 17; // 17h
  const slotDuration = 30; // 30 minutes

  // Convertir les rendez-vous existants en Set de créneaux occupés
  const occupiedSlots = new Set(
    appointments.map(apt => apt.heure)
  );

  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += slotDuration) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      
      if (!occupiedSlots.has(timeString)) {
        slots.push(timeString);
      }
    }
  }

  return slots;
}