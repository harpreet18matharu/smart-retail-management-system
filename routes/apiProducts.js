// routes/apiProducts.js
const express = require("express");
const { body, query, param, validationResult } = require("express-validator");
const Product = require("../models/Product");

const router = express.Router();

// small helper
function handleValidationErrors(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
}

/**
 * READ – List with pagination & filter
 * GET /api/products?page=&perPage=&category=
 */
router.get(
  "/",
  [
    query("page").optional().isInt({ min: 1 }).withMessage("page must be >= 1"),
    query("perPage")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("perPage must be between 1 and 100"),
  ],
  async (req, res) => {
    handleValidationErrors(req, res);

    try {
      let { page = 1, perPage = 10, category } = req.query;
      page = parseInt(page);
      perPage = parseInt(perPage);

      const filter = {};
      if (category) {
        filter.category = category;
      }

      const products = await Product.find(filter)
        .skip((page - 1) * perPage)
        .limit(perPage)
        .sort({ createdAt: -1 });

      const total = await Product.countDocuments(filter);

      res.json({
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
        data: products,
      });
    } catch (err) {
      console.error("GET /api/products error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

/**
 * READ – Single item
 * GET /api/products/:id
 */
router.get(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid product id")],
  async (req, res) => {
    handleValidationErrors(req, res);

    try {
      const product = await Product.findById(req.params.id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (err) {
      console.error("GET /api/products/:id error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

/**
 * CREATE
 * POST /api/products
 */
router.post(
  "/",
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("category").notEmpty().withMessage("Category is required"),
    body("price").isFloat({ gt: 0 }).withMessage("Price must be > 0"),
    body("is_in_stock").optional().isBoolean(),
  ],
  async (req, res) => {
    handleValidationErrors(req, res);

    try {
      const data = { ...req.body };

      // convert boolean properly if coming as "on"/"true"
      if (typeof data.is_in_stock === "string") {
        data.is_in_stock =
          data.is_in_stock === "true" || data.is_in_stock === "on";
      }

      if (!data.product_id) {
        data.product_id = `RET-${Date.now()}`;
      }

      const created = await Product.create(data);
      res.status(201).json(created);
    } catch (err) {
      console.error("POST /api/products error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

/**
 * UPDATE
 * PUT /api/products/:id
 */
router.put(
  "/:id",
  [
    param("id").isMongoId().withMessage("Invalid product id"),
    body("name").optional().notEmpty().withMessage("Name cannot be empty"),
    body("category")
      .optional()
      .notEmpty()
      .withMessage("Category cannot be empty"),
    body("price")
      .optional()
      .isFloat({ gt: 0 })
      .withMessage("Price must be > 0"),
    body("is_in_stock").optional().isBoolean(),
  ],
  async (req, res) => {
    handleValidationErrors(req, res);

    try {
      const data = { ...req.body };

      if (typeof data.is_in_stock === "string") {
        data.is_in_stock =
          data.is_in_stock === "true" || data.is_in_stock === "on";
      }

      const updated = await Product.findByIdAndUpdate(req.params.id, data, {
        new: true,
        runValidators: true,
      });

      if (!updated) {
        return res.status(404).json({ error: "Product not found" });
      }

      res.json({ message: "Product updated", product: updated });
    } catch (err) {
      console.error("PUT /api/products/:id error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

/**
 * DELETE
 * DELETE /api/products/:id
 */
router.delete(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid product id")],
  async (req, res) => {
    handleValidationErrors(req, res);

    try {
      const deleted = await Product.findByIdAndDelete(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Product not found" });
      }

      res.json({ message: "Product deleted" });
    } catch (err) {
      console.error("DELETE /api/products/:id error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

module.exports = router;
