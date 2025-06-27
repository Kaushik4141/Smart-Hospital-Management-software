const Appointment = require('../models/Appointment');

// @desc    Create a new appointment
// @route   POST /api/appointments
// @access  Private/Receptionist
const createAppointment = async (req, res) => {
  const { patientId, doctorId, appointmentDate } = req.body;

  try {
    const appointment = new Appointment({
      patientId,
      doctorId,
      appointmentDate,
    });

    const createdAppointment = await appointment.save();

    // Emit a socket event to notify clients
    req.app.get('io').emit('appointment-update', createdAppointment);

    res.status(201).json(createdAppointment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all appointments
// @route   GET /api/appointments
// @access  Private
const getAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({}).populate('patientId', 'name').populate('doctorId', 'userId');
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update appointment status
// @route   PUT /api/appointments/:id
// @access  Private
const updateAppointmentStatus = async (req, res) => {
  const { status } = req.body;

  try {
    const appointment = await Appointment.findById(req.params.id);

    if (appointment) {
      appointment.status = status;
      const updatedAppointment = await appointment.save();

      // Emit a socket event to notify clients
      req.app.get('io').emit('appointment-update', updatedAppointment);

      res.json(updatedAppointment);
    } else {
      res.status(404).json({ message: 'Appointment not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createAppointment,
  getAppointments,
  updateAppointmentStatus,
};
