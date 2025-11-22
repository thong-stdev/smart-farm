const express = require('express');
const router = express.Router();
const {
    getUsers,
    getUserById,
    getUserPlots,
    getMapData,
    getStats,
    createCropType,
    createCropVariety,
    createActivityType
} = require('../controllers/adminController');
const {
    updateCropType,
    deleteCropType,
    updateCropVariety,
    deleteCropVariety,
    createStandardPlan,
    updateStandardPlan,
    deleteStandardPlan
} = require('../controllers/publicController');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/adminAuth');
const { body } = require('express-validator');
const { validate } = require('../middleware/validation');

// All routes require admin authentication
router.use(authenticate);
router.use(requireAdmin);

// User management
router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.get('/users/:id/plots', getUserPlots);

// Map data
router.get('/map-data', getMapData);

// Statistics
router.get('/stats', getStats);

// Master data management
router.post('/crop-types', [
    body('name').trim().notEmpty().withMessage('ชื่อประเภทพืชจำเป็น'),
    validate
], createCropType);

router.put('/crop-types/:id', [
    body('name').trim().notEmpty().withMessage('ชื่อประเภทพืชจำเป็น'),
    validate
], updateCropType);

router.delete('/crop-types/:id', deleteCropType);

router.post('/crop-varieties', [
    body('cropTypeId').isInt().withMessage('Invalid crop type ID'),
    body('name').trim().notEmpty().withMessage('ชื่อสายพันธุ์พืชจำเป็น'),
    validate
], createCropVariety);

router.put('/crop-varieties/:id', [
    body('cropTypeId').isInt().withMessage('Invalid crop type ID'),
    body('name').trim().notEmpty().withMessage('ชื่อสายพันธุ์พืชจำเป็น'),
    validate
], updateCropVariety);

router.delete('/crop-varieties/:id', deleteCropVariety);

router.post('/activity-types', [
    body('name').trim().notEmpty().withMessage('ชื่อประเภทกิจกรรมจำเป็น'),
    validate
], createActivityType);

// Standard Plans routes
router.post('/standard-plans', createStandardPlan);
router.put('/standard-plans/:id', updateStandardPlan);
router.delete('/standard-plans/:id', deleteStandardPlan);

module.exports = router;
