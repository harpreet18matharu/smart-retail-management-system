const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Product = require('../models/Product'); // Needed to populate details

// Middleware to ensure they are a customer
const requireCustomer = (req, res, next) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    if (req.session.role === 'admin') {
        return res.render('error', { message: "Admins cannot shop." });
    }
    next();
};

// ---------------------------------------------------------
// GET /cart - View Cart Page
// ---------------------------------------------------------
router.get('/', requireCustomer, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId).populate('cart.productId');
        
        // Filter out null products (in case a product was deleted from inventory but is still in a cart)
        const validCart = user.cart.filter(item => item.productId !== null);

        // Calculate Grand Total
        let grandTotal = 0;
        validCart.forEach(item => {
            grandTotal += item.quantity * item.productId.price;
        });

        res.render('cart', {
            cart: validCart,
            grandTotal: grandTotal,
            title: 'Your Shopping Cart'
        });

    } catch (err) {
        console.error(err);
        res.render('error', { message: "Could not load cart" });
    }
});

// ---------------------------------------------------------
// POST /cart/add - Add Item (Used by Footer Script)
// ---------------------------------------------------------
router.post('/add', async (req, res) => {
    // ... (Keep your existing code for this route exactly as we wrote it before) ...
    // COPY PASTE THE PREVIOUS '/add' CODE HERE
    // (If you lost it, I can provide it again, but simpler to just keep it)
    try {
        const productId = req.body.productId;
        if (!req.session.userId) return res.json({ status: 'guest', message: "Please log in to shop." });
        if (req.session.role === 'admin') return res.json({ status: 'admin', message: "Admins cannot shop." });

        const user = await User.findById(req.session.userId);
        const existingItemIndex = user.cart.findIndex(item => item.productId.toString() === productId);

        if (existingItemIndex > -1) user.cart[existingItemIndex].quantity += 1;
        else user.cart.push({ productId: productId, quantity: 1 });

        await user.save();
        const totalItems = user.cart.reduce((sum, item) => sum + item.quantity, 0);
        res.json({ status: 'success', cartCount: totalItems });
    } catch (err) {
        res.status(500).json({ status: 'error' });
    }
});

// ---------------------------------------------------------
// POST /cart/update - Change Quantity (+ or -)
// ---------------------------------------------------------
router.post('/update', requireCustomer, async (req, res) => {
    try {
        const { productId, action } = req.body;
        const user = await User.findById(req.session.userId);

        const itemIndex = user.cart.findIndex(item => item.productId.toString() === productId);

        if (itemIndex > -1) {
            if (action === 'increase') {
                user.cart[itemIndex].quantity += 1;
            } else if (action === 'decrease') {
                user.cart[itemIndex].quantity -= 1;
                // If quantity drops to 0, remove it
                if (user.cart[itemIndex].quantity <= 0) {
                    user.cart.splice(itemIndex, 1);
                }
            }
            await user.save();
        }
        res.redirect('/cart'); // Refresh page to see new totals
    } catch (err) {
        console.error(err);
        res.redirect('/cart');
    }
});

// ---------------------------------------------------------
// POST /cart/remove - Delete Item Completely
// ---------------------------------------------------------
router.post('/remove', requireCustomer, async (req, res) => {
    try {
        const { productId } = req.body;
        const user = await User.findById(req.session.userId);

        // Remove item from array
        user.cart = user.cart.filter(item => item.productId.toString() !== productId);
        
        await user.save();
        res.redirect('/cart');
    } catch (err) {
        console.error(err);
        res.redirect('/cart');
    }
});

module.exports = router;