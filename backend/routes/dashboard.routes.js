const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/dashboard.controller');
const { protect } = require('../middleware/auth.middleware');

router.route('/stats')
  .get(protect, getDashboardStats);

module.exports = router;
