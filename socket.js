const Message = require("./models/Message");
const ChatRequest = require("./models/ChatRequest");
const User = require("./models/Users");
const { encrypt, decrypt } = require("./utils/crypto");

// ✅ GLOBAL online users tracker
const onlineUsers = new Set();

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    // =========================
    // 🟢 USER COMES ONLINE
    // =========================
    socket.on("userOnline", async (userId) => {
      try {
        socket.userId = userId;          // store userId on socket
        onlineUsers.add(userId);

        socket.join(userId);             // 🔥 IMPORTANT for calls

        await User.findByIdAndUpdate(userId, {
          isOnline: true,
        });

        socket.broadcast.emit("userOnline", userId);
        console.log("User online:", userId);
      } catch (err) {
        console.error("userOnline error:", err);
      }
    });

    // =========================
    // 🔗 JOIN CHAT ROOM
    // =========================
    socket.on("joinChat", (chatId) => {
      if (!chatId) return;
      socket.join(chatId);
      console.log(`Joined chat: ${chatId}`);
    });

    // =========================
    // 💬 SEND MESSAGE (TEXT / IMAGE / VIDEO URL)
    // =========================
    socket.on("sendMessage", async (data) => {
      try {
        const {
          chatId,
          senderId,
          receiverId,
          message,
          type = "text", // text | image | video
        } = data;

        if (!message) return;

        // ✅ Check chat accepted
        const allowed = await ChatRequest.findOne({
          chatId,
          status: "accepted",
        });

        if (!allowed) {
          console.log("Chat not accepted. Message blocked.");
          return;
        }
        // ========================
        // 🔐 Encrypt message (URL or text both)
        const encryptedMessage = encrypt(message);

        // 💾 Save message
        const savedMessage = await Message.create({
          chatId,
          senderId,
          receiverId,
          message: encryptedMessage,
          type,
        });

        // 🔓 Decrypt before sending to frontend
        io.to(chatId).emit("receiveMessage", {
          ...savedMessage._doc,
          message: decrypt(savedMessage.message),
        });
      } catch (err) {
        console.error("sendMessage error:", err);
      }
    });

    // 👀 MARK MESSAGES AS SEEN
// =========================
socket.on("markSeen", async ({ chatId, userId }) => {
  try {

    const unreadMessages = await Message.find({
      chatId,
      receiverId: userId,
      seen: false,
    });

    await Message.updateMany(
      {
        chatId,
        receiverId: userId,
        seen: false,
      },
      { $set: { seen: true } }
    );

    console.log("Updated:", unreadMessages.length);

    // 🔥 Notify ONLY original sender
    unreadMessages.forEach(msg => {
      io.to(msg.senderId.toString()).emit("messagesSeen", {
        messageId: msg._id,
      });
    });

  } catch (err) {
    console.error("markSeen error:", err);
  }
});


    // =========================
    // 📞📹 WEBRTC CALL EVENTS
    // =========================

    // ▶ START CALL (VIDEO OR AUDIO)
    socket.on("call-user", ({ to, offer, callType }) => {
      // callType = "video" | "audio"
      io.to(to).emit("incoming-call", {
        from: socket.userId,
        offer,
        callType,
      });
    });

    // ▶ ANSWER CALL
    socket.on("answer-call", ({ to, answer }) => {
      io.to(to).emit("call-answered", {
        from: socket.userId,
        answer,
      });
    });

    // ▶ ICE CANDIDATE EXCHANGE
    socket.on("ice-candidate", ({ to, candidate }) => {
      io.to(to).emit("ice-candidate", {
        from: socket.userId,
        candidate,
      });
    });

    // ▶ END CALL
    socket.on("end-call", ({ to }) => {
      io.to(to).emit("call-ended", {
        from: socket.userId,
      });
    });

    // =========================
    // ✅ CHECK ONLINE STATUS
    // =========================
    socket.on("checkOnline", (userId) => {
      if (onlineUsers.has(userId)) {
        socket.emit("userOnline", userId);
      } else {
        socket.emit("userOffline", userId);
      }
    });

    // =========================
    // ❌ DISCONNECT
    // =========================
    socket.on("disconnect", async () => {
      try {
        if (socket.userId) {
          onlineUsers.delete(socket.userId);

          await User.findByIdAndUpdate(socket.userId, {
            isOnline: false,
            lastSeen: new Date(),
          });

          socket.broadcast.emit("userOffline", socket.userId);
          console.log("User offline:", socket.userId);
        }
      } catch (err) {
        console.error("disconnect error:", err);
      }

      console.log("Socket disconnected:", socket.id);
    });
  });
};
