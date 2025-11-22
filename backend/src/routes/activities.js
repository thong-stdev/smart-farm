const express = require('express');
const router = express.Router();
const {
    getActivities,
    getActivityById,
    createActivity,
    updateActivity,
    deleteActivity,
    uploadImages,
    deleteImage
} = require('../controllers/activityController');
const { authenticate } = require('../middleware/auth');
const { activityValidation } = require('../middleware/validation');
const upload = require('../middleware/upload');

// All routes require authentication
router.use(authenticate);

router.get('/', getActivities);
router.get('/:id', getActivityById);
router.post('/', activityValidation.create, createActivity);
router.patch('/:id', updateActivity);
router.delete('/:id', deleteActivity);

// Image upload routes
router.post('/:id/images', upload.array('files', 5), uploadImages);
router.delete('/:activity_id/images/:image_id', deleteImage);

module.exports = router;
