const express = require('express');
const Product = require('../models/Product');
const Order = require('../models/Order');
const router = express.Router();

// Danh sách đơn hàng
router.get('/orders', async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { orderCode: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } }
      ];
    }
    const orders = await Order.find(query).sort({ createdAt: -1 }).populate('items.product');
    res.render('orders/list', { orders, status, search });
  } catch (err) {
    res.status(500).render('error', { message: 'Lỗi tải đơn hàng' });
  }
});

// Tạo đơn hàng - form
router.get('/orders/add', async (req, res) => {
  try {
    const products = await Product.find({ isActive: true, quantity: { $gt: 0 } });
    res.render('orders/form', { products, order: null, error: null });
  } catch (err) {
    res.status(500).render('error', { message: 'Lỗi tải sản phẩm' });
  }
});

// Tạo đơn hàng - xử lý
router.post('/orders/add', async (req, res) => {
  try {
    const { customerName, customerPhone, customerAddress, paymentMethod, notes } = req.body;
    const itemIds = Array.isArray(req.body['itemProduct[]']) ? req.body['itemProduct[]'] : [req.body['itemProduct[]']];
    const itemQuantities = Array.isArray(req.body['itemQuantity[]']) ? req.body['itemQuantity[]'] : [req.body['itemQuantity[]']];
    
    const items = [];
    let totalAmount = 0;
    let totalCost = 0;
    
    for (let i = 0; i < itemIds.length; i++) {
      if (!itemIds[i]) continue;
      const product = await Product.findById(itemIds[i]);
      if (!product) continue;
      const qty = parseInt(itemQuantities[i]) || 1;
      if (qty > product.quantity) {
        return res.render('orders/form', { 
          products: await Product.find({ isActive: true, quantity: { $gt: 0 } }),
          order: null, 
          error: `Sản phẩm ${product.name} không đủ số lượng (còn ${product.quantity})` 
        });
      }
      const itemTotal = product.price * qty;
      items.push({
        product: product._id,
        quantity: qty,
        unitPrice: product.price,
        totalPrice: itemTotal
      });
      totalAmount += itemTotal;
      totalCost += product.cost * qty;
      
      product.quantity -= qty;
      await product.save();
    }
    
    const orderCode = 'DH' + Date.now().toString().slice(-8);
    await Order.create({
      orderCode,
      customerName,
      customerPhone,
      customerAddress,
      items,
      totalAmount,
      totalCost,
      profit: totalAmount - totalCost,
      paymentMethod,
      notes
    });
    
    res.redirect('/orders');
  } catch (err) {
    res.render('orders/form', { 
      products: await Product.find({ isActive: true, quantity: { $gt: 0 } }),
      order: null, 
      error: 'Tạo đơn hàng thất bại: ' + err.message 
    });
  }
});

// Chi tiết đơn hàng
router.get('/orders/detail/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.product');
    if (!order) return res.status(404).render('error', { message: 'Không tìm thấy đơn hàng' });
    res.render('orders/detail', { order });
  } catch (err) {
    res.status(500).render('error', { message: 'Lỗi tải chi tiết đơn hàng' });
  }
});

// Cập nhật trạng thái đơn hàng
router.post('/orders/status/:id', async (req, res) => {
  try {
    const { status } = req.body;
    await Order.findByIdAndUpdate(req.params.id, { status });
    res.redirect('/orders');
  } catch (err) {
    res.status(500).render('error', { message: 'Lỗi cập nhật trạng thái' });
  }
});

module.exports = router;
