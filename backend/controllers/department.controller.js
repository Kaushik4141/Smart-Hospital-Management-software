const Department = require('../models/Department');
const Patient = require('../models/Patient');

// @desc    Create a new department
// @route   POST /api/departments
// @access  Private/Admin
const createDepartment = async (req, res) => {
  const { name, description } = req.body;

  try {
    const department = new Department({ name, description });
    const createdDepartment = await department.save();
    res.status(201).json(createdDepartment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all departments
// @route   GET /api/departments
// @access  Public
const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find({});
    res.json(departments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get department by ID with patient queue
// @route   GET /api/departments/:id
// @access  Public
const getDepartmentById = async (req, res) => {
  try {
    console.log(`[DEBUG_V3] Fetching department for ID: ${req.params.id}`);
    const department = await Department.findById(req.params.id);
    if (!department) {
      console.log(`[DEBUG_V3] Department with ID: ${req.params.id} not found.`);
      return res.status(404).json({ message: 'Department not found' });
    }

    // Find patients in this department
    console.log(`[DEBUG_V3] Finding patients for department: ${department.name}`);
    const patients = await Patient.find({ department: req.params.id })
      .sort({ createdAt: 'asc' });
    console.log(`[DEBUG_V3] Found ${patients.length} patients for this department.`);

    // Separate patients into current and queued
    const currentPatient = patients.find(p => p.currentStatus === 'In Progress') || null;
    const patientQueue = patients.filter(p => p.currentStatus === 'Waiting');
    console.log(`[DEBUG_V3] Current patient: ${currentPatient ? currentPatient.name : 'None'}. Waiting in queue: ${patientQueue.length}`);

    // Combine department info with queue info
    const departmentData = {
      ...department.toObject(),
      currentPatient,
      patientQueue,
    };

    console.log('[DEBUG_V3] Sending final department data with queue.');
    res.json(departmentData);
  } catch (error) {
    console.error('[ERROR_V3] in getDepartmentById:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update a department
// @route   PUT /api/departments/:id
// @access  Private/Admin
const updateDepartment = async (req, res) => {
  const { name, description } = req.body;

  try {
    const department = await Department.findById(req.params.id);

    if (department) {
      department.name = name || department.name;
      department.description = description || department.description;

      const updatedDepartment = await department.save();
      res.json(updatedDepartment);
    } else {
      res.status(404).json({ message: 'Department not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete a department
// @route   DELETE /api/departments/:id
// @access  Private/Admin
const deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);

    if (department) {
      await department.deleteOne(); // Mongoose 5+ uses deleteOne()
      res.json({ message: 'Department removed' });
    } else {
      res.status(404).json({ message: 'Department not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createDepartment,
  getDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
};
