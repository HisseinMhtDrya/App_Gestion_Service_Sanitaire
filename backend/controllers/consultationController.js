import Consultation from '../models/Consultation.js';
import Prescription from '../models/Prescription.js';
import User from '../models/User.js';

// Créer une consultation
export const createConsultation = async (req, res) => {
  try {
    const { patientId, appointmentId, diagnosis, notes, prescriptions } = req.body;

    // Vérifier que le patient existe
    const patient = await User.findById(patientId);
    if (!patient) return res.status(404).json({ success: false, message: "Patient non trouvé" });

    // Créer l'ordonnance si nécessaire
    let prescriptionDoc = null;
    if (prescriptions && prescriptions.length > 0) {
      prescriptionDoc = await Prescription.create({
        patient: patientId,
        doctor: req.user._id,
        appointment: appointmentId,
        medications: prescriptions,
        diagnosis,
        notes,
        issuedDate: new Date(),
        expiryDate: new Date(Date.now() + 30*24*60*60*1000), // par défaut 30 jours
        isPrinted: false,
        printCount: 0,
        status: 'active'
      });
    }

    // Créer la consultation
    const consultation = await Consultation.create({
      patient: patientId,
      doctor: req.user._id,
      appointment: appointmentId,
      diagnosis,
      notes,
      prescription: prescriptionDoc?._id,
      date: new Date()
    });

    res.status(201).json({ success: true, data: consultation });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Récupérer les consultations du médecin
export const getMyConsultations = async (req, res) => {
  try {
    const consultations = await Consultation.find({ doctor: req.user._id })
      .populate('patient', 'nom email')
      .populate('prescription');

    res.status(200).json({ success: true, data: consultations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Récupérer une consultation spécifique
export const getConsultationById = async (req, res) => {
  try {
    const consultation = await Consultation.findOne({ _id: req.params.id, doctor: req.user._id })
      .populate('patient', 'nom email')
      .populate('prescription');

    if (!consultation) return res.status(404).json({ success: false, message: 'Consultation non trouvée' });

    res.status(200).json({ success: true, data: consultation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mettre à jour une consultation
export const updateConsultation = async (req, res) => {
  try {
    const consultation = await Consultation.findOne({ _id: req.params.id, doctor: req.user._id });
    if (!consultation) return res.status(404).json({ success: false, message: 'Consultation non trouvée' });

    Object.assign(consultation, req.body); // Mettre à jour les champs
    await consultation.save();

    res.status(200).json({ success: true, data: consultation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
