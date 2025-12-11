// routes/uiProductRoutes.js
const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const { requireAdmin } = require("../middleware/authMiddleware");

// 1. PROTECT ALL ROUTES (Security Guard)
router.use(requireAdmin);

// ---------------------------------------------------------
// LIST ALL PRODUCTS (Admin Inventory)
// ---------------------------------------------------------
router.get("/", async (req, res) => {
  try {
    // Grab "outOfStock" from the URL (?outOfStock=on)
    const { sort, category, outOfStock } = req.query;

    // 1. Build the Filter
    const filter = {};
    
    // Category Filter
    if (category && category !== "all") {
      filter.category = category;
    }

    // NEW: Out of Stock Filter
    // If the box is checked, the browser sends "on".
    // We then tell MongoDB: "Only give me items where is_in_stock is FALSE"
    if (outOfStock === "on") {
        filter.is_in_stock = false; 
    }

    // 2. Build Sort Option
    let sortOption = { createdAt: -1 }; // default: newest first

    switch (sort) {
      case "priceAsc": sortOption = { price: 1 }; break;
      case "priceDesc": sortOption = { price: -1 }; break;
      case "nameAsc": sortOption = { product_name: 1 }; break;
      case "nameDesc": sortOption = { product_name: -1 }; break;
      default: sortOption = { createdAt: -1 };
    }

    // 3. Fetch Data
    const products = await Product.find(filter).sort(sortOption);
    const categories = await Product.distinct("category");

    // 4. Render View
    res.render("products", {
      title: "Inventory Management (Admin Only)",
      products,
      categories,
      selectedCategory: category || "all",
      selectedSort: sort || "newest",
      
      // CRITICAL: We pass the query back so the checkbox stays checked
      query: req.query 
    });
  } catch (err) {
    console.error("UI /products error:", err);
    res.status(500).send("Server error");
  }
});

// ---------------------------------------------------------
// SHOW CREATE FORM
// ---------------------------------------------------------
router.get("/create", (req, res) => {
  res.render("product-create", {
    title: "Add New Product",
  });
});

// ---------------------------------------------------------
// HANDLE CREATE FORM
// ---------------------------------------------------------
router.post("/", async (req, res) => {
  try {
    const data = { ...req.body };
    // Checkbox logic: if "on", it's true. If missing, it's false.
    data.is_in_stock = req.body.is_in_stock === "on";

    if (typeof data.tags === "string") {
      data.tags = data.tags.split(",").map((t) => t.trim()).filter((t) => t.length > 0);
    }

    if (!data.product_id) {
      data.product_id = `RET-${Date.now()}`;
    }

    await Product.create(data);
    res.redirect("/products");
  } catch (err) {
    console.error("Error creating product:", err);
    res.status(500).send("Error creating product");
  }
});

// ---------------------------------------------------------
// SHOW SINGLE PRODUCT (Detail for Admin)
// ---------------------------------------------------------
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).send("Product not found");

    res.render("single", {
      title: product.product_name,
      product,
    });
  } catch (err) {
    console.error("UI /products/:id error:", err);
    res.status(500).send("Server error");
  }
});

// ---------------------------------------------------------
// SHOW EDIT FORM
// ---------------------------------------------------------
router.get("/:id/edit", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).send("Product not found");

    res.render("product-edit", {
      title: "Edit Product",
      product,
    });
  } catch (err) {
    console.error("UI GET edit error:", err);
    res.status(500).send("Server error");
  }
});

// ---------------------------------------------------------
// HANDLE UPDATE
// ---------------------------------------------------------
router.put("/:id", async (req, res) => {
  try {
    const data = { ...req.body };
    data.is_in_stock = req.body.is_in_stock === "on";

    if (typeof data.tags === "string") {
      data.tags = data.tags.split(",").map((t) => t.trim()).filter((t) => t.length > 0);
    }

    await Product.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true,
    });

    res.redirect("/products");
  } catch (err) {
    console.error("Error updating product:", err);
    res.status(500).send("Error updating product");
  }
});

// ---------------------------------------------------------
// HANDLE DELETE
// ---------------------------------------------------------
router.delete("/:id", async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.redirect("/products");
  } catch (err) {
    console.error("Error deleting product:", err);
    res.status(500).send("Error deleting product");
  }
});

module.exports = router;