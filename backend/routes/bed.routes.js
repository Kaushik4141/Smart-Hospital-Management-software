const express = require('express');
const router = express.Router();
const {
  getBeds,
  getBedById,
  createBed,
  admitPatient,
  dischargePatient,
} = require('../controllers/bed.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router
  .route('/')
  .get(protect, authorize('Admin', 'Receptionist', 'Doctor'), getBeds)
  .post(protect, authorize('Admin'), createBed);

router
  .route('/:id')
  .get(protect, authorize('Admin', 'Receptionist', 'Doctor'), getBedById);

router
  .route('/:id/admit')
  .post(protect, authorize('Admin', 'Receptionist'), admitPatient);

router
  .route('/:id/discharge')
  .post(protect, authorize('Admin', 'Receptionist'), dischargePatient);

module.exports = router;
