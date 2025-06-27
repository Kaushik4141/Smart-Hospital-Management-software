const Patient = require('../models/Patient');
const Department = require('../models/Department');

const getFullPatient = (id) => Patient.findById(id).populate('department', 'name');

// @desc    Register a new patient
// @route   POST /api/patients/register
// @access  Private/Receptionist
const registerPatient = async (req, res) => {
  try {
    const { name, age, gender, contact, address, department, medicalHistory } = req.body;
    const newPatient = new Patient({ name, age, gender, contact, address, department, medicalHistory });
    await newPatient.save();
    const populatedPatient = await getFullPatient(newPatient._id);
    req.app.get('io').emit('patientCreated', populatedPatient);
    res.status(201).json(populatedPatient);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get all patients
// @route   GET /api/patients
// @access  Private
const getPatients = async (req, res) => {
  try {
    const patients = await Patient.find().populate('department', 'name').sort({ createdAt: -1 });
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get patient by ID
// @route   GET /api/patients/:id
// @access  Private
const getPatientById = async (req, res) => {
  try {
    const patient = await getFullPatient(req.params.id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    res.json(patient);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update patient status
// @route   PUT /api/patients/:id/status
// @access  Private
const updatePatientStatus = async (req, res) => {
  try {
    const { currentStatus } = req.body;
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    patient.currentStatus = currentStatus;
    await patient.save();

    const populatedPatient = await getFullPatient(patient._id);
    req.app.get('io').emit('patientUpdated', populatedPatient);
    res.json(populatedPatient);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Transfer a patient to another department
// @route   POST /api/patients/:id/transfer
// @access  Private
const transferPatient = async (req, res) => {
  try {
    const { departmentId, notes } = req.body;
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    const department = await Department.findById(departmentId);
    if (!department) return res.status(404).json({ message: 'Department not found' });

    patient.department = departmentId;
    patient.currentStatus = 'Waiting'; // Reset status on transfer
    patient.notes = notes;
    await patient.save();

    const populatedPatient = await getFullPatient(patient._id);
    req.app.get('io').emit('patientUpdated', populatedPatient);
    res.json(populatedPatient);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Search for patients by name
// @route   GET /api/patients/search?q=...
// @access  Private
const searchPatients = async (req, res) => {
  try {
    const query = req.query.q || '';
    // Find patients whose name contains the query text, case-insensitively
    const patients = await Patient.find({
      name: { $regex: query, $options: 'i' },
    })
      .select('name') // Select only name and id for the response
      .limit(10); // Limit the number of results
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

const deletePatient = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    await patient.deleteOne();
    req.app.get('io').emit('patientDeleted', req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

const updatePatient = async (req, res) => {
  try {
    const { status, description, transfer } = req.body;
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Update status and history
    if (status && status !== patient.currentStatus) {
      patient.previousStatus = patient.currentStatus;
      patient.currentStatus = status;
      patient.history.push({
        status,
        description,
        timestamp: new Date(),
      });
    }

    // Handle transfer if details are provided
    if (transfer && transfer.type && transfer.targetId) {
      patient.department = transfer.targetId; // Simplified for now
      patient.history.push({
        status: `Transferred to ${transfer.type}`,
        description: `Transferred to department/ward/OT: ${transfer.targetId}`,
        timestamp: new Date(),
      });
    }

    await patient.save();
    const populatedPatient = await getFullPatient(patient._id);

    // Emit socket event for real-time update
    req.app.get('io').emit('patientUpdated', populatedPatient);

    res.json(populatedPatient);
  } catch (error) {
    console.error('Error updating patient:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = {
  registerPatient,
  getPatients,
  getPatientById,
  updatePatientStatus,
  transferPatient,
  deletePatient,
  searchPatients,
  updatePatient
};
