const mongoose = require("mongoose");
dotenv = require("dotenv")

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("MongoDB connected");
};

module.exports = connectDB;
