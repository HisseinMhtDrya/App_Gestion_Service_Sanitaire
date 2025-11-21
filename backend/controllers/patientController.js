// backend/controllers/patientController.js
import User from '../models/User.js';

export const getCurrentPatient = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(404).json({ success: false, message: "Patient non trouvé" });
    }
    res.json(req.user);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
