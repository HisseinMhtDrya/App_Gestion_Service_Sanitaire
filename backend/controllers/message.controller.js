// import Message from "../models/Message.js";

// export const getMessages = async (req, res) => {
//   const messages = await Message.find({
//     $or: [{ sender: req.user.id }, { receiver: req.user.id }]
//   }).populate("sender receiver");
//   res.json(messages);
// };

// export const sendMessage = async (req, res) => {
//   const { receiver, content } = req.body;
//   const message = new Message({ sender: req.user.id, receiver, content });
//   await message.save();
//   res.status(201).json(message);
// };

// export const markAsRead = async (req, res) => {
//   const message = await Message.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
//   res.json(message);
// };
