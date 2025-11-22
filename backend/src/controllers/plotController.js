const prisma = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Get all user's plots
 * GET /api/v1/plots
 */
const getPlots = asyncHandler(async (req, res) => {
    const plots = await prisma.plot.findMany({
        where: { userId: req.user.id },
        include: {
            _count: {
                select: {
                    cycles: true
                }
            },
            cycles: {
                where: { status: 'active' },
                select: { id: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    const plotsWithStats = plots.map(plot => ({
        id: plot.id,
        plotName: plot.plotName,
        areaSqm: parseFloat(plot.areaSqm),
        areaRai: parseFloat((plot.areaSqm / 1600).toFixed(2)),
        areaNgan: parseFloat(((plot.areaSqm % 1600) / 400).toFixed(2)),
        areaWa: parseFloat((((plot.areaSqm % 1600) % 400) / 4).toFixed(2)),
        latitude: plot.latitude ? parseFloat(plot.latitude) : null,
        longitude: plot.longitude ? parseFloat(plot.longitude) : null,
        soilInfo: plot.soilInfo,
        notes: plot.notes,
        activeCycles: plot.cycles.length,
        totalCycles: plot._count.cycles,
        createdAt: plot.createdAt
    }));

    res.json({
        success: true,
        plots: plotsWithStats,
        total: plotsWithStats.length
    });
});

/**
 * Get plot by ID
 * GET /api/v1/plots/:id
 */
const getPlotById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const plot = await prisma.plot.findFirst({
        where: {
            id: parseInt(id),
            userId: req.user.id
        },
        include: {
            cycles: {
                include: {
                    cropVariety: {
                        include: {
                            cropType: true
                        }
                    }
                },
                orderBy: { startDate: 'desc' }
            }
        }
    });

    if (!plot) {
        return res.status(404).json({
            success: false,
            error: 'Plot not found',
            code: 'NOT_FOUND'
        });
    }

    res.json({
        success: true,
        plot: {
            id: plot.id,
            plotName: plot.plotName,
            areaSqm: parseFloat(plot.areaSqm),
            areaRai: parseFloat((plot.areaSqm / 1600).toFixed(2)),
            latitude: plot.latitude ? parseFloat(plot.latitude) : null,
            longitude: plot.longitude ? parseFloat(plot.longitude) : null,
            soilInfo: plot.soilInfo,
            notes: plot.notes,
            createdAt: plot.createdAt,
            updatedAt: plot.updatedAt
        },
        cycles: plot.cycles.map(cycle => ({
            id: cycle.id,
            cycleName: cycle.cycleName,
            cropVariety: {
                id: cycle.cropVariety.id,
                name: cycle.cropVariety.name,
                cropType: cycle.cropVariety.cropType.name
            },
            startDate: cycle.startDate,
            status: cycle.status,
            actualCost: parseFloat(cycle.actualCost),
            actualRevenue: parseFloat(cycle.actualRevenue),
            profit: parseFloat(cycle.actualRevenue) - parseFloat(cycle.actualCost)
        }))
    });
});

/**
 * Create new plot
 * POST /api/v1/plots
 */
const createPlot = asyncHandler(async (req, res) => {
    const { plotName, areaSqm, latitude, longitude, soilInfo, notes } = req.body;

    // Validate required fields
    if (!plotName || !areaSqm) {
        return res.status(400).json({
            success: false,
            error: 'กรุณาระบุชื่อแปลงและขนาดพื้นที่'
        });
    }

    const plot = await prisma.plot.create({
        data: {
            userId: req.user.id,
            plotName,
            areaSqm: parseFloat(areaSqm),
            latitude: latitude ? parseFloat(latitude) : null,
            longitude: longitude ? parseFloat(longitude) : null,
            soilInfo: soilInfo || null,
            notes: notes || null
        }
    });

    res.status(201).json({
        success: true,
        message: 'สร้างแปลงสำเร็จ',
        plot: {
            id: plot.id,
            plotName: plot.plotName,
            areaSqm: parseFloat(plot.areaSqm),
            areaRai: parseFloat((plot.areaSqm / 1600).toFixed(2)),
            latitude: plot.latitude ? parseFloat(plot.latitude) : null,
            longitude: plot.longitude ? parseFloat(plot.longitude) : null,
            createdAt: plot.createdAt
        }
    });
});

/**
 * Update plot
 * PATCH /api/v1/plots/:id
 */
const updatePlot = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { plotName, areaSqm, latitude, longitude, soilInfo, notes } = req.body;

    // Check ownership
    const existingPlot = await prisma.plot.findFirst({
        where: {
            id: parseInt(id),
            userId: req.user.id
        }
    });

    if (!existingPlot) {
        return res.status(404).json({
            success: false,
            error: 'Plot not found',
            code: 'NOT_FOUND'
        });
    }

    const plot = await prisma.plot.update({
        where: { id: parseInt(id) },
        data: {
            ...(plotName && { plotName }),
            ...(areaSqm && { areaSqm: parseFloat(areaSqm) }),
            ...(latitude !== undefined && { latitude: latitude ? parseFloat(latitude) : null }),
            ...(longitude !== undefined && { longitude: longitude ? parseFloat(longitude) : null }),
            ...(soilInfo !== undefined && { soilInfo }),
            ...(notes !== undefined && { notes })
        }
    });

    res.json({
        success: true,
        message: 'อัปเดตแปลงสำเร็จ',
        plot: {
            id: plot.id,
            plotName: plot.plotName,
            notes: plot.notes,
            updatedAt: plot.updatedAt
        }
    });
});

/**
 * Delete plot
 * DELETE /api/v1/plots/:id
 */
const deletePlot = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check ownership
    const plot = await prisma.plot.findFirst({
        where: {
            id: parseInt(id),
            userId: req.user.id
        },
        include: {
            cycles: {
                where: { status: 'active' }
            }
        }
    });

    if (!plot) {
        return res.status(404).json({
            success: false,
            error: 'Plot not found',
            code: 'NOT_FOUND'
        });
    }

    // Check if there are active cycles
    if (plot.cycles.length > 0) {
        return res.status(409).json({
            success: false,
            error: 'ไม่สามารถลบแปลงที่มีรอบการปลูกอยู่ กรุณาลบรอบการปลูกก่อน',
            code: 'ACTIVE_CYCLES_EXIST',
            activeCycles: plot.cycles.length
        });
    }

    await prisma.plot.delete({
        where: { id: parseInt(id) }
    });

    res.json({
        success: true,
        message: 'ลบแปลงสำเร็จ'
    });
});

module.exports = {
    getPlots,
    getPlotById,
    createPlot,
    updatePlot,
    deletePlot
};
