const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    items: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        quantity: Number,
        price: Number
    }],
    totalAmount: Number,
    orderDate: { type: Date, default: Date.now },
    status: { type: String, default: 'Processing' }
});

module.exports = mongoose.model('Order', orderSchema);