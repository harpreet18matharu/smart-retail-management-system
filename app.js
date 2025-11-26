// app.js
require("dotenv").config();
const express = require("express");

// 👇 IMPORTANT: we DESTRUCTURE connectDB from the exported object
const { connectDB } = require("./db");

const productsRouter = require("./routes/products");

const app = express();
const PORT = process.env.PORT || 3000;

// test what we imported
console.log("typeof connectDB is:", typeof connectDB);

// connect to MongoDB
connectDB(); // call the function

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Smart Retail Product Management System - Phase 1");
});

app.use("/api/products", productsRouter);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
