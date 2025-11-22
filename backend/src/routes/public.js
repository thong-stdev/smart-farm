const express = require('express');
const router = express.Router();
const {
    getCropTypes,
    getCropVarieties,
    getAllStandardPlans,
    getStandardPlans,
    getActivityTypes
} = require('../controllers/publicController');

// Public routes (no authentication required)
router.get('/crop-types', getCropTypes);
router.get('/crop-varieties', getCropVarieties);
router.get('/standard-plans', getAllStandardPlans);
router.get('/standard-plans/:variety_id', getStandardPlans);
router.get('/activity-types', getActivityTypes);

module.exports = router;
