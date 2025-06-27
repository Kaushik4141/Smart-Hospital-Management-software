const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const patientSchema = new Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, required: true },
  contact: { type: String, required: true },
  address: { type: String, required: true },
  department: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
  medicalHistory: [{ type: String }],
  currentStatus: {
    type: String,
    enum: ['Waiting', 'In Progress', 'Completed', 'Under Observation', 'Admitted', 'Discharged'],
    default: 'Waiting'
  },
  assignedWard: { type: Schema.Types.ObjectId, ref: 'Ward' },
  assignedDoctor: { type: Schema.Types.ObjectId, ref: 'Doctor' }
}, { timestamps: true });

module.exports = mongoose.model('Patient', patientSchema);
