const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const billedItemSchema = new mongoose.Schema({
  drug: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Drug',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  unitPrice: {
    type: Number,
    required: true,
  },
  total: {
    type: Number,
    required: true,
  },
});

const billSchema = new mongoose.Schema(
  {
    billNumber: {
      type: Number,
      unique: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    items: [billedItemSchema],
    subtotal: {
      type: Number,
      required: true,
    },
    tax: {
      type: Number,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

billSchema.plugin(AutoIncrement, { inc_field: 'billNumber', start_seq: 1000 });

const Bill = mongoose.model('Bill', billSchema);

module.exports = Bill;
