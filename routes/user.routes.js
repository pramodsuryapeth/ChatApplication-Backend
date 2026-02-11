const express = require("express");
const User = require("../models/Users");
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

const {
  uploadImageToCloudinary
} = require("../config/cloudinary");

// SHOW ALL USERS (DASHBOARD)
router.get("/", auth, async (req, res) => {
  const users = await User.find({ _id: { $ne: req.user.id } })
    .select("name avatar");

  res.json(users);
});


router.get("/:id", auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("name avatar isOnline lastSeen");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/profile", upload.single("file"), auth, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const userData = await User.findById(req.user.id);
    if (!userData) {
      return res.status(404).json({ message: "User not found" });
    }

    // Upload to Cloudinary
    const result = await uploadImageToCloudinary(
      req.file.buffer,
      req.file.originalname
    );

    // Save Cloudinary image URL
    userData.avatar = result.secure_url;
    await userData.save();

    res.status(200).json({
      message: "Profile updated successfully",
      avatar: result.secure_url,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


module.exports = router;
