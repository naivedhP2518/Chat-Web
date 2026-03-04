const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const auth = require("../middleware/auth");

// GET /api/messages/:userId — fetch chat history between current user and another user
router.get("/:userId", auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user.id, receiver: req.params.userId },
        { sender: req.params.userId, receiver: req.user.id },
      ],
    })
      .populate("sender", "username email")
      .populate("receiver", "username email")
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/messages — save a new message
router.post("/", auth, async (req, res) => {
  const { receiver, message } = req.body;

  if (!receiver || !message) {
    return res.status(400).json({ message: "receiver and message are required" });
  }

  try {
    const newMessage = new Message({
      sender: req.user.id,
      receiver,
      message,
    });

    const saved = await newMessage.save();

    const populated = await saved
      .populate("sender", "username email")
      .then((m) => m.populate("receiver", "username email"));

    res.status(201).json(populated);
  } catch (err) {
    console.error("Error saving message:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
