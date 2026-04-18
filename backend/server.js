// ── Force public DNS (bypasses college/ISP DNS that blocks MongoDB Atlas SRV lookups) ──
const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");
dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);

require("dotenv").config();
const express = require("express");
const http = require("http");
const socketio = require("socket.io");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const messageRoutes = require("./routes/messages");

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

// Setup Socket.IO with CORS
const io = socketio(server, {
  cors: {
    origin: "http://localhost:4200",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Expose io to routes
app.set("io", io);

// Middleware
app.use(cors({ origin: "http://localhost:4200", credentials: true }));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({ message: "Chat App API running" });
});

// Socket.IO — track online users
const onlineUsers = {};

io.on("connection", (socket) => {
  console.log("New socket connection:", socket.id);

  // User comes online
  socket.on("userOnline", (userId) => {
    onlineUsers[userId] = socket.id;
    socket.join(userId); // Join a room named after the userId for private broadcasts
    io.emit("onlineUsers", Object.keys(onlineUsers));
    console.log("User online and joined room:", userId);
  });

  // Typing indicator
  socket.on("typing", (data) => {
    const receiverSocketId = onlineUsers[data.receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("typing", data);
    }
  });

  socket.on("stopTyping", (data) => {
    const receiverSocketId = onlineUsers[data.receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("stopTyping", data);
    }
  });

  // Disconnect
  socket.on("disconnect", () => {
    for (const userId in onlineUsers) {
      if (onlineUsers[userId] === socket.id) {
        delete onlineUsers[userId];
        // Note: socket leaves rooms automatically on disconnect
        break;
      }
    }
    io.emit("onlineUsers", Object.keys(onlineUsers));
    console.log("Socket disconnected:", socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("[Unhandled Error]:", err);
  if (err.name === "CastError") {
    return res.status(400).json({ message: "Invalid ID format" });
  }
  res.status(500).json({ message: "Something went wrong on the server" });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
