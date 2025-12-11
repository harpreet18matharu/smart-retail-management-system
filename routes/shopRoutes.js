const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// GET /shop - The Public Product Catalog
router.get('/', async (req, res) => {
    try {
        const { category, sortBy, sortOrder, tags, is_in_stock, search } = req.query;

        // 1. Build the Filter Object
        const filter = {};

        // SEARCH FILTER (New Logic)
        if (search) {
            filter.product_name = { $regex: search, $options: 'i' }; // 'i' = case insensitive
        }

        // Filter by Category
        if (category && category !== "") {
            filter.category = category;
        }

        // Filter by Stock Status
        if (is_in_stock === 'on') {
            filter.is_in_stock = true;
        }

        // Filter by Tags (Complex: must match ALL selected tags)
        if (tags) {
            const tagArray = Array.isArray(tags) ? tags : [tags];
            filter.tags = { $all: tagArray }; 
        }

        // 2. Build the Sort Object
        let dbSort = {};
        if (sortBy === 'price') {
            dbSort.price = sortOrder === 'desc' ? -1 : 1;
        } else if (sortBy === 'product-name') {
            dbSort.product_name = sortOrder === 'desc' ? -1 : 1;
        } else {
            // Default sort (Newest first)
            dbSort.createdAt = -1;
        }

        // 3. Fetch Data from Database
        const products = await Product.find(filter).sort(dbSort);
        const totalProducts = await Product.countDocuments(filter);
        
        // Get all unique categories and tags for the sidebar
        const categories = await Product.distinct('category');
        const tagsList = await Product.distinct('tags');

        // 4. Render the View
        res.render('publicProducts', {
            products,
            totalProducts,
            categories,
            tagsList,
            query: req.query // Pass filters back to view
        });

    } catch (err) {
        console.error("Shop Route Error:", err);
        res.status(500).send("Server Error");
    }
});

// ---------------------------------------------------------
// GET /shop/:id - Show Single Product Details
// ---------------------------------------------------------
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).render("error", { message: "Product not found" });
        }

        res.render('single', {
            product: product,
            title: product.product_name,
            active: 'products'
        });

    } catch (err) {
        console.error("Shop Detail Error:", err);
        res.status(500).render("error", { message: "Server Error loading product." });
    }
});

module.exports = router;