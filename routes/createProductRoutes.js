// routes/createProductRoutes.js
const express = require("express");
const router = express.Router();
const Product = require("../models/Product");

function normalizeProductData(body) {
  const data = { ...body };

  if (typeof data.is_in_stock === "string") {
    data.is_in_stock =
      data.is_in_stock === "true" || data.is_in_stock === "on";
  }

  if (typeof data.tags === "string") {
    data.tags = data.tags
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t);
  }

  return data;
}

// CREATE PRODUCT  ➜ POST /api/products
router.post("/", async (req, res) => {
  try {
    const data = normalizeProductData(req.body);

    if (!data.product_id) {
      data.product_id = `RET-${Date.now()}`;
    }

    const product = await Product.create(data);
    res.status(201).json({ message: "Product created", product });
  } catch (err) {
    console.error("POST Error:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

module.exports = router;
