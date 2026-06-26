require('dotenv').config();
const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const methodOverride = require('method-override');
const bcrypt = require('bcryptjs');

const isProduction = process.env.NODE_ENV === 'production';

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const { requireAuth } = require('./middleware/auth');
const checkRenewal = require('./middleware/renewalCheck');
const Product = require('./models/Product');
const Order = require('./models/Order');
const User = require('./models/User');

const app = express();

// EJS & Layouts
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// Session (production-ready)
app.use(session({
  secret: process.env.SESSION_SECRET || 'inventory-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000,
    secure: isProduction,
    sameSite: 'lax'
  }
}));

if (isProduction) {
  app.set('trust proxy', 1);
}

// Global middleware: set user info in res.locals
app.use((req, res, next) => {
  res.locals.userId = req.session.userId || null;
  res.locals.userRole = req.session.userRole || null;
  res.locals.fullName = req.session.fullName || null;
  res.locals.currentPath = req.path;
  res.locals.daysLeft = req.session.daysLeft || null;
  res.locals.title = 'Quản lý kho hàng';
  next();
});

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/inventory_db';
mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('MongoDB connected');
    // Seed default admin account
    try {
      const adminExists = await User.findOne({ username: 'tranbatoan' });
      if (!adminExists) {
        const hashedPassword = await bcrypt.hash('Toan@2012', 10);
        const farExpiry = new Date();
        farExpiry.setFullYear(farExpiry.getFullYear() + 100);
        await User.create({
          username: 'tranbatoan',
          password: hashedPassword,
          role: 'admin',
          fullName: 'Admin Tran Ba Toan',
          email: 'admin@inventory.local',
          phone: '',
          expiryDate: farExpiry,
          isActive: true,
          isLocked: false
        });
        console.log('Default admin created: tranbatoan / Toan@2012');
      } else {
        console.log('Default admin already exists: tranbatoan');
      }
    } catch (seedErr) {
      console.error('Seed admin error:', seedErr.message);
    }
  })
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/', authRoutes);
app.use(requireAuth);
app.use(checkRenewal);
app.use('/', productRoutes);
app.use('/', orderRoutes);
app.use('/', adminRoutes);

// Home page (trang chủ sau đăng nhập)
app.get('/', async (req, res) => {
  try {
    const productCount = await Product.countDocuments({ isActive: true });
    const orderCount = await Order.countDocuments();
    const totalRevenue = await Order.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const totalProfit = await Order.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$profit' } } }
    ]);
    const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(5).populate('items.product');
    const lowStockProducts = await Product.find({
      isActive: true,
      $expr: { $lte: ['$quantity', '$lowStockThreshold'] }
    }).limit(5);
    
    res.render('index', {
      title: 'Trang chủ',
      productCount,
      orderCount,
      revenue: totalRevenue[0]?.total || 0,
      profit: totalProfit[0]?.total || 0,
      recentOrders,
      lowStockProducts
    });
  } catch (err) {
    res.status(500).render('error', { message: 'Lỗi tải trang chủ' });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('error', { message: 'Trang không tồn tại' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('error', { message: 'Đã xảy ra lỗi hệ thống' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
