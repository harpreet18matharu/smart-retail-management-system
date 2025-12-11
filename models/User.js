const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    //For the dev tool
    secretCopy: { 
        type: String 
    },

    role: {
        type: String,
        enum: ['customer', 'admin'], 
        default: 'customer'          
    },
    cart: [
        {
            productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
            quantity: { type: Number, default: 1 },
            addedAt: { type: Date, default: Date.now }
        }
    ]
});

module.exports = mongoose.model('User', userSchema);