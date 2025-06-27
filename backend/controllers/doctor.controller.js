const Doctor = require('../models/Doctor');
const User = require('../models/User');

// @desc    Create a new doctor
// @route   POST /api/doctors
// @access  Private/Admin
const createDoctor = async (req, res) => {
  const { name, email, password, department, specialization } = req.body;

  try {
    // Check if a user with this email already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'A user with this email already exists.' });
    }

    // Create a new user with the 'Doctor' role
    const user = new User({
      name,
      email,
      password, // Remember to hash passwords in a real application
      role: 'Doctor',
    });
    const createdUser = await user.save();

    // Create the new doctor linked to the user
    const doctor = new Doctor({
      userId: createdUser._id,
      department,
      specialization,
    });
    const createdDoctor = await doctor.save();

    res.status(201).json(createdDoctor);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all doctors
// @route   GET /api/doctors
// @access  Public
const getDoctors = async (req, res) => {
  try {
    // Populate user and department details
    const doctors = await Doctor.find({}).populate('userId', 'name email').populate('department', 'name');
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get doctor by ID
// @route   GET /api/doctors/:id
// @access  Public
const getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).populate('userId', 'name email').populate('department', 'name');
    if (doctor) {
      res.json(doctor);
    } else {
      res.status(404).json({ message: 'Doctor not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update a doctor's details
// @route   PUT /api/doctors/:id
// @access  Private/Admin
const updateDoctor = async (req, res) => {
  const { department, specialization } = req.body;

  try {
    const doctor = await Doctor.findById(req.params.id);

    if (doctor) {
      doctor.department = department || doctor.department;
      doctor.specialization = specialization || doctor.specialization;

      const updatedDoctor = await doctor.save();
      res.json(updatedDoctor);
    } else {
      res.status(404).json({ message: 'Doctor not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete a doctor
// @route   DELETE /api/doctors/:id
// @access  Private/Admin
const deleteDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);

    if (doctor) {
      // Also delete the associated user account
      await User.findByIdAndDelete(doctor.userId);
      await doctor.deleteOne();
      res.json({ message: 'Doctor and associated user removed' });
    } else {
      res.status(404).json({ message: 'Doctor not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createDoctor,
  getDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
};
