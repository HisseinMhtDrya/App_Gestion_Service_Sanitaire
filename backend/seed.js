import mongoose from "mongoose";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";

// import Doctor from "./models/Doctor.js";
// import Patient from "./models/Patient.js"; 
// import Appointment from "./models/Appointment.js";

// Configuration temporaire du modèle Doctor (remplacez par votre vraie import)
const doctorSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  specialite: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  telephone: { type: String, required: true },
  adresse: String,
  description: String,
  disponible: { type: Boolean, default: true }
}, {
  timestamps: true
});

const Doctor = mongoose.model('Doctor', doctorSchema);

// Configuration
dotenv.config();

async function seed() {
  try {
    console.log('Démarrage du script de seed...');
    
    // Connexion à MongoDB
    await connectDB();
    console.log('✅ Connecté à MongoDB');

    // Nettoyer les collections existantes
    console.log('Nettoyage des collections...');
    await Doctor.deleteMany({});
    console.log('Collection doctors vidée');

    // Créer des docteurs de test
    console.log('👨‍⚕️ Création des docteurs...');
    const doctors = await Doctor.insertMany([
      {
        nom: "Dr. Hissein",
        specialite: "Cardiologue",
        email: "hissein.mht.drya@gmail.com",
        telephone: "65458745",
        adresse: "123 Rue de la Santé, N'Djamena",
        description: "Spécialiste en cardiologie avec 10 ans d'expérience",
        disponible: true
      },
      {
        nom: "Dr. Martin",
        specialite: "Dermatologue", 
        email: "martin@hopital.com",
        telephone: "0605060708",
        adresse: "456 Avenue Médicale, N'Djamena",
        description: "Expert en dermatologie et chirurgie esthétique",
        disponible: true
      },
      {
        nom: "Dr. Sarah Johnson",
        specialite: "Pédiatre",
        email: "sarah.johnson@pediatrie.com",
        telephone: "0612345678",
        adresse: "789 Boulevard des Enfants, N'Djamena",
        description: "Pédiatre spécialisée dans le développement infantile",
        disponible: true
      },
      {
        nom: "Dr. Ahmed Hassan",
        specialite: "Neurologue",
        email: "ahmed.hassan@neuro.com",
        telephone: "0698765432",
        adresse: "321 Rue Neurologique, N'Djamena", 
        description: "Neurologue expert en troubles du système nerveux",
        disponible: false
      },
      {
        nom: "Dr. Marie Dubois",
        specialite: "Gynécologue",
        email: "marie.dubois@gyneco.com",
        telephone: "0687654321",
        adresse: "654 Avenue Féminine, N'Djamena",
        description: "Spécialiste en gynécologie et obstétrique",
        disponible: true
      }
    ]);

    console.log(`✅ ${doctors.length} docteurs créés avec succès !`);
    
    // Affichage des données créées
    console.log('\n📋 Liste des docteurs créés:');
    doctors.forEach((doctor, index) => {
      console.log(`${index + 1}. ${doctor.nom} - ${doctor.specialite} (${doctor.email})`);
    });

    console.log('\n Seed terminé avec succès !');
    console.log(' Vous pouvez maintenant tester votre API sur: http://localhost:5000/api/doctors');
    
    process.exit(0);
    
  } catch (err) {
    console.error('❌ Erreur lors du seed:', err);
    process.exit(1);
  }
}

// Gestion propre de l'arrêt du processus
process.on('SIGINT', () => {
  console.log('\n⚠️ Interruption du seed...');
  mongoose.connection.close(() => {
    console.log('Connexion MongoDB fermée');
    process.exit(0);
  });
});

// Exécution du seed
seed();