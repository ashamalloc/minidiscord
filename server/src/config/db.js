const mongoose = require("mongoose");

module.exports = async function connectDB() {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is missing. Configure server/.env first.");
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};
