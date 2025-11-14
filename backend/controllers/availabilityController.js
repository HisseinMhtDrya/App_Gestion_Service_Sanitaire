import Availability from '../models/Availability.js';

// @desc    Créer ou mettre à jour les créneaux de disponibilité
// @route   POST /api/availability
// @access  Private (Médecin)
export const createAvailability = async (req, res) => {
  try {
    const { date, startTime, endTime, duration = 30 } = req.body;
    const medecinId = req.user._id;

    // Vérifier que l'utilisateur est un médecin
    if (req.user.role !== 'medecin') {
      return res.status(403).json({
        success: false,
        message: "Accès réservé aux médecins",
      });
    }

    // Générer les créneaux
    const slots = generateSlotsForDay(date, startTime, endTime, duration);
    
    const createdSlots = [];

    // Créer chaque créneau
    for (const slot of slots) {
      const availability = await Availability.findOneAndUpdate(
        {
          medecin: medecinId,
          date: date,
          startTime: slot.startTime
        },
        {
          medecin: medecinId,
          date: date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          duration: duration,
          isAvailable: true
        },
        { upsert: true, new: true }
      );
      createdSlots.push(availability);
    }

    res.status(201).json({
      success: true,
      data: createdSlots,
      message: `${createdSlots.length} créneaux créés/mis à jour avec succès`,
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Obtenir mes créneaux (pour le médecin connecté)
// @route   GET /api/availability/my-availability
// @access  Private (Médecin)
export const getMyAvailability = async (req, res) => {
  try {
    const medecinId = req.user._id;
    const { date } = req.query;

    let query = { medecin: medecinId };
    
    if (date) {
      query.date = date;
    }

    const slots = await Availability.find(query)
      .sort({ date: 1, startTime: 1 });

    res.status(200).json({
      success: true,
      data: slots,
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Mettre à jour un créneau
// @route   PUT /api/availability/:id
// @access  Private (Médecin)
export const updateAvailability = async (req, res) => {
  try {
    const { isAvailable } = req.body;
    const slotId = req.params.id;
    const medecinId = req.user._id;

    const slot = await Availability.findOne({ _id: slotId, medecin: medecinId });

    if (!slot) {
      return res.status(404).json({
        success: false,
        message: "Créneau non trouvé",
      });
    }

    if (isAvailable !== undefined) {
      slot.isAvailable = isAvailable;
    }

    await slot.save();

    res.status(200).json({
      success: true,
      data: slot,
      message: "Créneau mis à jour avec succès",
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Supprimer un créneau
// @route   DELETE /api/availability/:id
// @access  Private (Médecin)
export const deleteAvailability = async (req, res) => {
  try {
    const slotId = req.params.id;
    const medecinId = req.user._id;

    const slot = await Availability.findOneAndDelete({ _id: slotId, medecin: medecinId });

    if (!slot) {
      return res.status(404).json({
        success: false,
        message: "Créneau non trouvé",
      });
    }

    res.status(200).json({
      success: true,
      message: "Créneau supprimé avec succès",
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Fonction utilitaire pour générer les créneaux
function generateSlotsForDay(date, startTime, endTime, duration) {
  const slots = [];
  const start = new Date(`${date}T${startTime}`);
  const end = new Date(`${date}T${endTime}`);
  
  let currentTime = new Date(start);
  
  while (currentTime < end) {
    const slotEnd = new Date(currentTime.getTime() + duration * 60000);
    
    if (slotEnd <= end) {
      slots.push({
        startTime: currentTime.toTimeString().slice(0, 5),
        endTime: slotEnd.toTimeString().slice(0, 5)
      });
    }
    
    currentTime = slotEnd;
  }
  
  return slots;
}