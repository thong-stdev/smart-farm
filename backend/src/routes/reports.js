const express = require('express');
const router = express.Router();
const { getFarmOverview } = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

router.get('/overview', getFarmOverview);

module.exports = router;
