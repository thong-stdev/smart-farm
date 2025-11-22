const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const plotRoutes = require('./plots');
const cycleRoutes = require('./cycles');
const activityRoutes = require('./activities');
const publicRoutes = require('./public');
const adminRoutes = require('./admin');

// Mount routes
router.use('/auth', authRoutes);
router.use('/plots', plotRoutes);
router.use('/cycles', cycleRoutes);
router.use('/activities', activityRoutes);
router.use('/reports', require('./reports'));
router.use('/public', publicRoutes);
router.use('/admin', adminRoutes);
router.use('/upload', require('./upload'));

module.exports = router;
