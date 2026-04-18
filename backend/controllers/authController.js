const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "chatapp_secret_key_2024";

// Register a new user
const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({ username, email, password: hashedPassword });
    await user.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
};

// Login user and return JWT
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    console.log(`[Login] Attempting login for email: ${email}`);
    const user = await User.findOne({ email });
    
    if (!user) {
      console.warn(`[Login] User not found for email: ${email}`);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    console.log(`[Login] User found. Comparing passwords...`);
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      console.warn(`[Login] Password mismatch for email: ${email}`);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    console.log(`[Login] Success. Generating token for: ${user.username}`);
    const userIdStr = user._id.toString();

    const token = jwt.sign(
      { id: userIdStr, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: userIdStr,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
};

// Get all users except the current logged-in user
const getUsers = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user.id } }).select(
      "-password"
    );
    res.json(users);
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ message: "Server error fetching users" });
  }
};

module.exports = { register, login, getUsers };
