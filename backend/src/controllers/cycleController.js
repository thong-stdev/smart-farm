const prisma = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Get cycles by plot or all user cycles
 * GET /api/cycles?plot_id=:id (optional)
 */
const getCycles = asyncHandler(async (req, res) => {
    const { plot_id } = req.query;

    let whereClause = {};

    if (plot_id) {
        // Verify plot ownership
        const plot = await prisma.plot.findFirst({
            where: {
                id: parseInt(plot_id),
                userId: req.user.id
            }
        });

        if (!plot) {
            return res.status(404).json({
                success: false,
                error: 'Plot not found',
                code: 'NOT_FOUND'
            });
        }

        whereClause.plotId = parseInt(plot_id);
    } else {
        // Get all cycles from user's plots
        const userPlots = await prisma.plot.findMany({
            where: { userId: req.user.id },
            select: { id: true }
        });

        if (userPlots.length === 0) {
            return res.json({
                success: true,
                cycles: []
            });
        }

        whereClause.plotId = {
            in: userPlots.map(p => p.id)
        };
    }

    const cycles = await prisma.plantingCycle.findMany({
        where: whereClause,
        include: {
            plot: {
                select: { plotName: true, areaSqm: true }
            },
            cropVariety: {
                include: {
                    cropType: true
                }
            },
            _count: {
                select: { activityLogs: true }
            }
        },
        orderBy: { startDate: 'desc' }
    });

    const cyclesWithStats = cycles.map(cycle => {
        const daysElapsed = cycle.endDate
            ? Math.floor((new Date(cycle.endDate) - new Date(cycle.startDate)) / (1000 * 60 * 60 * 24))
            : Math.floor((new Date() - new Date(cycle.startDate)) / (1000 * 60 * 60 * 24));

        return {
            id: cycle.id,
            plotName: cycle.plot.plotName,
            cycleName: cycle.cycleName,
            cropVariety: {
                id: cycle.cropVariety.id,
                name: cycle.cropVariety.name,
                cropType: {
                    id: cycle.cropVariety.cropType.id,
                    name: cycle.cropVariety.cropType.name
                }
            },
            startDate: cycle.startDate,
            endDate: cycle.endDate,
            status: cycle.status,
            expectedHarvestDate: cycle.expectedHarvestDate,
            actualCost: parseFloat(cycle.actualCost),
            actualRevenue: parseFloat(cycle.actualRevenue),
            profit: parseFloat(cycle.actualRevenue) - parseFloat(cycle.actualCost),
            daysElapsed,
            activityCount: cycle._count.activityLogs,
            plotAreaRai: parseFloat((cycle.plot.areaSqm / 1600).toFixed(2))
        };
    });

    res.json({
        success: true,
        cycles: cyclesWithStats
    });
});

/**
 * Get cycle by ID
 * GET /api/v1/cycles/:id
 */
const getCycleById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const cycle = await prisma.plantingCycle.findFirst({
        where: { id: parseInt(id) },
        include: {
            plot: {
                select: {
                    id: true,
                    plotName: true,
                    areaSqm: true,
                    userId: true
                }
            },
            cropVariety: {
                include: {
                    cropType: true
                }
            },
            standardPlan: true,
            activityLogs: {
                include: {
                    activityType: true,
                    images: true
                },
                orderBy: { activityDate: 'desc' }
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

    // Check ownership
    if (cycle.plot.userId !== req.user.id) {
        return res.status(403).json({
            success: false,
            error: 'Access denied',
            code: 'FORBIDDEN'
        });
    }

    const daysElapsed = cycle.endDate
        ? Math.floor((new Date(cycle.endDate) - new Date(cycle.startDate)) / (1000 * 60 * 60 * 24))
        : Math.floor((new Date() - new Date(cycle.startDate)) / (1000 * 60 * 60 * 24));

    res.json({
        success: true,
        cycle: {
            id: cycle.id,
            plot: {
                id: cycle.plot.id,
                plotName: cycle.plot.plotName,
                areaRai: parseFloat((cycle.plot.areaSqm / 1600).toFixed(2))
            },
            cropVariety: {
                id: cycle.cropVariety.id,
                name: cycle.cropVariety.name,
                cropType: cycle.cropVariety.cropType.name,
                imageUrl: cycle.cropVariety.imageUrl
            },
            standardPlan: cycle.standardPlan ? {
                id: cycle.standardPlan.id,
                planName: cycle.standardPlan.planName,
                totalDays: cycle.standardPlan.totalDays,
                planDetails: cycle.standardPlan.planDetails
            } : null,
            cycleName: cycle.cycleName,
            startDate: cycle.startDate,
            endDate: cycle.endDate,
            status: cycle.status,
            expectedHarvestDate: cycle.expectedHarvestDate,
            actualCost: parseFloat(cycle.actualCost),
            actualRevenue: parseFloat(cycle.actualRevenue),
            profit: parseFloat(cycle.actualRevenue) - parseFloat(cycle.actualCost),
            daysElapsed,
            notes: cycle.notes,
            createdAt: cycle.createdAt
        },
        activities: cycle.activityLogs.map(log => ({
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
            }))
        }))
    });
});

/**
 * Create new planting cycle
 * POST /api/v1/cycles
 */
const createCycle = asyncHandler(async (req, res) => {
    const {
        plotId,
        cropVarietyId,
        standardPlanId,
        cycleName,
        startDate,
        notes
    } = req.body;

    // Verify plot ownership
    const plot = await prisma.plot.findFirst({
        where: {
            id: plotId,
            userId: req.user.id
        }
    });

    if (!plot) {
        return res.status(404).json({
            success: false,
            error: 'Plot not found',
            code: 'NOT_FOUND'
        });
    }

    // Check if plot has active cycle
    const activeCycle = await prisma.plantingCycle.findFirst({
        where: {
            plotId,
            status: 'active'
        }
    });

    if (activeCycle) {
        return res.status(409).json({
            success: false,
            error: 'แปลงนี้มีรอบการปลูกที่กำลังดำเนินการอยู่แล้ว',
            code: 'ACTIVE_CYCLE_EXISTS',
            existingCycle: {
                id: activeCycle.id,
                cycleName: activeCycle.cycleName,
                startDate: activeCycle.startDate
            }
        });
    }

    // Get standard plan if provided
    let expectedHarvestDate = null;
    if (standardPlanId) {
        const plan = await prisma.standardPlan.findUnique({
            where: { id: standardPlanId }
        });
        if (plan) {
            expectedHarvestDate = new Date(startDate);
            expectedHarvestDate.setDate(expectedHarvestDate.getDate() + plan.totalDays);
        }
    }

    const cycle = await prisma.plantingCycle.create({
        data: {
            plotId,
            cropVarietyId,
            standardPlanId: standardPlanId || null,
            cycleName: cycleName || null,
            startDate: new Date(startDate),
            expectedHarvestDate,
            notes: notes || null
        },
        include: {
            plot: {
                select: { plotName: true }
            },
            cropVariety: {
                select: { name: true }
            }
        }
    });

    res.status(201).json({
        success: true,
        message: 'เริ่มรอบการปลูกสำเร็จ',
        cycle: {
            id: cycle.id,
            cycleName: cycle.cycleName,
            plotName: cycle.plot.plotName,
            cropVariety: cycle.cropVariety.name,
            startDate: cycle.startDate,
            expectedHarvestDate: cycle.expectedHarvestDate,
            status: cycle.status,
            createdAt: cycle.createdAt
        }
    });
});

/**
 * Update cycle
 * PATCH /api/v1/cycles/:id
 */
const updateCycle = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { cycleName, notes } = req.body;

    const cycle = await prisma.plantingCycle.findFirst({
        where: { id: parseInt(id) },
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

    const updated = await prisma.plantingCycle.update({
        where: { id: parseInt(id) },
        data: {
            ...(cycleName && { cycleName }),
            ...(notes !== undefined && { notes })
        }
    });

    res.json({
        success: true,
        message: 'อัปเดตรอบการปลูกสำเร็จ',
        cycle: updated
    });
});

/**
 * Complete planting cycle
 * POST /api/v1/cycles/:id/complete
 */
const completeCycle = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { endDate, notes } = req.body;

    const cycle = await prisma.plantingCycle.findFirst({
        where: { id: parseInt(id) },
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

    const updated = await prisma.plantingCycle.update({
        where: { id: parseInt(id) },
        data: {
            status: 'completed',
            endDate: new Date(endDate),
            notes: notes || cycle.notes
        }
    });

    const totalDays = Math.floor(
        (new Date(updated.endDate) - new Date(updated.startDate)) / (1000 * 60 * 60 * 24)
    );

    const cost = parseFloat(updated.actualCost);
    const revenue = parseFloat(updated.actualRevenue);
    const profit = revenue - cost;
    const roi = cost > 0 ? ((profit / cost) * 100).toFixed(2) : 0;

    res.json({
        success: true,
        message: 'จบรอบการปลูกสำเร็จ',
        cycle: {
            id: updated.id,
            status: updated.status,
            startDate: updated.startDate,
            endDate: updated.endDate,
            totalDays,
            actualCost: cost,
            actualRevenue: revenue,
            profit,
            roiPercentage: parseFloat(roi)
        }
    });
});

/**
 * Delete cycle
 * DELETE /api/v1/cycles/:id
 */
const deleteCycle = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const cycle = await prisma.plantingCycle.findFirst({
        where: { id: parseInt(id) },
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

    await prisma.plantingCycle.delete({
        where: { id: parseInt(id) }
    });

    res.json({
        success: true,
        message: 'ลบรอบการปลูกสำเร็จ'
    });
});

module.exports = {
    getCycles,
    getCycleById,
    createCycle,
    updateCycle,
    completeCycle,
    deleteCycle
};
