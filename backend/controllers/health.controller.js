// import HealthData from "../models/HealthData.js";

// export const getHealthData = async (req, res) => {
//   const data = await HealthData.find({ user: req.user.id });
//   res.json(data);
// };

// export const addHealthData = async (req, res) => {
//   const entry = new HealthData({ ...req.body, user: req.user.id });
//   await entry.save();
//   res.status(201).json(entry);
// };

// export const updateHealthData = async (req, res) => {
//   const entry = await HealthData.findByIdAndUpdate(req.params.id, req.body, { new: true });
//   res.json(entry);
// };

// export const deleteHealthData = async (req, res) => {
//   await HealthData.findByIdAndDelete(req.params.id);
//   res.json({ message: "Health data removed" });
// };
