const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    chatId: { type: String, index: true },

    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    message: {
      type: String,
    },

    type: {
      type: String,
      enum: ["text", "image", "video"],
      default: "text",
    },

    // ✅ Reply field
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },

    // Auto delete after 24 hours
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
      index: { expires: 0 },
    },

    seen: { type: Boolean, default: false },
  },
  { timestamps: true }
);

messageSchema.index({ chatId: 1, createdAt: 1 });

module.exports = mongoose.model("Message", messageSchema);
