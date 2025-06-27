const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const wardSchema = new Schema({
  wardNumber: { type: String, required: true, unique: true },
  capacity: { type: Number, required: true },
  currentOccupancy: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('Ward', wardSchema);
