// utils/reminderService.js (version mise à jour)
import cron from 'node-cron';
import Appointment from '../models/appointmen.js';
import sendEmail from './sendEmail.js';

// Fonction pour envoyer les rappels
export const sendAppointmentReminders = async () => {
  try {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Format de date pour la recherche (YYYY-MM-DD)
    const tomorrowDate = tomorrow.toISOString().split('T')[0];

    // Trouver les rendez-vous confirmés pour demain
    const appointments = await Appointment.find({
      date: tomorrowDate,
      status: 'confirme',
      rappelEnvoye: false
    }).populate('patient', 'nom email')
      .populate('medecin', 'nom email poste');

    let sentCount = 0;

    for (const appointment of appointments) {
      const subject = "Rappel de rendez-vous médical";
      const text = `Bonjour ${appointment.patient.nom},\n\nRappel: Vous avez un rendez-vous demain (${appointment.date}) à ${appointment.heure} avec le Dr. ${appointment.medecin.nom}.\n\nMotif: ${appointment.motif}\n\nMerci de votre ponctualité.`;

      try {
        await sendEmail(appointment.patient.email, subject, text);
        
        // Marquer le rappel comme envoyé
        appointment.rappelEnvoye = true;
        await appointment.save();
        
        console.log(`📧 Rappel envoyé à: ${appointment.patient.email}`);
        sentCount++;
      } catch (emailError) {
        console.error(`❌ Erreur envoi email à ${appointment.patient.email}:`, emailError);
      }
    }

    console.log(`✅ ${sentCount} rappels de rendez-vous envoyés`);
    return sentCount;
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi des rappels:', error);
    throw error;
  }
};

// Version pour déclenchement manuel
export const manualSendReminders = async (req, res) => {
  try {
    const sentCount = await sendAppointmentReminders();
    res.status(200).json({
      success: true,
      message: `${sentCount} rappels envoyés avec succès`,
      data: { sentCount }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'envoi des rappels"
    });
  }
};

// Planifier l'envoi des rappels tous les jours à 8h du matin
if (process.env.NODE_ENV !== 'test') {
  cron.schedule('0 8 * * *', () => {
    console.log('🕐 Exécution du service de rappels...');
    sendAppointmentReminders();
  });
}

console.log('🕐 Service de rappels initialisé');