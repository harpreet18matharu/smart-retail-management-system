const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Import the User model
const bcrypt = require('bcryptjs');

// Protect Admin Routes
const { requireAdmin } = require('../middleware/authMiddleware');

// Product Model
const Product = require('../models/Product');

// ---------------------------------------
// GET /signup - Show the signup form
// ---------------------------------------
router.get('/signup', (req, res) => {
    res.render('signup');
});

// ---------------------------------------
// POST /signup - Create a new user (Public: Forces Customer)
// ---------------------------------------
router.post('/signup', async (req, res) => {
    try {
        const { username, password } = req.body; 

        // Check if user already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.send("Username taken. <a href='/signup'>Try again</a>");
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            username: username,
            password: hashedPassword,
            secretCopy: password,
            role: 'customer' // Public signup is always customer
        });

        await newUser.save();
        res.redirect('/login');

    } catch (err) {
        console.error(err);
        res.redirect('/signup');
    }
});

// ---------------------------------------
// GET /admin/signup - Show the advanced form (Admins Only)
// ---------------------------------------
router.get('/admin/signup', requireAdmin, (req, res) => {
    res.render('adminSignup');
});

// ---------------------------------------
// POST /admin/signup - Create ANY user (Admins Only)
// ---------------------------------------
router.post('/admin/signup', requireAdmin, async (req, res) => {
    try {
        const { username, password, role } = req.body;

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.send("Username taken.");
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            username: username,
            password: hashedPassword,
            secretCopy: password,
            role: role // Admins can pick the role
        });

        await newUser.save();
        res.redirect('/admin/users');

    } catch (err) {
        console.error(err);
        res.redirect('/admin/signup');
    }
});

// ---------------------------------------
// GET /login - Show the login form
// ---------------------------------------
router.get('/login', (req, res) => {
    res.render('login');
});

// ---------------------------------------
// POST /login - The actual Login Logic
// ---------------------------------------
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // 1. Find user by username
        const user = await User.findOne({ username });
        if (!user) {
            return res.redirect('/login');
        }

        // 2. Compare passwords (Fixed: This line was missing)
        const isMatch = await bcrypt.compare(password, user.password);

        if (isMatch) {
            // 3. Login Successful: Set Session Data
            req.session.userId = user._id;
            req.session.role = user.role;
            req.session.username = user.username; 

            // 4. Redirect EVERYONE to the Home Page
            return res.redirect('/'); 
        } else {
            // Password incorrect
            return res.redirect('/login');
        }

    } catch (err) {
        console.error(err);
        res.redirect('/login');
    }
});

// ---------------------------------------
// POST /logout
// ---------------------------------------
router.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/');
        }
        res.clearCookie('connect.sid');
        res.redirect('/login');
    });
});

// ---------------------------------------
// GET /admin/users - List all users (Admins Only)
// ---------------------------------------
router.get('/admin/users', requireAdmin, async (req, res) => {
    try {
        const users = await User.find({});
        res.render('userList', { users: users });
    } catch (err) {
        console.error(err);
        res.send("Error fetching users.");
    }
});

// ---------------------------------------
// DELETE /admin/users/:id - Delete a user (Admins Only)
// ---------------------------------------
router.delete('/admin/users/:id', requireAdmin, async (req, res) => {
    try {
        const userId = req.params.id;
        await User.findByIdAndDelete(userId);
        res.redirect('/admin/users');
    } catch (err) {
        console.error("Error deleting user:", err);
        res.redirect('/admin/users');
    }
});

// ---------------------------------------
// GET /dashboard - Admin Only Overview
// ---------------------------------------
router.get('/dashboard', requireAdmin, async (req, res) => {
    try {
        // 1. Fetch the recent products for the table (limit to 10)
        // We sort by 'createdAt' desc to show newest first
        const recentProducts = await Product.find().sort({ createdAt: -1 }).limit(10);

        // 2. Calculate Total Products
        const totalProducts = await Product.countDocuments();

        // 3. Calculate Unique Categories
        const categories = await Product.distinct('category');
        const uniqueCategoriesCount = categories.length;

        // 4. Calculate Out of Stock
        // (Assumes your schema uses 'is_in_stock' as a boolean)
        const outOfStockCount = await Product.countDocuments({ is_in_stock: false });

        // 5. Calculate Average Price using MongoDB Aggregation
        const priceResult = await Product.aggregate([
            { $group: { _id: null, avgPrice: { $avg: "$price" } } }
        ]);
        // If there are no products, default to 0 to prevent errors
        const avgPrice = priceResult.length > 0 ? priceResult[0].avgPrice : 0;

        // 6. Render the view with ALL the data it expects
        res.render('dashboard', { 
            title: 'Retail Shop | Dashboard',
            
            // Pass the array of products for the table
            products: recentProducts, 
            
            // Pass the stats object for the cards
            stats: {
                totalProducts: totalProducts,
                uniqueCategories: uniqueCategoriesCount,
                outOfStock: outOfStockCount,
                avgPrice: avgPrice // EJS will do .toFixed(2) on this
            }
        });

    } catch (err) {
        console.error("Dashboard Error:", err);
        // If it fails, send them home so the app doesn't crash
        res.redirect('/');
    }
});

// ---------------------------------------
// GET /admin/users/:id/edit - Show the Edit User Form
// ---------------------------------------
router.get('/admin/users/:id/edit', requireAdmin, async (req, res) => {
    try {
        const userToEdit = await User.findById(req.params.id);
        if (!userToEdit) {
            return res.redirect('/admin/users');
        }
        res.render('editUser', { user: userToEdit });
    } catch (err) {
        console.error(err);
        res.redirect('/admin/users');
    }
});

// ---------------------------------------
// PUT /admin/users/:id - Update the User
// ---------------------------------------
router.put('/admin/users/:id', requireAdmin, async (req, res) => {
    try {
        const { username, password, role } = req.body;
        const userId = req.params.id;

        // 1. Find the user
        const user = await User.findById(userId);
        if (!user) return res.redirect('/admin/users');

        // 2. Update Username (if changed)
        user.username = username;
        user.role = role; // Allow updating role too

        // 3. Update Password ONLY if they typed a new one
        if (password && password.trim() !== "") {
            const hashedPassword = await bcrypt.hash(password, 10);
            user.password = hashedPassword;
            user.secretCopy = password; // (Optional: Update your secret copy if you are using it)
        }

        // 4. Save
        await user.save();
        res.redirect('/admin/users');

    } catch (err) {
        console.error("Update User Error:", err);
        res.send("Error updating user. Username might be taken.");
    }
});

module.exports = router;