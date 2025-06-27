const Patient = require('../models/Patient');
const Bed = require('../models/Bed');
const Appointment = require('../models/Appointment');
const Department = require('../models/Department');
const User = require('../models/User');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    const admittedPatients = await Patient.countDocuments({ currentStatus: 'Admitted' });
    const availableBeds = await Bed.countDocuments({ isOccupied: false });
    const upcomingAppointments = await Appointment.countDocuments({
      status: 'Scheduled',
      appointmentDate: { $gte: new Date() },
    });
    const totalDepartments = await Department.countDocuments();
    const totalStaff = await User.countDocuments();

    res.json({
      admittedPatients,
      availableBeds,
      upcomingAppointments,
      totalDepartments,
      totalStaff,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getDashboardStats };
