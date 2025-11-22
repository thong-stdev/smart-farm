const { body, param, query, validationResult } = require('express-validator');

/**
 * Middleware to check validation results
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            success: false,
            error: 'Validation failed',
            code: 'VALIDATION_ERROR',
            errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg
            }))
        });
    }
    next();
};

/**
 * Validation rules for plots
 */
const plotValidation = {
    create: [
        body('plotName')
            .trim()
            .isLength({ min: 1 })
            .withMessage('กรุณาระบุชื่อแปลง'),
        body('areaSqm')
            .isFloat({ min: 1 })
            .withMessage('พื้นที่ต้องมากกว่า 0'),
        body('latitude')
            .optional({ nullable: true })
            .isFloat({ min: -90, max: 90 })
            .withMessage('Latitude ต้องอยู่ระหว่าง -90 ถึง 90'),
        body('longitude')
            .optional({ nullable: true })
            .isFloat({ min: -180, max: 180 })
            .withMessage('Longitude ต้องอยู่ระหว่าง -180 ถึง 180'),
        validate
    ],
    update: [
        param('id').isInt().withMessage('Invalid plot ID'),
        body('plotName')
            .optional()
            .trim()
            .isLength({ min: 1 })
            .withMessage('กรุณาระบุชื่อแปลง'),
        body('areaSqm')
            .optional()
            .isFloat({ min: 1 })
            .withMessage('พื้นที่ต้องมากกว่า 0'),
        body('latitude')
            .optional({ nullable: true })
            .isFloat({ min: -90, max: 90 })
            .withMessage('Latitude ต้องอยู่ระหว่าง -90 ถึง 90'),
        body('longitude')
            .optional({ nullable: true })
            .isFloat({ min: -180, max: 180 })
            .withMessage('Longitude ต้องอยู่ระหว่าง -180 ถึง 180'),
        validate
    ]
};

/**
 * Validation rules for planting cycles
 */
const cycleValidation = {
    create: [
        body('plotId').isInt().withMessage('Invalid plot ID'),
        body('cropVarietyId').isInt().withMessage('Invalid crop variety ID'),
        body('standardPlanId').optional().isInt().withMessage('Invalid standard plan ID'),
        body('startDate').isISO8601().withMessage('Invalid start date'),
        validate
    ],
    complete: [
        param('id').isInt().withMessage('Invalid cycle ID'),
        body('endDate').isISO8601().withMessage('Invalid end date'),
        validate
    ]
};

/**
 * Validation rules for activity logs
 */
const activityValidation = {
    create: [
        body('cycleId').isInt().withMessage('Invalid cycle ID'),
        body('activityTypeId').isInt().withMessage('Invalid activity type ID'),
        body('activityDate').isISO8601().withMessage('Invalid activity date'),
        body('cost')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('ค่าใช้จ่ายต้องมากกว่าหรือเท่ากับ 0'),
        body('revenue')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('รายได้ต้องมากกว่าหรือเท่ากับ 0'),
        validate
    ]
};

module.exports = {
    validate,
    plotValidation,
    cycleValidation,
    activityValidation
};
