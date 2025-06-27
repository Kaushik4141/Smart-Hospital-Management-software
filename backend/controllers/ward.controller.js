const Ward = require('../models/Ward');
const Bed = require('../models/Bed');

// @desc    Create a new ward
// @route   POST /api/wards
// @access  Private/Admin
const createWard = async (req, res) => {
  const { wardNumber, capacity } = req.body;

  try {
    const ward = new Ward({ wardNumber, capacity });
    const createdWard = await ward.save();
    res.status(201).json(createdWard);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all wards
// @route   GET /api/wards
// @access  Private
const getWards = async (req, res) => {
  try {
    const wards = await Ward.find({});
    res.json(wards);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get ward by ID with its beds
// @route   GET /api/wards/:id
// @access  Private
const getWardById = async (req, res) => {
  try {
    const ward = await Ward.findById(req.params.id);
    if (!ward) {
      return res.status(404).json({ message: 'Ward not found' });
    }

    const beds = await Bed.find({ wardId: req.params.id });
    res.json({ ...ward.toObject(), beds });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { createWard, getWards, getWardById };
