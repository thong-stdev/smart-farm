const prisma = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');
const fs = require('fs');
const path = require('path');

/**
 * Get activities by cycle
 * GET /api/v1/activities?cycle_id=:id
 */
const getActivities = asyncHandler(async (req, res) => {
    const { cycle_id } = req.query;

    if (!cycle_id) {
        return res.status(400).json({
            success: false,
            error: 'cycle_id is required'
        });
    }

    // Verify cycle ownership
    const cycle = await prisma.plantingCycle.findFirst({
        where: { id: parseInt(cycle_id) },
        include: {
            plot: {
                select: { userId: true }
            }
        }
    });

    if (!cycle) {
        return res.status(404).json({
            success: false,
            error: 'Cycle not found',
            code: 'NOT_FOUND'
        });
    }

    if (cycle.plot.userId !== req.user.id) {
        return res.status(403).json({
            success: false,
            error: 'Access denied',
            code: 'FORBIDDEN'
        });
    }

    const activities = await prisma.activityLog.findMany({
        where: { cycleId: parseInt(cycle_id) },
        include: {
            activityType: true,
            images: true
        },
        orderBy: { activityDate: 'desc' }
    });

    const summary = await prisma.activityLog.aggregate({
        where: { cycleId: parseInt(cycle_id) },
        _sum: {
            cost: true,
            revenue: true
        },
        _min: {
            activityDate: true
        },
        _max: {
            activityDate: true
        }
    });

    res.json({
        success: true,
        activities: activities.map(log => ({
            id: log.id,
            activityType: {
                id: log.activityType.id,
                name: log.activityType.name,
                icon: log.activityType.icon,
                color: log.activityType.color
            },
            activityDate: log.activityDate,
            cost: parseFloat(log.cost),
            revenue: parseFloat(log.revenue),
            notes: log.notes,
            images: log.images.map(img => ({
                id: img.id,
                imageUrl: img.imageUrl,
                caption: img.caption
            })),
            createdAt: log.createdAt
        })),
        summary: {
            totalActivities: activities.length,
            totalCost: parseFloat(summary._sum.cost || 0),
            totalRevenue: parseFloat(summary._sum.revenue || 0),
            dateRange: {
                first: summary._min.activityDate,
                last: summary._max.activityDate
            }
        }
    });
});

/**
 * Get activity by ID
 * GET /api/v1/activities/:id
 */
const getActivityById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const activity = await prisma.activityLog.findFirst({
        where: { id: parseInt(id) },
        include: {
            cycle: {
                include: {
                    plot: {
                        select: { userId: true }
                    }
                }
            },
            activityType: true,
            images: true
        }
    });

    if (!activity) {
        return res.status(404).json({
            success: false,
            error: 'Activity not found',
            code: 'NOT_FOUND'
        });
    }

    if (activity.cycle.plot.userId !== req.user.id) {
        return res.status(403).json({
            success: false,
            error: 'Access denied',
            code: 'FORBIDDEN'
        });
    }

    res.json({
        success: true,
        activity: {
            id: activity.id,
            activityType: activity.activityType,
            activityDate: activity.activityDate,
            cost: parseFloat(activity.cost),
            revenue: parseFloat(activity.revenue),
            notes: activity.notes,
            images: activity.images,
            createdAt: activity.createdAt
        }
    });
});

/**
 * Create activity log
 * POST /api/v1/activities
 */
const createActivity = asyncHandler(async (req, res) => {
    const { cycleId, activityTypeId, activityDate, cost, revenue, notes } = req.body;

    // Verify cycle ownership
    const cycle = await prisma.plantingCycle.findFirst({
        where: { id: cycleId },
        include: {
            plot: {
                select: { userId: true }
            }
        }
    });

    if (!cycle) {
        return res.status(404).json({
            success: false,
            error: 'Cycle not found',
            code: 'NOT_FOUND'
        });
    }

    if (cycle.plot.userId !== req.user.id) {
        return res.status(403).json({
            success: false,
            error: 'Access denied',
            code: 'FORBIDDEN'
        });
    }

    const activity = await prisma.activityLog.create({
        data: {
            cycleId,
            activityTypeId,
            activityDate: new Date(activityDate),
            cost: cost || 0,
            revenue: revenue || 0,
            notes: notes || null
        },
        include: {
            activityType: true
        }
    });

    // Update cycle financials (triggers will handle this in MySQL, but for Prisma we do it manually)
    await updateCycleFinancials(cycleId);

    res.status(201).json({
        success: true,
        message: 'บันทึกกิจกรรมสำเร็จ',
        activity: {
            id: activity.id,
            cycleId: activity.cycleId,
            activityType: {
                id: activity.activityType.id,
                name: activity.activityType.name,
                icon: activity.activityType.icon
            },
            activityDate: activity.activityDate,
            cost: parseFloat(activity.cost),
            revenue: parseFloat(activity.revenue),
            notes: activity.notes,
            createdAt: activity.createdAt
        }
    });
});

/**
 * Update activity
 * PATCH /api/v1/activities/:id
 */
const updateActivity = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { cost, revenue, notes } = req.body;

    const activity = await prisma.activityLog.findFirst({
        where: { id: parseInt(id) },
        include: {
            cycle: {
                include: {
                    plot: {
                        select: { userId: true }
                    }
                }
            }
        }
    });

    if (!activity) {
        return res.status(404).json({
            success: false,
            error: 'Activity not found',
            code: 'NOT_FOUND'
        });
    }

    if (activity.cycle.plot.userId !== req.user.id) {
        return res.status(403).json({
            success: false,
            error: 'Access denied',
            code: 'FORBIDDEN'
        });
    }

    const updated = await prisma.activityLog.update({
        where: { id: parseInt(id) },
        data: {
            ...(cost !== undefined && { cost }),
            ...(revenue !== undefined && { revenue }),
            ...(notes !== undefined && { notes })
        }
    });

    // Update cycle financials
    await updateCycleFinancials(activity.cycleId);

    res.json({
        success: true,
        message: 'อัปเดตกิจกรรมสำเร็จ',
        activity: updated
    });
});

/**
 * Delete activity
 * DELETE /api/v1/activities/:id
 */
const deleteActivity = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const activity = await prisma.activityLog.findFirst({
        where: { id: parseInt(id) },
        include: {
            cycle: {
                include: {
                    plot: {
                        select: { userId: true }
                    }
                }
            }
        }
    });

    if (!activity) {
        return res.status(404).json({
            success: false,
            error: 'Activity not found',
            code: 'NOT_FOUND'
        });
    }

    if (activity.cycle.plot.userId !== req.user.id) {
        return res.status(403).json({
            success: false,
            error: 'Access denied',
            code: 'FORBIDDEN'
        });
    }

    const cycleId = activity.cycleId;

    await prisma.activityLog.delete({
        where: { id: parseInt(id) }
    });

    // Update cycle financials
    await updateCycleFinancials(cycleId);

    res.json({
        success: true,
        message: 'ลบกิจกรรมสำเร็จ'
    });
});

/**
 * Upload activity images
 * POST /api/v1/activities/:id/images
 */
const uploadImages = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Verify activity ownership
    const activity = await prisma.activityLog.findFirst({
        where: { id: parseInt(id) },
        include: {
            cycle: {
                include: {
                    plot: {
                        select: { userId: true }
                    }
                }
            }
        }
    });

    if (!activity) {
        // Clean up uploaded files if activity not found (Cloudinary handles this differently, but for now we skip explicit cleanup)
        return res.status(404).json({
            success: false,
            error: 'Activity not found',
            code: 'NOT_FOUND'
        });
    }

    if (activity.cycle.plot.userId !== req.user.id) {
        return res.status(403).json({
            success: false,
            error: 'Access denied',
            code: 'FORBIDDEN'
        });
    }

    if (!req.files || req.files.length === 0) {
        return res.status(400).json({
            success: false,
            error: 'No files uploaded'
        });
    }

    const captions = req.body.captions || [];
    const uploadedImages = [];

    for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        // Use Cloudinary URL directly
        const imageUrl = file.path;

        const image = await prisma.activityImage.create({
            data: {
                activityLogId: parseInt(id),
                imageUrl,
                caption: captions[i] || null
            }
        });

        uploadedImages.push(image);
    }

    res.status(201).json({
        success: true,
        message: 'อัปโหลดรูปภาพสำเร็จ',
        images: uploadedImages.map(img => ({
            id: img.id,
            activityLogId: img.activityLogId,
            imageUrl: img.imageUrl,
            caption: img.caption,
            uploadedAt: img.uploadedAt
        }))
    });
});

/**
 * Delete activity image
 * DELETE /api/v1/activities/:activity_id/images/:image_id
 */
const deleteImage = asyncHandler(async (req, res) => {
    const { activity_id, image_id } = req.params;

    const image = await prisma.activityImage.findFirst({
        where: { id: parseInt(image_id) },
        include: {
            activityLog: {
                include: {
                    cycle: {
                        include: {
                            plot: {
                                select: { userId: true }
                            }
                        }
                    }
                }
            }
        }
    });

    if (!image) {
        return res.status(404).json({
            success: false,
            error: 'Image not found',
            code: 'NOT_FOUND'
        });
    }

    if (image.activityLog.cycle.plot.userId !== req.user.id) {
        return res.status(403).json({
            success: false,
            error: 'Access denied',
            code: 'FORBIDDEN'
        });
    }

    // Delete image from Cloudinary (Optional: Implement if needed)
    // For now, we just delete the database record.
    // To delete from Cloudinary, we'd need the public_id, which we aren't storing directly separately,
    // but could extract from the URL.
    // const publicId = image.imageUrl.split('/').pop().split('.')[0];
    // await cloudinary.uploader.destroy('smart-farm/activities/' + publicId);

    await prisma.activityImage.delete({
        where: { id: parseInt(image_id) }
    });

    res.json({
        success: true,
        message: 'ลบรูปภาพสำเร็จ'
    });
});

/**
 * Helper function to update cycle financials
 */
async function updateCycleFinancials(cycleId) {
    const summary = await prisma.activityLog.aggregate({
        where: { cycleId },
        _sum: {
            cost: true,
            revenue: true
        }
    });

    await prisma.plantingCycle.update({
        where: { id: cycleId },
        data: {
            actualCost: summary._sum.cost || 0,
            actualRevenue: summary._sum.revenue || 0
        }
    });
}

module.exports = {
    getActivities,
    getActivityById,
    createActivity,
    updateActivity,
    deleteActivity,
    uploadImages,
    deleteImage
};
