const express = require("express");
const router = express.Router();
const Product = require("../models/Product");

// HOME – send some products to index.ejs
router.get("/", async (req, res) => {
  try {
    const products = await Product.find().limit(8).lean(); // get some products
    res.render("index", {
      active: "home",
      title: "Retail Shop | Home",
      products,           // 👈 this is what index.ejs uses
    });
  } catch (err) {
    console.error(err);
    res.render("index", {
      active: "home",
      title: "Retail Shop | Home",
      products: [],       // fallback if DB fails
    });
  }
});

// ABOUT
router.get("/about", (req, res) => {
  res.render("about", { active: "about", title: "Retail Shop | About" });
});

// DASHBOARD (optional if you added it before)

  router.get("/dashboard", async (req, res) => {
  const products = await Product.find().lean();

  const totalProducts = products.length;
  const categories = new Set(products.filter(p => p.category).map(p => p.category));
  const uniqueCategories = categories.size;
  const outOfStock = products.filter(p => p.is_in_stock === false || p.stock === 0).length;
  const avgPrice =
    totalProducts === 0
      ? 0
      : products.reduce((sum, p) => sum + (p.price || 0), 0) / totalProducts;

  res.render("dashboard", {
    active: "dashboard",
    title: "Retail Shop | Dashboard",
    products,
    stats: { totalProducts, uniqueCategories, outOfStock, avgPrice },
  });
});


module.exports = router;
