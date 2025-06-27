const express = require('express');
const router = express.Router();
const { createWard, getWards, getWardById } = require('../controllers/ward.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.route('/')
  .post(protect, authorize('Admin'), createWard)
  .get(protect, getWards);

router.route('/:id')
  .get(protect, getWardById);

module.exports = router;
