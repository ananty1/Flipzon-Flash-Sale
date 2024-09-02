const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  productId: { type: Number, required: true },
  startTime: { type: Date, required: true },
  availableQuantity: { type: Number, default: 1000 },
});

const Sale = mongoose.model('Sale', saleSchema);
module.exports = Sale;
