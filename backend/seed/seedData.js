const mongoose = require("mongoose");
const doctor = require("../models/Doctor");
const Patient = require("../models/Patient");
const RendezVous = require("../models/RendezVous");

async function seed() {
  try {
    // Connexion à MongoDB
    await mongoose.connect("mongodb://127.0.0.1:27017/projet_sante", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("Connecté à MongoDB");

    // Nettoyer les collections
    await Medecin.deleteMany();
    await Patient.deleteMany();
    await RendezVous.deleteMany();

    console.log(" Collections vidées");

    // Créer des médecins
    const medecins = await Medecin.insertMany([
      { nom: "Dr. hissein", specialite: "Cardiologue", email: "hisseinmht drya@gmail.com", telephone: "65458745" },
      { nom: "Dr. Martin", specialite: "Dermatologue", email: "martin@hopital.com", telephone: "0605060708" }
    ]);

    // Créer des patients
    const patients = await Patient.insertMany([
      { nom: "Jean Pierre", age: 35, email: "jean@exemple.com", telephone: "0612345678" },
      { nom: "Marie Claire", age: 28, email: "marie@exemple.com", telephone: "0698765432" }
    ]);

    // Créer des rendez-vous
    await RendezVous.insertMany([
      { date: new Date("2025-09-01T10:00:00"), medecin: medecins[0]._id, patient: patients[0]._id, motif: "Consultation cardiaque" },
      { date: new Date("2025-09-02T14:00:00"), medecin: medecins[1]._id, patient: patients[1]._id, motif: "Problème de peau" }
    ]);

    console.log(" Données insérées avec succès !");
    process.exit();

  } catch (err) {
    console.error(" Erreur lors du seed :", err);
    process.exit(1);
  }
}

seed();
