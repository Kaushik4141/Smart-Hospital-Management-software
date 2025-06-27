const express = require('express');
const router = express.Router();
const {
  getDrugs,
  getDrugById,
  createDrug,
  updateDrug,
  deleteDrug,
  restockDrug,
  searchDrugs,
} = require('../controllers/drug.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.get('/search', protect, authorize('Admin', 'Pharmacist'), searchDrugs);

router.route('/')
  .get(protect, getDrugs)
  .post(protect, authorize('Admin', 'Pharmacist'), createDrug);

router.route('/:id')
  .get(protect, getDrugById)
  .put(protect, authorize('Admin', 'Pharmacist'), updateDrug)
  .delete(protect, authorize('Admin'), deleteDrug);

router.post('/:id/restock', protect, authorize('Admin', 'Pharmacist'), restockDrug);

module.exports = router;
