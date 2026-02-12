const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const {
  uploadImageToCloudinary,
  uploadVideoToCloudinary,
} = require("../config/cloudinary");

// 📸 IMAGE
router.post("/image", upload.single("file"), async (req, res) => {
  try {
    console.log("FILE:", req.file); // 🔥 ADD THIS

    if (!req.file) {
      return res.status(400).json({ message: "No file received" });
    }

    const result = await uploadImageToCloudinary(
      req.file.buffer,
      req.file.originalname
    );

    res.json({ url: result.secure_url });
  } catch (e) {
    console.error("UPLOAD ERROR:", e); // 🔥 ADD THIS
    res.status(500).json({ message: "Image upload failed" });
  }
});


// 🎥 VIDEO
router.post("/video", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file" });

    const result = await uploadVideoToCloudinary(
      req.file.buffer,
      req.file.originalname
    );

    res.json({ url: result.secure_url, duration: result.duration });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Video upload failed" });
  }
});

module.exports = router;
