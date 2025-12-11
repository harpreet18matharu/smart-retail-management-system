// models/Product.js
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    product_id: {
      type: String,
      required: true,
      unique: true
    },

    product_name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true
    },

    category: {
      type: String,
      required: [true, "Category required"],
      trim: true
    },

    brand: {
      type: String,
      trim: true
    },

    price: {
      type: Number,
      required: true,
      min: [0, "Price must be greater than 0"]
    },

    is_in_stock: {
      type: Boolean,
      default: true
    },

    image_url: {
      type: String,
      default: "/images/default-product.jpg"
    },

    // Nested Location
    location: {
      city: String,
      state: String,
      country: String
    },

    // Array
    tags: {
      type: [String],
      default: []
    },

    // More nested details
    productDetails: {
      dimensions: String,
      material: String,
      warranty: String
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
