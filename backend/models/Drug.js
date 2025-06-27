const mongoose = require('mongoose');

const DrugSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a drug name'],
    trim: true,
  },
  code: {
    type: String,
    required: [true, 'Please add a drug code'],
    unique: true,
  },
  category: {
    type: String,
    required: [true, 'Please add a category'],
  },
  manufacturer: {
    type: String,
  },
  description: {
    type: String,
  },
  unitPrice: {
    type: Number,
    required: [true, 'Please add a unit price'],
  },
  stockQuantity: {
    type: Number,
    required: [true, 'Please add stock quantity'],
    default: 0,
  },
  unit: {
    type: String,
    required: [true, 'Please specify the unit'],
    enum: ['Tablets', 'Capsules', 'Bottles', 'Vials', 'Ampules', 'Tubes', 'Patches', 'Sachets', 'ml', 'mg', 'g'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Drug', DrugSchema);
