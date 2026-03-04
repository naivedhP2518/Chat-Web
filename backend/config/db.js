const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,  // fail fast instead of hanging
      socketTimeoutMS: 45000,
      family: 4,                        // force IPv4 — fixes querySrv ECONNREFUSED on many networks
    });
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    // Do NOT call process.exit(1) — that causes nodemon crash/restart loop
    // The server will still start; retries happen automatically via mongoose
  }
};

module.exports = connectDB;
