import Appointment from '../models/appointmen.js';



export const getAllPatientsWithAppointments = async (req, res) => {
  try {
    const patients = await Patient.find().lean();

    const appointments = await Appointment.find().lean();

    // Associer rendez-vous à chaque patient
    const patientsWithAppointments = patients.map(patient => ({
      ...patient,
      appointments: appointments.filter(a => a.patientId?.toString() === patient._id.toString())
    }));

    res.json(patientsWithAppointments);

  } catch (error) {
    console.error("Erreur backend:", error);
    res.status(500).json({ message: "Erreur serveur lors du chargement des patients." });
  }
};
