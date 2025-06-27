const express = require('express');
const router = express.Router();
const {
  getPrescriptions,
  getPrescriptionById,
  createPrescription,
  updatePrescriptionStatus,
} = require('../controllers/prescription.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.route('/')
  .get(protect, getPrescriptions)
  .post(protect, authorize('Doctor'), createPrescription);

router.route('/:id')
  .get(protect, getPrescriptionById);

router.put('/:id/status', protect, authorize('Pharmacist'), updatePrescriptionStatus);

module.exports = router;
