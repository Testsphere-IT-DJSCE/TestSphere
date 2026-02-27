const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  throw new Error("Please define MONGO_URI in environment variables");
}

async function connectDb() {
  if (mongoose.connection.readyState >= 1) {
    return; // Already connected, reuse connection
  }

  await mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
  });

  console.log("MongoDB connected successfully");
}

module.exports = connectDb;