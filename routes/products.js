const express = require('express');
const Product = require('../models/Product');
const router = express.Router();

// Danh sách sản phẩm
router.get('/products', async (req, res) => {
  try {
    const { search, category, lowStock } = req.query;
    let query = { isActive: true };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }
    if (category) query.category = category;
    if (lowStock === '1') query.$expr = { $lte: ['$quantity', '$lowStockThreshold'] };
    
    const products = await Product.find(query).sort({ createdAt: -1 });
    const categories = await Product.distinct('category');
    
    res.render('products/list', { products, categories, search, category, lowStock });
  } catch (err) {
    res.status(500).render('error', { message: 'Lỗi tải danh sách sản phẩm' });
  }
});

// Thêm sản phẩm - form
router.get('/products/add', (req, res) => {
  res.render('products/form', { product: null, error: null });
});

// Thêm sản phẩm - xử lý
router.post('/products/add', async (req, res) => {
  try {
    const { name, code, description, price, cost, quantity, lowStockThreshold, category } = req.body;
    await Product.create({ name, code, description, price, cost, quantity, lowStockThreshold, category });
    res.redirect('/products');
  } catch (err) {
    res.render('products/form', { product: null, error: 'Thêm sản phẩm thất bại: ' + err.message });
  }
});

// Sửa sản phẩm - form
router.get('/products/edit/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).render('error', { message: 'Không tìm thấy sản phẩm' });
    res.render('products/form', { product, error: null });
  } catch (err) {
    res.status(500).render('error', { message: 'Lỗi tải sản phẩm' });
  }
});

// Sửa sản phẩm - xử lý
router.post('/products/edit/:id', async (req, res) => {
  try {
    const { name, code, description, price, cost, quantity, lowStockThreshold, category } = req.body;
    await Product.findByIdAndUpdate(req.params.id, { name, code, description, price, cost, quantity, lowStockThreshold, category });
    res.redirect('/products');
  } catch (err) {
    res.render('products/form', { product: req.body, error: 'Cập nhật thất bại: ' + err.message });
  }
});

// Xóa sản phẩm
router.post('/products/delete/:id', async (req, res) => {
  try {
    await Product.findByIdAndUpdate(req.params.id, { isActive: false });
    res.redirect('/products');
  } catch (err) {
    res.status(500).render('error', { message: 'Lỗi xóa sản phẩm' });
  }
});

module.exports = router;