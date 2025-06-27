const express = require('express');
const router = express.Router();
const {
  registerPatient,
  getPatients,
  getPatientById,
  updatePatientStatus,
  transferPatient,
  deletePatient,
  searchPatients,
  updatePatient,
} = require('../controllers/patient.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Route to register a new patient
router.post('/register', protect, authorize('Admin', 'Receptionist'), registerPatient);

// Route to get all patients
router.get('/', protect, getPatients);

// @route   GET /api/patients/search
// @desc    Search for patients by name
// @access  Private (Pharmacist, Admin)
router.get('/search', protect, authorize('Pharmacist', 'Admin'), searchPatients);

// Routes for a specific patient by ID
router.route('/:id')
  .get(protect, getPatientById)
  .delete(protect, authorize('Admin'), deletePatient);

// Route to update a patient's status
router.put('/:id/status', protect, authorize('Admin', 'Receptionist', 'Doctor'), updatePatientStatus);

// Route to transfer a patient
router.post('/:id/transfer', protect, authorize('Admin', 'Receptionist', 'Doctor'), transferPatient);

// Route to update a patient's status and transfer details
router.post('/:id/update', protect, authorize('Admin', 'Receptionist', 'Doctor'), updatePatient);

module.exports = router;
