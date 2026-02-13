const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },

    avatar: { type: String, default: "" },

    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date },
    fcmToken: { type: String, default: "" },
  },
   
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
