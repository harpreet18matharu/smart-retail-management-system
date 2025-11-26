// models/Product.js
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    product_id: { type: String, required: true },      // e.g., "RET-000001"
    product_name: { type: String, required: true },
    category: String,
    brand: String,
    price: Number,
    is_in_stock: Boolean,                              // boolean requirement
    image_url: String,                                 // image URL requirement

    // Nested object requirement
    location: {
      city: String,
      state: String,
      country: String
    },

    // Array requirement
    tags: [String],

    // Extra nested object if you want more complexity
    productDetails: {
      dimensions: String,
      material: String,
      warranty: String
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Product", productSchema);
