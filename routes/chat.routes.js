const express = require("express");
const ChatRequest = require("../models/ChatRequest");
const Message = require("../models/Message");
const auth = require("../middleware/auth");
const User = require("../models/Users");
const { decrypt } = require("../utils/crypto");
const mongoose = require("mongoose");

const router = express.Router();

const getChatId = (u1, u2) => [u1, u2].sort().join("_");


// SEND CHAT REQUEST
router.post("/request", auth, async (req, res) => {
  const senderId = req.user.id;
  const { receiverId } = req.body;

  const chatId = getChatId(senderId, receiverId);

  const exists = await ChatRequest.findOne({ chatId });
  if (exists) return res.status(400).json({ message: "Already requested" });

  await ChatRequest.create({ senderId, receiverId, chatId });

  res.json({ message: "Request sent" });
});

// GET PENDING CHAT REQUESTS
router.get("/requests", auth, async (req, res) => {
  const requests = await ChatRequest.find({
    status: "pending",
    receiverId: req.user.id,
  }).populate("senderId", "name avatar");

  res.json(requests);
});


// ACCEPT CHAT REQUEST
router.post("/accept", auth, async (req, res) => {
  const { requestId } = req.body;

  await ChatRequest.findByIdAndUpdate(requestId, {
    status: "accepted",
  });

  res.json({ message: "Chat accepted" });
});


// Load accepted chats 
router.get("/friends", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const messages = await Message.find({
      $or: [
        { senderId: userId },
        { receiverId: userId }
      ]
    });

    // Get unique user IDs
    const friendIds = new Set();

    messages.forEach((msg) => {
      if (msg.senderId.toString() !== userId) {
        friendIds.add(msg.senderId.toString());
      }
      if (msg.receiverId.toString() !== userId) {
        friendIds.add(msg.receiverId.toString());
      }
    });

    // Convert Set to Array
    const idsArray = Array.from(friendIds);

    // Fetch user details (User model example)
    const friends = await User.find({
      _id: { $in: idsArray }
    }).select("-password");

    res.json(friends);

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
});

// GET ACCEPTED CHATS
router.get("/accepted", auth, async (req, res) => {
  const chats = await ChatRequest.find({
    status: "accepted",
    $or: [{ senderId: req.user.id }, { receiverId: req.user.id }],
  }).populate("senderId receiverId", "name avatar");

  res.json(chats);
});


// LOAD MESSAGES
router.get("/messages/:chatId",auth, async (req, res) => {
  try {
    const { chatId } = req.params;

    const messages = await Message.find({ chatId })
      .sort({ createdAt: 1 });

    const formatted = messages.map(msg => ({
      ...msg._doc,
      message:
        msg.type === "text"
          ? decrypt(msg.message)
          : msg.message
    }));

    res.json(formatted);

  } catch (err) {
    console.error("Fetch messages error:", err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});


// GET CONVERSATIONS (Latest message + unread count)
router.get("/conversations", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderId: new mongoose.Types.ObjectId(userId) },
            { receiverId: new mongoose.Types.ObjectId(userId) }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: "$chatId",
          lastMessage: { $first: "$$ROOT" },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$receiverId", new mongoose.Types.ObjectId(userId)] },
                    { $eq: ["$seen", false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    res.json(conversations);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});
// MARK ALL AS READ
router.post("/mark-all-read", auth, async (req, res) => {
  try {
    const { chatId } = req.body;
    const userId = req.user.id;

    await Message.updateMany(
      {
        chatId,
        receiverId: userId,
        seen: false
      },
      { $set: { seen: true } }
    );

    res.json({ success: true });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});



module.exports = router;
