// routes/updateProductRoutes.js
const express = require("express");
const router = express.Router();
const Product = require("../models/Product");

function normalize(body) {
  const data = { ...body };
  if (typeof data.is_in_stock === "string") {
    data.is_in_stock = data.is_in_stock === "true" || data.is_in_stock === "on";
  }
  if (typeof data.tags === "string") {
    data.tags = data.tags.split(",").map((t) => t.trim());
  }
  return data;
}

// UPDATE PRODUCT
router.put("/:id", async (req, res) => {
  try {
    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      normalize(req.body),
      { new: true, runValidators: true }
    );

    if (!updated)
      return res.status(404).json({ error: "Product not found" });

    res.json({ message: "Product updated", product: updated });
  } catch (err) {
    res.status(500).json({ error: "Update failed" });
  }
});

module.exports = router;
