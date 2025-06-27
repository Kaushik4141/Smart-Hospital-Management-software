const Drug = require('../models/Drug');

// @desc    Get all drugs
// @route   GET /api/drugs
// @access  Private
const getDrugs = async (req, res) => {
  try {
    const drugs = await Drug.find();
    res.json(drugs);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get a single drug by ID
// @route   GET /api/drugs/:id
// @access  Private
const getDrugById = async (req, res) => {
  try {
    const drug = await Drug.findById(req.params.id);
    if (!drug) {
      return res.status(404).json({ message: 'Drug not found' });
    }
    res.json(drug);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create a new drug
// @route   POST /api/drugs
// @access  Private/Admin
const createDrug = async (req, res) => {
  try {
    const { name, code, category, manufacturer, description, unitPrice, stockQuantity, unit } = req.body;
    const newDrug = new Drug({ name, code, category, manufacturer, description, unitPrice, stockQuantity, unit });
    const savedDrug = await newDrug.save();
    req.app.get('io').emit('drugCreated', savedDrug);
    res.status(201).json(savedDrug);
  } catch (error) {
    res.status(400).json({ message: 'Error creating drug', error: error.message });
  }
};

// @desc    Update a drug
// @route   PUT /api/drugs/:id
// @access  Private/Admin
const updateDrug = async (req, res) => {
  try {
    const updatedDrug = await Drug.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!updatedDrug) {
      return res.status(404).json({ message: 'Drug not found' });
    }
    req.app.get('io').emit('drugUpdated', updatedDrug);
    res.json(updatedDrug);
  } catch (error) {
    res.status(400).json({ message: 'Error updating drug', error: error.message });
  }
};

// @desc    Delete a drug
// @route   DELETE /api/drugs/:id
// @access  Private/Admin
const deleteDrug = async (req, res) => {
  try {
    const drug = await Drug.findById(req.params.id);
    if (!drug) {
      return res.status(404).json({ message: 'Drug not found' });
    }
    await drug.deleteOne();
    req.app.get('io').emit('drugDeleted', req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Restock a drug
// @route   POST /api/drugs/:id/restock
// @access  Private/Admin
const restockDrug = async (req, res) => {
  try {
    const { quantity } = req.body;
    if (!quantity || quantity <= 0) {
        return res.status(400).json({ message: 'Invalid quantity' });
    }
    const drug = await Drug.findById(req.params.id);
    if (!drug) {
      return res.status(404).json({ message: 'Drug not found' });
    }
    drug.stockQuantity += Number(quantity);
    const updatedDrug = await drug.save();
    req.app.get('io').emit('drugUpdated', updatedDrug);
    res.json(updatedDrug);
  } catch (error) {
    res.status(400).json({ message: 'Error restocking drug', error: error.message });
  }
};

// @desc    Search for drugs by name
// @route   GET /api/drugs/search
// @access  Private
const searchDrugs = async (req, res) => {
  try {
    const { name } = req.query;
    if (!name) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const drugs = await Drug.find({
      name: { $regex: name, $options: 'i' },
      stockQuantity: { $gt: 0 } // Only find drugs that are in stock
    }).limit(10);

    res.json(drugs);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  getDrugs,
  getDrugById,
  createDrug,
  updateDrug,
  deleteDrug,
  restockDrug,
  searchDrugs,
};
