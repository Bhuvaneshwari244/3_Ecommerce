const mongoose = require('mongoose');
const Product = require('./models/Product');

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/ecommerce')
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.log(err));

const seedProducts = [
    {
        name: "Wireless Headphones",
        price: 59.99,
        description: "High-quality noise-canceling wireless headphones.",
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60"
    },
    {
        name: "Smart Watch",
        price: 120.50,
        description: "Track your fitness and notifications on the go.",
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60"
    },
    {
        name: "Gaming Keyboard",
        price: 45.00,
        description: "RGB backlit mechanical keyboard for gamers.",
        image: "https://images.unsplash.com/photo-1587829741301-dc798b91a603?w=500&auto=format&fit=crop&q=60"
    },
    {
        name: "Running Shoes",
        price: 85.00,
        description: "Comfortable and durable running shoes for all terrains.",
        image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop&q=60"
    },
    {
        name: "Laptop Backpack",
        price: 35.99,
        description: "Water-resistant backpack with laptop compartment.",
        image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&auto=format&fit=crop&q=60"
    }
];

const seedDB = async () => {
    await Product.deleteMany({}); // Clears existing products
    await Product.insertMany(seedProducts);
    console.log("✅ Database Seeded with 5 Products!");
    mongoose.connection.close();
};

seedDB();