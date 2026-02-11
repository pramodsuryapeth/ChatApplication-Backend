require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const socketHandler = require("./socket");

// routes
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const chatRoutes = require("./routes/chat.routes");
const mediaRoutes = require("./routes/media.routes");

const app = express();
connectDB();

// ✅ CORS
const allowedOrigins = [
  "https://privatechatapplication.netlify.app",
  // process.env.FRONTEND_URL,
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json());

// routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/media", mediaRoutes);

// ✅ health route
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Backend running 🚀" });
});

// base
app.get("/", (req, res) => {
  res.send("Chat backend running 🚀");
});

// server + socket
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  },
});

socketHandler(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);
