const mongoose = require("mongoose");
dotenv = require("dotenv")

const connectDB = async () => {
  // await mongoose.connect(process.env.MONGODB_URI);
  await mongoose.connect("mongodb://localhost:27017/chatapp");
  console.log("MongoDB connected");
};

module.exports = connectDB;
