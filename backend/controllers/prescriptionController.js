import Prescription from '../models/Prescription.js';
import User from '../models/User.js';
import PDFDocument from 'pdfkit';

// @desc    Créer une nouvelle ordonnance
// @route   POST /api/prescriptions
// @access  Private (Médecin)
export const createPrescription = async (req, res) => {
  try {
    const {
      patientId,
      appointmentId,
      medications,
      diagnosis,
      instructions,
      notes,
      expiryDate
    } = req.body;

    // Vérifier que l'utilisateur est un médecin
    if (req.user.role !== 'medecin') {
      return res.status(403).json({
        success: false,
        message: "Seuls les médecins peuvent créer des ordonnances"
      });
    }

    // Vérifier que le patient existe
    const patient = await User.findById(patientId);
    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({
        success: false,
        message: "Patient non trouvé"
      });
    }

    // Créer l'ordonnance
    const prescription = await Prescription.create({
      patient: patientId,
      doctor: req.user._id,
      appointment: appointmentId,
      medications,
      diagnosis,
      instructions,
      notes,
      expiryDate: new Date(expiryDate)
    });

    // Populer les données pour la réponse
    await prescription.populate('patient', 'nom email');
    await prescription.populate('doctor', 'nom poste');

    res.status(201).json({
      success: true,
      message: "Ordonnance créée avec succès",
      data: prescription
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Obtenir les ordonnances d'un patient
// @route   GET /api/prescriptions/patient/:patientId
// @access  Private (Médecin ou Patient concerné)
export const getPatientPrescriptions = async (req, res) => {
  try {
    const { patientId } = req.params;
    
    // Vérifier les permissions
    if (req.user.role === 'patient' && req.user._id.toString() !== patientId) {
      return res.status(403).json({
        success: false,
        message: "Accès non autorisé à ces ordonnances"
      });
    }

    const prescriptions = await Prescription.find({ patient: patientId })
      .populate('patient', 'nom email')
      .populate('doctor', 'nom poste')
      .populate('appointment', 'date heure')
      .sort({ issuedDate: -1 });

    res.json({
      success: true,
      count: prescriptions.length,
      data: prescriptions
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Obtenir les ordonnances créées par un médecin
// @route   GET /api/prescriptions/doctor/my-prescriptions
// @access  Private (Médecin)
export const getMyPrescriptions = async (req, res) => {
  try {
    if (req.user.role !== 'medecin') {
      return res.status(403).json({
        success: false,
        message: "Accès réservé aux médecins"
      });
    }

    const prescriptions = await Prescription.find({ doctor: req.user._id })
      .populate('patient', 'nom email')
      .populate('appointment', 'date heure')
      .sort({ issuedDate: -1 });

    res.json({
      success: true,
      count: prescriptions.length,
      data: prescriptions
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Obtenir une ordonnance spécifique
// @route   GET /api/prescriptions/:id
// @access  Private (Médecin ou Patient concerné)
export const getPrescription = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('patient', 'nom email dateNaissance')
      .populate('doctor', 'nom poste specialite')
      .populate('appointment', 'date heure');

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: "Ordonnance non trouvée"
      });
    }

    // Vérifier les permissions
    if (req.user.role === 'patient' && 
        prescription.patient._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Accès non autorisé à cette ordonnance"
      });
    }

    res.json({
      success: true,
      data: prescription
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Générer un PDF d'ordonnance
// @route   GET /api/prescriptions/:id/pdf
// @access  Private (Médecin ou Patient concerné)
export const generatePrescriptionPDF = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('patient', 'nom prenom dateNaissance')
      .populate('doctor', 'nom prenom poste specialite numeroRPPS');

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: "Ordonnance non trouvée"
      });
    }

    // Vérifier les permissions
    if (req.user.role === 'patient' && 
        prescription.patient._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Accès non autorisé"
      });
    }

    // Créer le document PDF
    const doc = new PDFDocument({ margin: 50 });
    
    // Configurer les headers de la réponse
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 
      `inline; filename="ordonnance-${prescription._id}.pdf"`);

    // Pipe le PDF dans la réponse
    doc.pipe(res);

    // En-tête de l'ordonnance
    doc.fontSize(20).font('Helvetica-Bold')
       .text('ORDONNANCE MÉDICALE', { align: 'center' });
    
    doc.moveDown();
    doc.fontSize(12).font('Helvetica')
       .text(`Date: ${prescription.issuedDate.toLocaleDateString('fr-FR')}`);
    doc.text(`Médecin: Dr ${prescription.doctor.prenom} ${prescription.doctor.nom}`);
    doc.text(`Spécialité: ${prescription.doctor.specialite || 'Médecine Générale'}`);
    doc.text(`RPPS: ${prescription.doctor.numeroRPPS || 'Non renseigné'}`);
    
    doc.moveDown();
    doc.text(`Patient: ${prescription.patient.prenom} ${prescription.patient.nom}`);
    doc.text(`Date de naissance: ${prescription.patient.dateNaissance ? new Date(prescription.patient.dateNaissance).toLocaleDateString('fr-FR') : 'Non renseignée'}`);

    // Diagnostic
    doc.moveDown();
    doc.font('Helvetica-Bold').text('DIAGNOSTIC:');
    doc.font('Helvetica').text(prescription.diagnosis);

    // Médicaments
    doc.moveDown();
    doc.font('Helvetica-Bold').text('TRAITEMENT PRESCRIT:');
    
    prescription.medications.forEach((med, index) => {
      doc.moveDown(0.5);
      doc.font('Helvetica-Bold').text(`${index + 1}. ${med.name}`);
      doc.font('Helvetica')
         .text(`   Posologie: ${med.dosage}`)
         .text(`   Fréquence: ${med.frequency}`)
         .text(`   Durée: ${med.duration}`);
      
      if (med.instructions) {
        doc.text(`   Instructions: ${med.instructions}`);
      }
    });

    // Instructions générales
    if (prescription.instructions) {
      doc.moveDown();
      doc.font('Helvetica-Bold').text('INSTRUCTIONS GÉNÉRALES:');
      doc.font('Helvetica').text(prescription.instructions);
    }

    // Notes
    if (prescription.notes) {
      doc.moveDown();
      doc.font('Helvetica-Bold').text('OBSERVATIONS:');
      doc.font('Helvetica').text(prescription.notes);
    }

    // Pied de page
    doc.moveDown(2);
    doc.fontSize(10)
       .text(`Ordonnance valable jusqu'au: ${prescription.expiryDate.toLocaleDateString('fr-FR')}`, { align: 'center' })
       .text('Signature et cachet du médecin', { align: 'right' });

    // Mettre à jour le compteur d'impression
    prescription.printCount += 1;
    prescription.isPrinted = true;
    await prescription.save();

    doc.end();

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Mettre à jour une ordonnance
// @route   PUT /api/prescriptions/:id
// @access  Private (Médecin auteur)
export const updatePrescription = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: "Ordonnance non trouvée"
      });
    }

    // Vérifier que le médecin est l'auteur de l'ordonnance
    if (prescription.doctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Vous n'êtes pas autorisé à modifier cette ordonnance"
      });
    }

    // Empêcher la modification d'ordonnances imprimées
    if (prescription.isPrinted) {
      return res.status(400).json({
        success: false,
        message: "Impossible de modifier une ordonnance déjà imprimée"
      });
    }

    const updatedPrescription = await Prescription.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('patient', 'nom email')
     .populate('doctor', 'nom poste');

    res.json({
      success: true,
      message: "Ordonnance mise à jour avec succès",
      data: updatedPrescription
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Supprimer une ordonnance
// @route   DELETE /api/prescriptions/:id
// @access  Private (Médecin auteur ou Admin)
export const deletePrescription = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: "Ordonnance non trouvée"
      });
    }

    // Vérifier les permissions
    const isAuthor = prescription.doctor.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    
    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Non autorisé à supprimer cette ordonnance"
      });
    }

    await Prescription.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Ordonnance supprimée avec succès"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};