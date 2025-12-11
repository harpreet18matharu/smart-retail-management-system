// db.js
require("dotenv").config();
const mongoose = require("mongoose");

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log(" MongoDB connected");
  } catch (err) {
    console.error(" MongoDB connection error:", err.message);
    process.exit(1);
  }
}

// 👇 VERY IMPORTANT: we export an OBJECT with connectDB inside
module.exports = { connectDB };
