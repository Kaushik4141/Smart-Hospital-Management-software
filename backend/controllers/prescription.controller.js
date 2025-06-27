const Prescription = require('../models/Prescription');
const Drug = require('../models/Drug');

// @desc    Get all prescriptions
// @route   GET /api/prescriptions
// @access  Private
const getPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.find()
      .populate('patient', 'name')
      .populate('doctor', 'name')
      .populate('prescribedDrugs.drug', 'name unitPrice');
    res.json(prescriptions);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get a single prescription by ID
// @route   GET /api/prescriptions/:id
// @access  Private
const getPrescriptionById = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('patient', 'name contact')
      .populate('doctor', 'name specialization')
      .populate('prescribedDrugs.drug', 'name unitPrice stockQuantity');
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }
    res.json(prescription);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create a new prescription
// @route   POST /api/prescriptions
// @access  Private/Doctor
const createPrescription = async (req, res) => {
  try {
    const { patient, doctor, prescribedDrugs, notes } = req.body;
    const newPrescription = new Prescription({ patient, doctor, prescribedDrugs, notes });
    const savedPrescription = await newPrescription.save();
    const populatedPrescription = await Prescription.findById(savedPrescription._id).populate('patient', 'name').populate('doctor', 'name');
    req.app.get('io').emit('prescriptionCreated', populatedPrescription);
    res.status(201).json(populatedPrescription);
  } catch (error) {
    res.status(400).json({ message: 'Error creating prescription', error: error.message });
  }
};

// @desc    Update prescription status (e.g., to 'Completed')
// @route   PUT /api/prescriptions/:id/status
// @access  Private/Pharmacist
const updatePrescriptionStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const prescription = await Prescription.findById(req.params.id).populate('prescribedDrugs.drug');

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    // If completing, deduct drug quantities from stock
    if (status === 'Completed' && prescription.status !== 'Completed') {
      for (const item of prescription.prescribedDrugs) {
        const drug = item.drug;
        if (drug.stockQuantity < item.quantity) {
          return res.status(400).json({ message: `Not enough stock for ${drug.name}` });
        }
        drug.stockQuantity -= item.quantity;
        await drug.save();
        req.app.get('io').emit('drugUpdated', drug);
      }
    }

    prescription.status = status;
    const updatedPrescription = await prescription.save();
    const populatedPrescription = await Prescription.findById(updatedPrescription._id).populate('patient', 'name').populate('doctor', 'name');
    req.app.get('io').emit('prescriptionUpdated', populatedPrescription);
    res.json(populatedPrescription);
  } catch (error) {
    res.status(400).json({ message: 'Error updating prescription', error: error.message });
  }
};

module.exports = {
  getPrescriptions,
  getPrescriptionById,
  createPrescription,
  updatePrescriptionStatus,
};
