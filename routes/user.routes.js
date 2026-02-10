const express = require("express");
const User = require("../models/Users");
const auth = require("../middleware/auth");

const router = express.Router();

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

module.exports = router;
