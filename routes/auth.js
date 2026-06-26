const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const router = express.Router();

// Trang đăng nhập
router.get('/login', (req, res) => {
  if (req.session.userId) return res.redirect('/');
  res.render('auth/login', { error: null });
});

// Xử lý đăng nhập
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.render('auth/login', { error: 'Tài khoản không tồn tại' });
    if (!user.isActive) return res.render('auth/login', { error: 'Tài khoản đã bị vô hiệu hóa' });
    if (user.isLocked) return res.render('auth/login', { error: 'Tài khoản đã bị khóa' });
    
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.render('auth/login', { error: 'Mật khẩu không đúng' });
    
    req.session.userId = user._id.toString();
    req.session.userRole = user.role;
    req.session.username = user.username;
    req.session.fullName = user.fullName || user.username;
    
    res.redirect('/');
  } catch (err) {
    res.render('auth/login', { error: 'Đã xảy ra lỗi, vui lòng thử lại' });
  }
});

// Trang đăng ký
router.get('/register', (req, res) => {
  if (req.session.userId) return res.redirect('/');
  res.render('auth/register', { error: null });
});

// Xử lý đăng ký
router.post('/register', async (req, res) => {
    try {
        const { username, password, fullName, email, phone, gitcode } = req.body;
        const existing = await User.findOne({ username });
        if (existing) return res.render('auth/register', { error: 'Tên đăng nhập đã tồn tại' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const expiryDate = new Date();

        if (gitcode && gitcode.trim().toLowerCase() === 'free1ngay') {
            expiryDate.setDate(expiryDate.getDate() + 1); // Nhập đúng gitcode → +1 ngày dùng thử
        }
        // Không nhập gitcode hoặc sai → expiryDate = now (0 ngày, hết hạn ngay, phải gia hạn)

        await User.create({
            username,
            password: hashedPassword,
            role: 'user',
            fullName,
            email,
            phone,
            expiryDate
        });
        res.redirect('/login');
    } catch (err) {
        res.render('auth/register', { error: 'Đăng ký thất bại, vui lòng thử lại' });
    }
});
// Đăng xuất
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

// Trang gia hạn
router.get('/renewal', async (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  if (req.session.userRole === 'admin') return res.redirect('/');
  
  const user = await User.findById(req.session.userId);
  const fee = parseInt(process.env.RENEWAL_FEE || 70000);
  res.render('auth/renewal', { user, fee, error: null, success: null });
});

// Xử lý gia hạn - nạp tiền
router.post('/renewal', async (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  if (req.session.userRole === 'admin') return res.redirect('/');
  
  try {
    const { months } = req.body;
    const fee = parseInt(process.env.RENEWAL_FEE || 70000);
    const amount = fee * parseInt(months);
    
    const user = await User.findById(req.session.userId);
    
    await Transaction.create({
      user: req.session.userId,
      amount,
      months: parseInt(months),
      status: 'pending'
    });
    
    res.render('auth/renewal', { user, fee, error: null, success: 'Yêu cầu gia hạn đã được gửi. Admin sẽ xác nhận sau khi nhận được thanh toán.' });
  } catch (err) {
    const user = await User.findById(req.session.userId);
    const fee = parseInt(process.env.RENEWAL_FEE || 70000);
    res.render('auth/renewal', { user, fee, error: 'Gửi yêu cầu thất bại', success: null });
  }
});

module.exports = router;
