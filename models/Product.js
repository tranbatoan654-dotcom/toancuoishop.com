const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, trim: true },
  description: { type: String, trim: true },
  price: { type: Number, required: true, min: 0 },
  cost: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 0, default: 0 },
  lowStockThreshold: { type: Number, default: 10 },
  category: { type: String, trim: true, default: 'Khác' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

ProductSchema.virtual('isLowStock').get(function() {
  return this.quantity <= this.lowStockThreshold;
});

ProductSchema.set('toJSON', { virtuals: true });
ProductSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Product', ProductSchema);
