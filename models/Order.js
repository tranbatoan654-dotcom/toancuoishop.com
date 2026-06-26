const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true },
  totalPrice: { type: Number, required: true }
}, { _id: false });

const OrderSchema = new mongoose.Schema({
  orderCode: { type: String, required: true, unique: true },
  customerName: { type: String, required: true, trim: true },
  customerPhone: { type: String, trim: true },
  customerAddress: { type: String, trim: true },
  items: [OrderItemSchema],
  totalAmount: { type: Number, required: true, min: 0 },
  totalCost: { type: Number, required: true, min: 0 },
  profit: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'processing', 'completed', 'cancelled'], default: 'pending' },
  paymentMethod: { type: String, default: 'cash' },
  notes: { type: String, trim: true }
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);
