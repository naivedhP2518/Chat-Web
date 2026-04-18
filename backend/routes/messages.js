const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const auth = require("../middleware/auth");
const mongoose = require("mongoose");

// Middleware to validate ObjectId parameters
const validateObjectId = (paramNames) => {
  return (req, res, next) => {
    for (const name of paramNames) {
      const id = req.params[name];
      if (id && !mongoose.Types.ObjectId.isValid(id)) {
        console.warn(`[Validation] Invalid ObjectId detected in param '${name}': ${id}`);
        return res.status(400).json({ message: `Invalid ID format for ${name}` });
      }
    }
    next();
  };
};

// GET /api/messages/conversations - fetch sidebar conversation summaries
router.get("/conversations", auth, async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const latestMessages = await Message.find({
      $or: [{ sender: currentUserId }, { receiver: currentUserId }],
    })
      .populate("sender", "username email")
      .populate("receiver", "username email")
      .sort({ createdAt: -1 });

    const conversationMap = new Map();

    for (const message of latestMessages) {
      const senderId = message.sender._id.toString();
      const receiverId = message.receiver._id.toString();
      const otherUser =
        senderId === currentUserId ? message.receiver : message.sender;
      const otherUserId = otherUser._id.toString();

      if (conversationMap.has(otherUserId)) continue;

      conversationMap.set(otherUserId, {
        _id: otherUser._id,
        username: otherUser.username,
        email: otherUser.email,
        lastMessage: message.isDeleted ? "Message removed" : message.message,
        lastMessageAt: message.createdAt,
        unreadCount: 0,
      });
    }

    res.json(Array.from(conversationMap.values()));
  } catch (err) {
    console.error("Error fetching conversations:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/messages/:userId — fetch chat history between current user and another user
router.get("/:userId", auth, validateObjectId(["userId"]), async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user.id, receiver: req.params.userId },
        { sender: req.params.userId, receiver: req.user.id },
      ],
    })
      .populate("sender", "username email")
      .populate("receiver", "username email")
      .populate({
        path: "replyTo",
        populate: { path: "sender", select: "username" }
      })
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/messages — save a new message
router.post("/", auth, async (req, res) => {
  const { receiver, message, replyTo } = req.body;

  if (!receiver || !message) {
    return res.status(400).json({ message: "receiver and message are required" });
  }

  try {
    const newMessage = new Message({
      sender: req.user.id,
      receiver,
      message,
      replyTo: replyTo || null,
    });

    const saved = await newMessage.save();

    const populated = await saved
      .populate("sender", "username email")
      .then((m) => m.populate("receiver", "username email"))
      .then((m) => m.populate({
        path: "replyTo",
        populate: { path: "sender", select: "username" }
      }));

    // Broadcast message via Socket.IO
    const io = req.app.get("io");
    if (io) {
      // Emit to sender's room
      io.to(req.user.id).emit("onMessage", populated);
      // Emit to receiver's room
      io.to(receiver).emit("onMessage", populated);
    }

    res.status(201).json(populated);
  } catch (err) {
    console.error("Error saving message:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/messages/:userId — clear chat history between current user and another user
router.delete("/:userId", auth, validateObjectId(["userId"]), async (req, res) => {
  try {
    await Message.deleteMany({
      $or: [
        { sender: req.user.id, receiver: req.params.userId },
        { sender: req.params.userId, receiver: req.user.id },
      ],
    });
    res.json({ message: "Chat cleared successfully" });
  } catch (err) {
    console.error("Error clearing chat:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/messages/single/:messageId — delete a specific message
router.delete("/single/:messageId", auth, validateObjectId(["messageId"]), async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Only the sender can delete their own message
    if (message.sender.toString() !== req.user.id) {
      return res.status(401).json({ message: "Unauthorized to delete this message" });
    }

    const { receiver } = message;

    // Remove message from database
    await Message.findByIdAndDelete(req.params.messageId);

    // Broadcast deletion via Socket.IO
    const io = req.app.get("io");
    if (io) {
      const payload = { messageId: req.params.messageId };
      io.to(req.user.id).emit("messageDeleted", payload);
      io.to(receiver.toString()).emit("messageDeleted", payload);
    }

    res.json({ message: "Message deleted successfully", messageId: req.params.messageId });
  } catch (err) {
    console.error("Error deleting individual message:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
