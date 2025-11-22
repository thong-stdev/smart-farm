const express = require('express');
const router = express.Router();
const {
    getCycles,
    getCycleById,
    createCycle,
    updateCycle,
    completeCycle,
    deleteCycle
} = require('../controllers/cycleController');
const { authenticate } = require('../middleware/auth');
const { cycleValidation } = require('../middleware/validation');

// All routes require authentication
router.use(authenticate);

router.get('/', getCycles);
router.get('/:id', getCycleById);
router.post('/', cycleValidation.create, createCycle);
router.patch('/:id', updateCycle);
router.post('/:id/complete', cycleValidation.complete, completeCycle);
router.delete('/:id', deleteCycle);

module.exports = router;
