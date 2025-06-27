const express = require('express');
const router = express.Router();
const billController = require('../controllers/bill.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// @route   GET /api/bills
// @desc    Get all bills
// @access  Private (Pharmacist, Admin)
router.get('/', protect, authorize('Pharmacist', 'Admin'), billController.getAllBills);

// @route   POST /api/bills
// @desc    Create a new bill
// @access  Private (Pharmacist, Admin)
router.post('/', protect, authorize('Pharmacist', 'Admin'), billController.createBill);

module.exports = router;
