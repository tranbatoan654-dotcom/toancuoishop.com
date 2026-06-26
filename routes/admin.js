const express = require('express');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Transaction = require('../models/Transaction');
const router = express.Router();

// Dashboard
router.get('/admin', async (req, res) => {
  try {
    const userCount = await User.countDocuments({ role: 'user' });
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
    
    const pendingTransactions = await Transaction.countDocuments({ status: 'pending' });
    
    res.render('admin/dashboard', {
      stats: {
        userCount,
        productCount,
        orderCount,
        revenue: totalRevenue[0]?.total || 0,
        profit: totalProfit[0]?.total || 0,
        pendingTransactions
      },
      recentOrders,
      lowStockProducts
    });
  } catch (err) {
    res.status(500).render('error', { message: 'Lỗi tải dashboard' });
  }
});

// Quản lý người dùng
router.get('/admin/users', async (req, res) => {
  try {
    const users = await User.find({ role: 'user' }).sort({ createdAt: -1 });
    res.render('admin/users', { users });
  } catch (err) {
    res.status(500).render('error', { message: 'Lỗi tải danh sách người dùng' });
  }
});

// Khóa/Mở khóa tài khoản
router.post('/admin/users/lock/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).render('error', { message: 'Không tìm thấy người dùng' });
    user.isLocked = !user.isLocked;
    await user.save();
    res.redirect('/admin/users');
  } catch (err) {
    res.status(500).render('error', { message: 'Lỗi cập nhật tài khoản' });
  }
});

// Quản lý giao dịch gia hạn
router.get('/admin/transactions', async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ createdAt: -1 }).populate('user', 'username fullName');
    res.render('admin/transactions', { transactions });
  } catch (err) {
    res.status(500).render('error', { message: 'Lỗi tải giao dịch' });
  }
});

// Duyệt giao dịch gia hạn
router.post('/admin/transactions/approve/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).render('error', { message: 'Không tìm thấy giao dịch' });
    
    transaction.status = 'approved';
    transaction.approvedAt = new Date();
    transaction.approvedBy = req.session.userId;
    await transaction.save();
    
    const user = await User.findById(transaction.user);
    const newExpiry = new Date(user.expiryDate);
    newExpiry.setMonth(newExpiry.getMonth() + transaction.months);
    user.expiryDate = newExpiry;
    user.isLocked = false;
    await user.save();
    
    res.redirect('/admin/transactions');
  } catch (err) {
    res.status(500).render('error', { message: 'Lỗi duyệt giao dịch' });
  }
});

// Từ chối giao dịch
router.post('/admin/transactions/reject/:id', async (req, res) => {
  try {
    await Transaction.findByIdAndUpdate(req.params.id, { status: 'rejected' });
    res.redirect('/admin/transactions');
  } catch (err) {
    res.status(500).render('error', { message: 'Lỗi từ chối giao dịch' });
  }
});

// Admin gia hạn trực tiếp cho user (cộng tiền / cộng tháng)
router.post('/admin/users/renew/:id', async (req, res) => {
  try {
    const { months } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).render('error', { message: 'Không tìm thấy người dùng' });
    
    const newExpiry = new Date(user.expiryDate > Date.now() ? user.expiryDate : Date.now());
    newExpiry.setMonth(newExpiry.getMonth() + parseInt(months || 1));
    user.expiryDate = newExpiry;
    user.isLocked = false;
    await user.save();
    
    res.redirect('/admin/users');
  } catch (err) {
    res.status(500).render('error', { message: 'Lỗi gia hạn tài khoản' });
  }
});

module.exports = router;