const prisma = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Get all crop types (public)
 * GET /api/v1/public/crop-types
 */
const getCropTypes = asyncHandler(async (req, res) => {
    const cropTypes = await prisma.cropType.findMany({
        include: {
            _count: {
                select: { varieties: true }
            }
        },
        orderBy: { name: 'asc' }
    });

    res.json({
        success: true,
        cropTypes: cropTypes.map(type => ({
            id: type.id,
            name: type.name,
            description: type.description,
            iconUrl: type.iconUrl,
            varietyCount: type._count.varieties
        }))
    });
});

/**
 * Create crop type (admin only)
 * POST /api/admin/crop-types
 */
const createCropType = asyncHandler(async (req, res) => {
    const { name, description, iconUrl } = req.body;

    const cropType = await prisma.cropType.create({
        data: {
            name,
            description: description || null,
            iconUrl: iconUrl || null
        }
    });

    res.status(201).json({
        success: true,
        message: 'สร้างประเภทพืชสำเร็จ',
        cropType
    });
});

/**
 * Update crop type (admin only)
 * PUT /api/admin/crop-types/:id
 */
const updateCropType = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, description, iconUrl } = req.body;

    const cropType = await prisma.cropType.update({
        where: { id: parseInt(id) },
        data: {
            name,
            description: description || null,
            iconUrl: iconUrl || null
        }
    });

    res.json({
        success: true,
        message: 'อัปเดตประเภทพืชสำเร็จ',
        cropType
    });
});

/**
 * Delete crop type (admin only)
 * DELETE /api/admin/crop-types/:id
 */
const deleteCropType = asyncHandler(async (req, res) => {
    const { id } = req.params;

    await prisma.cropType.delete({
        where: { id: parseInt(id) }
    });

    res.json({
        success: true,
        message: 'ลบประเภทพืชสำเร็จ'
    });
});

/**
 * Get crop varieties by type (public)
 * GET /api/v1/public/crop-varieties?crop_type_id=:id
 */
const getCropVarieties = asyncHandler(async (req, res) => {
    const { crop_type_id } = req.query;

    const where = crop_type_id ? { cropTypeId: parseInt(crop_type_id) } : {};

    const varieties = await prisma.cropVariety.findMany({
        where,
        include: {
            cropType: true
        },
        orderBy: { name: 'asc' }
    });

    res.json({
        success: true,
        varieties: varieties.map(variety => ({
            id: variety.id,
            cropTypeId: variety.cropTypeId,
            name: variety.name,
            description: variety.description,
            imageUrl: variety.imageUrl,
            additionalInfo: variety.additionalInfo,
            cropType: {
                id: variety.cropType.id,
                name: variety.cropType.name
            }
        }))
    });
});

/**
 * Create crop variety (admin only)
 * POST /api/admin/crop-varieties
 */
const createCropVariety = asyncHandler(async (req, res) => {
    const { cropTypeId, name, description, imageUrl, additionalInfo } = req.body;

    const cropVariety = await prisma.cropVariety.create({
        data: {
            cropTypeId,
            name,
            description: description || null,
            imageUrl: imageUrl || null,
            additionalInfo: additionalInfo || null
        },
        include: {
            cropType: true
        }
    });

    res.status(201).json({
        success: true,
        message: 'สร้างสายพันธุ์พืชสำเร็จ',
        cropVariety
    });
});

/**
 * Update crop variety (admin only)
 * PUT /api/admin/crop-varieties/:id
 */
const updateCropVariety = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { cropTypeId, name, description, imageUrl, additionalInfo } = req.body;

    const cropVariety = await prisma.cropVariety.update({
        where: { id: parseInt(id) },
        data: {
            cropTypeId,
            name,
            description: description || null,
            imageUrl: imageUrl || null,
            additionalInfo: additionalInfo || null
        },
        include: {
            cropType: true
        }
    });

    res.json({
        success: true,
        message: 'อัปเดตสายพันธุ์พืชสำเร็จ',
        cropVariety
    });
});

/**
 * Delete crop variety (admin only)
 * DELETE /api/admin/crop-varieties/:id
 */
const deleteCropVariety = asyncHandler(async (req, res) => {
    const { id } = req.params;

    await prisma.cropVariety.delete({
        where: { id: parseInt(id) }
    });

    res.json({
        success: true,
        message: 'ลบสายพันธุ์พืชสำเร็จ'
    });
});

/**
 * Get all standard plans (public)
 * GET /api/v1/public/standard-plans
 */
const getAllStandardPlans = asyncHandler(async (req, res) => {
    const plans = await prisma.standardPlan.findMany({
        include: {
            cropVariety: {
                include: {
                    cropType: true
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    res.json({
        success: true,
        plans: plans.map(plan => ({
            id: plan.id,
            cropVarietyId: plan.cropVarietyId,
            planName: plan.planName,
            totalDays: plan.totalDays,
            costEstimate: parseFloat(plan.costEstimate || 0),
            planDetails: plan.planDetails,
            varietyName: plan.cropVariety.name,
            cropTypeName: plan.cropVariety.cropType.name
        }))
    });
});

/**
 * Get standard plans by variety (public)
 * GET /api/v1/public/standard-plans/:variety_id
 */
const getStandardPlans = asyncHandler(async (req, res) => {
    const { variety_id } = req.params;

    const plans = await prisma.standardPlan.findMany({
        where: { cropVarietyId: parseInt(variety_id) },
        orderBy: { createdAt: 'desc' }
    });

    res.json({
        success: true,
        plans: plans.map(plan => ({
            id: plan.id,
            cropVarietyId: plan.cropVarietyId,
            planName: plan.planName,
            totalDays: plan.totalDays,
            costEstimate: parseFloat(plan.costEstimate || 0),
            planDetails: plan.planDetails
        }))
    });
});

/**
 * Create standard plan (admin only)
 * POST /api/admin/standard-plans
 */
const createStandardPlan = asyncHandler(async (req, res) => {
    const { cropVarietyId, planName, totalDays, costEstimate, planDetails } = req.body;

    const plan = await prisma.standardPlan.create({
        data: {
            cropVarietyId,
            planName,
            totalDays,
            costEstimate,
            planDetails
        }
    });

    res.status(201).json({
        success: true,
        message: 'สร้างแผนการปลูกสำเร็จ',
        plan
    });
});

/**
 * Update standard plan (admin only)
 * PUT /api/admin/standard-plans/:id
 */
const updateStandardPlan = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { cropVarietyId, planName, totalDays, costEstimate, planDetails } = req.body;

    const plan = await prisma.standardPlan.update({
        where: { id: parseInt(id) },
        data: {
            cropVarietyId,
            planName,
            totalDays,
            costEstimate,
            planDetails
        }
    });

    res.json({
        success: true,
        message: 'อัปเดตแผนการปลูกสำเร็จ',
        plan
    });
});

/**
 * Delete standard plan (admin only)
 * DELETE /api/admin/standard-plans/:id
 */
const deleteStandardPlan = asyncHandler(async (req, res) => {
    const { id } = req.params;

    await prisma.standardPlan.delete({
        where: { id: parseInt(id) }
    });

    res.json({
        success: true,
        message: 'ลบแผนการปลูกสำเร็จ'
    });
});

/**
 * Get all activity types (public)
 * GET /api/v1/public/activity-types
 */
const getActivityTypes = asyncHandler(async (req, res) => {
    const activityTypes = await prisma.activityType.findMany({
        orderBy: { name: 'asc' }
    });

    res.json({
        success: true,
        activityTypes
    });
});

module.exports = {
    getCropTypes,
    createCropType,
    updateCropType,
    deleteCropType,
    getCropVarieties,
    createCropVariety,
    updateCropVariety,
    deleteCropVariety,
    deleteCropVariety,
    getAllStandardPlans,
    getStandardPlans,
    createStandardPlan,
    updateStandardPlan,
    deleteStandardPlan,
    getActivityTypes
};
