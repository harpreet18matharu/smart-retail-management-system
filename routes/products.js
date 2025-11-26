// routes/products.js
const express = require("express");
const router = express.Router();

// TEST ROUTE ONLY
router.get("/", (req, res) => {
  res.send("Products route is working!");
});

module.exports = router;
