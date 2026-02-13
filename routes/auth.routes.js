const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/Users");
const auth = require("../middleware/auth");

const router = express.Router();

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, gender } = req.body;

    // 🔎 Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    // ❌ Check existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // 🔐 Hash password
    const hash = await bcrypt.hash(password, 10);

    // 👤 Default avatar by gender
    const avatar =
      gender === "girl"
        ? "https://cdn-icons-png.flaticon.com/512/4140/4140037.png"
        : "https://cdn-icons-png.flaticon.com/512/4140/4140048.png";

    // 💾 Save user
    await User.create({
      name,
      email,
      password: hash,
      avatar,
    });

    res.status(201).json({
      message: "Registered successfully",
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email or password missing" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(400).json({ message: "Wrong password" });
    }

    user.isOnline = true;
    await user.save();

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

   res.cookie("token", token, {
  httpOnly: true,
  secure: true,          // MUST be true in production
  sameSite: "none",      // MUST be none for cross-origin
  maxAge: 7 * 24 * 60 * 60 * 1000,
});


    const { password: _, ...userData } = user.toObject();

    res.json({ user: userData }); 

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    res.json(user);

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});






// logout 

router.post("/logout", auth, async (req, res) => {
  try {
    const userId = req.user.id; // coming from auth middleware

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isOnline = false;
    user.lastSeen = new Date();
    await user.save();

    return res.json({ message: "Logged out successfully" });
    res.redirect("/login");
  } catch (err) {
    console.error("Logout error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// SAVE FCM TOKEN
router.post("/save-token", auth, async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Token missing" });
    }

    await User.findByIdAndUpdate(req.user.id, {
      fcmToken: token
    });

    res.json({ message: "FCM token saved" });

  } catch (err) {
    console.error("Save token error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
