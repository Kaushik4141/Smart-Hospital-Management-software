const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const bedSchema = new Schema({
  bedNumber: { type: String, required: true },
  wardId: { type: Schema.Types.ObjectId, ref: 'Ward', required: true },
  isOccupied: {
    type: Boolean,
    default: false
  },
  patientId: { type: Schema.Types.ObjectId, ref: 'Patient', default: null }
}, { timestamps: true });

// Ensure that each bed number is unique within a ward
bedSchema.index({ bedNumber: 1, wardId: 1 }, { unique: true });

module.exports = mongoose.model('Bed', bedSchema);
