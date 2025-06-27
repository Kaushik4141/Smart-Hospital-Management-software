const Bed = require('../models/Bed');
const Ward = require('../models/Ward');
const Patient = require('../models/Patient');

// @desc    Get all beds
// @route   GET /api/beds
// @access  Private
const getBeds = async (req, res) => {
  try {
    const beds = await Bed.find({})
      .populate('ward', 'name')
      .populate('patient', 'name age gender'); // Populate patient details
    res.json(beds);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get bed by ID
// @route   GET /api/beds/:id
// @access  Private
const getBedById = async (req, res) => {
  try {
    const bed = await Bed.findById(req.params.id)
      .populate('ward', 'name')
      .populate('patient'); // Populate full patient details
    if (bed) {
      res.json(bed);
    } else {
      res.status(404).json({ message: 'Bed not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create a new bed
// @route   POST /api/beds
// @access  Private/Admin
const createBed = async (req, res) => {
  const { number, ward, type } = req.body;
  try {
    const bed = new Bed({ number, ward, type });
    const createdBed = await bed.save();
    res.status(201).json(createdBed);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Admit a patient to a bed
// @route   POST /api/beds/:id/admit
// @access  Private/Receptionist
const admitPatient = async (req, res) => {
  const { patientId } = req.body;
  try {
    const bed = await Bed.findById(req.params.id);
    const patient = await Patient.findById(patientId);

    if (!bed || !patient) {
      return res.status(404).json({ message: 'Bed or Patient not found' });
    }
    if (bed.isOccupied) {
      return res.status(400).json({ message: 'Bed is already occupied' });
    }

    bed.isOccupied = true;
    bed.patient = patientId;
    await bed.save();

    patient.assignedWard = bed.ward;
    patient.currentStatus = 'Admitted';
    await patient.save();

    const populatedBed = await Bed.findById(bed._id).populate('patient').populate('ward');

    req.app.get('io').emit('bedUpdated', populatedBed);
    res.json(populatedBed);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Discharge a patient from a bed
// @route   POST /api/beds/:id/discharge
// @access  Private/Receptionist
const dischargePatient = async (req, res) => {
  try {
    const bed = await Bed.findById(req.params.id);
    if (!bed) {
      return res.status(404).json({ message: 'Bed not found' });
    }
    if (!bed.isOccupied) {
      return res.status(400).json({ message: 'Bed is already vacant' });
    }

    const patientId = bed.patient;
    bed.isOccupied = false;
    bed.patient = null;
    await bed.save();

    const patient = await Patient.findById(patientId);
    if (patient) {
      patient.currentStatus = 'Discharged';
      patient.assignedWard = null;
      await patient.save();
    }

    const populatedBed = await Bed.findById(bed._id).populate('ward');

    req.app.get('io').emit('bedUpdated', populatedBed);
    res.json(populatedBed);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getBeds, getBedById, createBed, admitPatient, dischargePatient };
