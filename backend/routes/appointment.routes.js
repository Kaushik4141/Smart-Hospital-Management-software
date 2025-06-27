const express = require('express');
const router = express.Router();
const {
  createAppointment,
  getAppointments,
  updateAppointmentStatus,
} = require('../controllers/appointment.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.route('/')
  .post(protect, authorize('Admin', 'Receptionist'), createAppointment)
  .get(protect, authorize('Admin', 'Receptionist', 'Doctor'), getAppointments);

router.route('/:id')
  .put(protect, authorize('Admin', 'Receptionist', 'Doctor'), updateAppointmentStatus);

module.exports = router;
