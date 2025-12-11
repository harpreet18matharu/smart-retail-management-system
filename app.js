// app.js
require("dotenv").config();
const express = require("express");
const path = require("path");
const methodOverride = require("method-override");
const session = require("express-session");

// User Model (Needed for Cart Calculation)
const User = require('./models/User');

// Import DB connection
const { connectDB } = require("./db");

// UI Routes
const pageRoutes = require("./routes/pageRoutes");
const uiProductRoutes = require("./routes/uiProductRoutes");
const authRoutes = require("./routes/authRoutes");
const shopRoutes = require("./routes/shopRoutes");
const cartRoutes = require('./routes/cartRoutes');


// API CRUD routes
const createProductRoutes = require("./routes/createProductRoutes");
const readProductRoutes   = require("./routes/readProductRoutes");
const updateProductRoutes = require("./routes/updateProductRoutes");
const deleteProductRoutes = require("./routes/deleteProductRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

// -------------------------------------------
// Connect to MongoDB
// -------------------------------------------
connectDB();

// -------------------------------------------
// Middlewares
// -------------------------------------------

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SESSION_SECRET || 'my secret key',
    resave: false,
    saveUninitialized: false
}));

// --- GLOBAL MIDDLEWARE (User & Cart) ---
// This MUST be before the routes so the data is ready when the page loads
app.use(async (req, res, next) => {
    // 1. Set User Info
    res.locals.user = req.session.userId ? { 
        _id: req.session.userId, 
        role: req.session.role,
        username: req.session.username
    } : null;

    // 2. Calculate Cart Count from Database
    res.locals.cartCount = 0; // Default
    
    if (req.session.userId) {
        try {
            const currentUser = await User.findById(req.session.userId);
            if (currentUser && currentUser.cart) {
                // Sum up quantity of all items
                res.locals.cartCount = currentUser.cart.reduce((sum, item) => sum + item.quantity, 0);
            }
        } catch (err) {
            console.error("Middleware Cart Error:", err);
        }
    }
    
    next();
});
// ---------------------------------------

app.use(methodOverride("_method"));

// -------------------------------------------
// EJS View Engine Setup
// -------------------------------------------
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

// -------------------------------------------
// UI ROUTES
// -------------------------------------------

app.use("/", authRoutes);
app.use("/", pageRoutes);
app.use("/shop", shopRoutes);
app.use('/cart', cartRoutes);
app.use("/products", uiProductRoutes);


// -------------------------------------------
// API ROUTES
// -------------------------------------------
app.use("/api/products", createProductRoutes);
app.use("/api/products", readProductRoutes);
app.use("/api/products", updateProductRoutes);
app.use("/api/products", deleteProductRoutes);

app.get("/api", (req, res) => {
  res.send("Smart Retail Product Management System - Phase 1 API");
});

// -------------------------------------------
// 404 PAGE
// -------------------------------------------
app.use((req, res) => {
  res.status(404).render("error", { message: "Page Not Found" });
});


app.listen(PORT, () => {
  console.log(` Server running at http://localhost:${PORT}`);
});

module.exports = app;