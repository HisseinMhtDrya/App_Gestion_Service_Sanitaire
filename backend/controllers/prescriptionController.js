import Prescription from '../models/Prescription.js';
import User from '../models/User.js';
import PDFDocument from 'pdfkit';

// @desc    Créer une nouvelle ordonnance
// @route   POST /api/prescriptions
// @access  Private (Médecin ou Admin)
export const createPrescription = async (req, res) => {
  try {
    console.log('User creating prescription:', req.user);
    console.log('Request body:', req.body);

    const { patientId, appointmentId, medications, diagnosis, instructions, notes, expiryDate } = req.body;

    // Vérifier que l'utilisateur est médecin ou admin
    if (!['medecin', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: "Seuls les médecins ou administrateurs peuvent créer des ordonnances" 
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

    const prescription = await Prescription.create({
      patient: patientId,
      doctor: req.user._id,
      appointment: appointmentId,
      medications,
      diagnosis,
      instructions,
      notes,
      expiryDate: new Date(expiryDate),
      issuedDate: new Date(),
      status: 'active',
      isPrinted: false,
      printCount: 0
    });

    await prescription.populate('patient', 'nom prenom email telephone');
    await prescription.populate('doctor', 'nom prenom poste specialite');

    res.status(201).json({ 
      success: true, 
      message: "Ordonnance créée avec succès", 
      data: prescription 
    });

  } catch (error) {
    console.error('Erreur création ordonnance:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Obtenir les ordonnances d'un patient
// @route   GET /api/prescriptions/patient/:patientId
// @access  Private (Médecin, Admin ou Patient concerné)
export const getPatientPrescriptions = async (req, res) => {
  try {
    const { patientId } = req.params;
    console.log('Getting prescriptions for patient:', patientId, 'User:', req.user._id, 'Role:', req.user.role);

    // Vérifier les autorisations
    if (req.user.role === 'patient' && req.user._id.toString() !== patientId) {
      return res.status(403).json({ 
        success: false, 
        message: "Accès non autorisé à ces ordonnances" 
      });
    }

    // Pour les médecins et admins, vérifier qu'ils ont accès à ce patient
    if (['medecin', 'admin'].includes(req.user.role)) {
      const patient = await User.findById(patientId);
      if (!patient) {
        return res.status(404).json({ 
          success: false, 
          message: "Patient non trouvé" 
        });
      }
    }

    const prescriptions = await Prescription.find({ patient: patientId })
      .populate('patient', 'nom prenom email telephone dateNaissance')
      .populate('doctor', 'nom prenom poste specialite')
      .populate('appointment', 'date heure motif')
      .sort({ issuedDate: -1 });

    res.json({ 
      success: true, 
      count: prescriptions.length, 
      data: prescriptions 
    });

  } catch (error) {
    console.error('Erreur récupération ordonnances patient:', error);
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
    console.log('Getting doctor prescriptions for user:', req.user._id, 'Role:', req.user.role);

    if (req.user.role !== 'medecin') {
      return res.status(403).json({ 
        success: false, 
        message: "Accès réservé aux médecins" 
      });
    }

    const prescriptions = await Prescription.find({ doctor: req.user._id })
      .populate('patient', 'nom prenom email telephone dateNaissance')
      .populate('appointment', 'date heure motif')
      .sort({ issuedDate: -1 });

    res.json({ 
      success: true, 
      count: prescriptions.length, 
      data: prescriptions 
    });

  } catch (error) {
    console.error('Erreur récupération ordonnances médecin:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Obtenir les ordonnances du patient connecté
// @route   GET /api/prescriptions/patient/my-prescriptions
// @access  Private (Patient)
export const getMyPatientPrescriptions = async (req, res) => {
  try {
    console.log('Getting patient prescriptions for user:', req.user._id, 'Role:', req.user.role);

    if (req.user.role !== 'patient') {
      return res.status(403).json({ 
        success: false, 
        message: "Accès réservé aux patients" 
      });
    }

    const prescriptions = await Prescription.find({ patient: req.user._id })
      .populate('doctor', 'nom prenom poste specialite etablissement')
      .populate('appointment', 'date heure motif')
      .sort({ issuedDate: -1 });

    res.json({ 
      success: true, 
      count: prescriptions.length, 
      data: prescriptions 
    });

  } catch (error) {
    console.error('Erreur récupération ordonnances patient connecté:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Obtenir une ordonnance spécifique
// @route   GET /api/prescriptions/:id
// @access  Private (Médecin, Admin ou Patient concerné)
export const getPrescription = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('patient', 'nom prenom email telephone dateNaissance adresse')
      .populate('doctor', 'nom prenom poste specialite etablissement numeroRPPS')
      .populate('appointment', 'date heure motif');

    if (!prescription) {
      return res.status(404).json({ 
        success: false, 
        message: "Ordonnance non trouvée" 
      });
    }

    console.log('Prescription patient:', prescription.patient._id.toString());
    console.log('Current user:', req.user._id.toString());
    console.log('User role:', req.user.role);

    // Vérifier les autorisations
    if (req.user.role === 'patient') {
      if (prescription.patient._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ 
          success: false, 
          message: "Accès non autorisé à cette ordonnance" 
        });
      }
    } else if (!['medecin', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: "Accès non autorisé" 
      });
    }

    res.json({ 
      success: true, 
      data: prescription 
    });

  } catch (error) {
    console.error('Erreur récupération ordonnance:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Générer un PDF d'ordonnance
// @route   GET /api/prescriptions/:id/pdf
// @access  Private (Médecin, Admin ou Patient concerné)
export const generatePrescriptionPDF = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('patient', 'nom prenom dateNaissance adresse')
      .populate('doctor', 'nom prenom poste specialite numeroRPPS etablissement');

    if (!prescription) {
      return res.status(404).json({ 
        success: false, 
        message: "Ordonnance non trouvée" 
      });
    }

    // Vérifier les autorisations
    if (req.user.role === 'patient') {
      if (prescription.patient._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ 
          success: false, 
          message: "Accès non autorisé à cette ordonnance" 
        });
      }
    } else if (!['medecin', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: "Accès non autorisé" 
      });
    }

    const doc = new PDFDocument({ 
      margin: 50,
      size: 'A4'
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="ordonnance-${prescription._id}.pdf"`);

    doc.pipe(res);

    // En-tête
    doc.fontSize(20).font('Helvetica-Bold').text('ORDONNANCE MÉDICALE', { align: 'center' });
    doc.moveDown();
    
    // Informations
    doc.fontSize(12).font('Helvetica')
       .text(`Date: ${prescription.issuedDate.toLocaleDateString('fr-FR')}`)
       .text(`Médecin: Dr ${prescription.doctor?.prenom || ''} ${prescription.doctor?.nom || ''}`)
       .text(`Spécialité: ${prescription.doctor?.specialite || 'Médecine Générale'}`)
       .moveDown()
       .text(`Patient: ${prescription.patient.prenom} ${prescription.patient.nom}`)
       .text(`Date de naissance: ${prescription.patient.dateNaissance ? new Date(prescription.patient.dateNaissance).toLocaleDateString('fr-FR') : 'Non renseignée'}`)
       .moveDown();

    // Diagnostic
    doc.font('Helvetica-Bold').text('DIAGNOSTIC:').font('Helvetica').text(prescription.diagnosis);

    // Médicaments
    doc.moveDown().font('Helvetica-Bold').text('TRAITEMENT PRESCRIT:');
    prescription.medications.forEach((med, index) => {
      doc.moveDown(0.5).font('Helvetica-Bold').text(`${index + 1}. ${med.name}`);
      doc.font('Helvetica')
         .text(`   Posologie: ${med.dosage}`)
         .text(`   Fréquence: ${med.frequency}`)
         .text(`   Durée: ${med.duration}`);
      if (med.instructions) doc.text(`   Instructions: ${med.instructions}`);
    });

    // Instructions générales
    if (prescription.instructions) {
      doc.moveDown().font('Helvetica-Bold').text('INSTRUCTIONS GÉNÉRALES:').font('Helvetica').text(prescription.instructions);
    }

    // Notes
    if (prescription.notes) {
      doc.moveDown().font('Helvetica-Bold').text('OBSERVATIONS:').font('Helvetica').text(prescription.notes);
    }

    // Pied de page
    doc.moveDown(2).fontSize(10)
       .text(`Ordonnance valable jusqu'au: ${prescription.expiryDate.toLocaleDateString('fr-FR')}`, { align: 'center' })
       .text('Signature et cachet du médecin', { align: 'right' });

    // Mise à jour compteur
    prescription.printCount += 1;
    prescription.isPrinted = true;
    await prescription.save();

    doc.end();

  } catch (error) {
    console.error('Erreur génération PDF:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};
// @desc    Mettre à jour une ordonnance
// @route   PUT /api/prescriptions/:id
// @access  Private (Médecin auteur ou Admin)
export const updatePrescription = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);
    
    if (!prescription) {
      return res.status(404).json({ 
        success: false, 
        message: "Ordonnance non trouvée" 
      });
    }

    // Vérifier les autorisations
    if (req.user.role !== 'admin' && prescription.doctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: "Non autorisé à modifier cette ordonnance" 
      });
    }

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
    )
      .populate('patient', 'nom prenom email telephone')
      .populate('doctor', 'nom prenom poste specialite');

    res.json({ 
      success: true, 
      message: "Ordonnance mise à jour avec succès", 
      data: updatedPrescription 
    });

  } catch (error) {
    console.error('Erreur mise à jour ordonnance:', error);
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

    // Vérifier les autorisations
    if (req.user.role !== 'admin' && prescription.doctor.toString() !== req.user._id.toString()) {
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
    console.error('Erreur suppression ordonnance:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};