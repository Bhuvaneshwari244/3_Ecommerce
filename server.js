const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');

// Import Models
const User = require('./models/User');
const Product = require('./models/Product');
const Order = require('./models/Order');

const app = express();

// --- Configuration ---
mongoose.connect('mongodb://127.0.0.1:27017/ecommerce')
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.log(err));

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({ 
    secret: 'secretkey_codealpha', 
    resave: false, 
    saveUninitialized: true 
}));

// --- Image Upload Config ---
const storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage });

// --- Middleware to check login ---
const isAuthenticated = (req, res, next) => {
    if (req.session.userId) return next();
    res.redirect('/login');
};

// --- REAL-TIME SIMULATION FUNCTION ---
// This runs in the background to update status automatically
const simulateOrderAsync = (orderId) => {
    console.log(`⚙️ Processing Order ${orderId}...`);
    
    // After 10 seconds: Change to Shipped
    setTimeout(async () => {
        await Order.findByIdAndUpdate(orderId, { status: 'Shipped 🚚' });
        console.log(`Order ${orderId} is Shipped!`);
    }, 10000); 

    // After 20 seconds: Change to Delivered
    setTimeout(async () => {
        await Order.findByIdAndUpdate(orderId, { status: 'Delivered ✅' });
        console.log(`Order ${orderId} is Delivered!`);
    }, 20000);
};

// --- ROUTES ---

app.get('/', async (req, res) => {
    const products = await Product.find();
    res.render('index', { products: products, user: req.session.userId });
});

app.get('/product/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        res.render('detail', { product: product, user: req.session.userId });
    } catch (err) { res.redirect('/'); }
});

app.post('/add-to-cart/:id', isAuthenticated, async (req, res) => {
    const user = await User.findById(req.session.userId);
    const existingItem = user.cart.find(item => item.productId.equals(req.params.id));
    if (existingItem) { existingItem.quantity++; } 
    else { user.cart.push({ productId: req.params.id, quantity: 1 }); }
    await user.save();
    res.redirect('/cart');
});

// Updated Cart Route (Crash Proof)
app.get('/cart', isAuthenticated, async (req, res) => {
    const user = await User.findById(req.session.userId).populate('cart.productId');
    // Filter out null products (in case they were deleted from DB)
    const validCart = user.cart.filter(item => item.productId !== null);
    res.render('cart', { cart: validCart, user: req.session.userId });
});

// --- Checkout with Real-Time Simulation ---
app.post('/checkout', isAuthenticated, async (req, res) => {
    const user = await User.findById(req.session.userId).populate('cart.productId');
    
    // Filter out invalid items
    const validItems = user.cart.filter(item => item.productId != null);

    if (validItems.length === 0) return res.redirect('/cart');

    let total = 0;
    const orderItems = validItems.map(item => {
        total += item.productId.price * item.quantity;
        return {
            product: item.productId._id,
            quantity: item.quantity,
            price: item.productId.price
        };
    });

    const newOrder = await Order.create({
        user: user._id,
        items: orderItems,
        totalAmount: total,
        status: 'Processing ⚙️'
    });

    // Start the real-time simulation
    simulateOrderAsync(newOrder._id);

    user.cart = [];
    await user.save();
    res.redirect('/orders');
});

app.get('/orders', isAuthenticated, async (req, res) => {
    const orders = await Order.find({ user: req.session.userId })
        .populate('items.product')
        .sort({ orderDate: -1 });
    res.render('orders', { orders: orders, user: req.session.userId });
});

// Auth Routes
app.get('/register', (req, res) => res.render('register'));
app.post('/register', async (req, res) => {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    try {
        await User.create({ username: req.body.username, password: hashedPassword });
        res.redirect('/login');
    } catch (err) { res.send("Error: Username likely exists."); }
});
app.get('/login', (req, res) => res.render('login'));
app.post('/login', async (req, res) => {
    const user = await User.findOne({ username: req.body.username });
    if (user && await bcrypt.compare(req.body.password, user.password)) {
        req.session.userId = user._id;
        res.redirect('/');
    } else { res.send('Invalid credentials'); }
});
app.get('/logout', (req, res) => { req.session.destroy(); res.redirect('/login'); });

// Admin Route
app.get('/add-product', (req, res) => res.render('add_product'));
app.post('/add-product', upload.single('image'), async (req, res) => {
    await Product.create({
        name: req.body.name,
        price: req.body.price,
        description: req.body.description,
        image: req.file ? '/uploads/' + req.file.filename : ''
    });
    res.redirect('/');
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));