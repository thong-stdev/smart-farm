const express = require('express');
const router = express.Router();
const {
    getPlots,
    getPlotById,
    createPlot,
    updatePlot,
    deletePlot
} = require('../controllers/plotController');
const { authenticate } = require('../middleware/auth');
const { plotValidation } = require('../middleware/validation');

// All routes require authentication
router.use(authenticate);

router.get('/', getPlots);
router.get('/:id', getPlotById);
router.post('/', plotValidation.create, createPlot);
router.patch('/:id', plotValidation.update, updatePlot);
router.delete('/:id', deletePlot);

module.exports = router;
