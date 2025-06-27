const express = require('express');
const router = express.Router();
const {
  createDoctor,
  getDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
} = require('../controllers/doctor.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.route('/')
  .post(protect, authorize('Admin'), createDoctor)
  .get(protect, getDoctors);

router.route('/:id')
  .get(protect, getDoctorById)
  .put(protect, authorize('Admin'), updateDoctor)
  .delete(protect, authorize('Admin'), deleteDoctor);

module.exports = router;
