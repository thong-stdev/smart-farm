const prisma = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Get all users (admin only)
 * GET /api/v1/admin/users
 */
const getUsers = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, role } = req.query;
    const skip = (page - 1) * limit;

    const where = role ? { role } : {};

    const [users, total] = await Promise.all([
        prisma.user.findMany({
            where,
            select: {
                id: true,
                username: true,
                email: true,
                fullName: true,
                phone: true,
                role: true,
                createdAt: true,
                _count: {
                    select: {
                        plots: true,
                        oauthProviders: true
                    }
                }
            },
            skip: parseInt(skip),
            take: parseInt(limit),
            orderBy: { createdAt: 'desc' }
        }),
        prisma.user.count({ where })
    ]);

    res.json({
        success: true,
        users: users.map(user => ({
            ...user,
            plotCount: user._count.plots,
            linkedProviders: user._count.oauthProviders
        })),
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / limit)
        }
    });
});

/**
 * Get user by ID with details
 * GET /api/admin/users/:id
 */
const getUserById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
        where: { id: parseInt(id) },
        include: {
            plots: {
                include: {
                    cycles: {
                        where: { status: 'active' }
                    }
                }
            },
            oauthProviders: {
                select: {
                    provider: true,
                    createdAt: true
                }
            }
        }
    });

    if (!user) {
        return res.status(404).json({
            success: false,
            error: 'User not found',
            code: 'NOT_FOUND'
        });
    }

    // Calculate stats
    const totalPlots = user.plots.length;
    const activePlots = user.plots.filter(p => p.cycles.length > 0).length;

    res.json({
        success: true,
        user: {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            role: user.role,
            createdAt: user.createdAt,
            providers: user.oauthProviders,
            stats: {
                totalPlots,
                activePlots,
                emptyPlots: totalPlots - activePlots
            }
        }
    });
});

/**
 * Get user's plots with location
 * GET /api/admin/users/:id/plots
 */
const getUserPlots = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Verify user exists
    const user = await prisma.user.findUnique({
        where: { id: parseInt(id) }
    });

    if (!user) {
        return res.status(404).json({
            success: false,
            error: 'User not found',
            code: 'NOT_FOUND'
        });
    }

    const plots = await prisma.plot.findMany({
        where: { userId: parseInt(id) },
        include: {
            cycles: {
                where: { status: 'active' },
                include: {
                    cropVariety: {
                        select: { name: true }
                    }
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    res.json({
        success: true,
        plots: plots.map(plot => ({
            id: plot.id,
            plotName: plot.plotName,
            areaRai: parseFloat((plot.areaSqm / 1600).toFixed(2)),
            latitude: plot.latitude ? parseFloat(plot.latitude) : null,
            longitude: plot.longitude ? parseFloat(plot.longitude) : null,
            activeCycle: plot.cycles[0] ? {
                id: plot.cycles[0].id,
                cropName: plot.cycles[0].cropVariety?.name,
                startDate: plot.cycles[0].startDate
            } : null,
            createdAt: plot.createdAt
        }))
    });
});

/**
 * Get map data (all plots with coordinates)
 * GET /api/v1/admin/map-data
 */
const getMapData = asyncHandler(async (req, res) => {
    const plots = await prisma.plot.findMany({
        where: {
            latitude: { not: null },
            longitude: { not: null }
        },
        include: {
            user: {
                select: {
                    id: true,
                    fullName: true,
                    email: true
                }
            },
            cycles: {
                where: { status: 'active' },
                include: {
                    cropVariety: {
                        select: { name: true }
                    }
                }
            }
        }
    });

    const mapData = plots.map(plot => ({
        plotId: plot.id,
        plotName: plot.plotName,
        areaSqm: parseFloat(plot.areaSqm),
        areaRai: parseFloat((plot.areaSqm / 1600).toFixed(2)),
        latitude: parseFloat(plot.latitude),
        longitude: parseFloat(plot.longitude),
        owner: {
            id: plot.user.id,
            fullName: plot.user.fullName,
            email: plot.user.email
        },
        activeCycles: plot.cycles.map(cycle => ({
            id: cycle.id,
            cropVariety: cycle.cropVariety.name,
            startDate: cycle.startDate
        }))
    }));

    res.json({
        success: true,
        plots: mapData,
        total: mapData.length
    });
});

/**
 * Get dashboard statistics
 * GET /api/v1/admin/stats
 */
const getStats = asyncHandler(async (req, res) => {
    const [
        totalUsers,
        totalPlots,
        activeCycles,
        completedCycles,
        totalAreaSqm,
        recentActivities
    ] = await Promise.all([
        prisma.user.count(),
        prisma.plot.count(),
        prisma.plantingCycle.count({ where: { status: 'active' } }),
        prisma.plantingCycle.count({ where: { status: 'completed' } }),
        prisma.plot.aggregate({
            _sum: { areaSqm: true }
        }),
        prisma.activityLog.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
                cycle: {
                    include: {
                        plot: {
                            include: {
                                user: {
                                    select: { fullName: true }
                                }
                            }
                        }
                    }
                },
                activityType: true
            }
        })
    ]);

    // Calculate financial summary from completed cycles
    const financialSummary = await prisma.plantingCycle.aggregate({
        where: { status: 'completed' },
        _sum: {
            actualCost: true,
            actualRevenue: true
        }
    });

    const totalCost = parseFloat(financialSummary._sum.actualCost || 0);
    const totalRevenue = parseFloat(financialSummary._sum.actualRevenue || 0);
    const totalProfit = totalRevenue - totalCost;

    res.json({
        success: true,
        stats: {
            users: {
                total: totalUsers
            },
            plots: {
                total: totalPlots,
                totalAreaSqm: parseFloat(totalAreaSqm._sum.areaSqm || 0),
                totalAreaRai: parseFloat((totalAreaSqm._sum.areaSqm / 1600 || 0).toFixed(2))
            },
            cycles: {
                active: activeCycles,
                completed: completedCycles,
                total: activeCycles + completedCycles
            },
            financials: {
                totalCost,
                totalRevenue,
                totalProfit,
                avgProfitPerCycle: completedCycles > 0 ? (totalProfit / completedCycles).toFixed(2) : 0
            },
            recentActivities: recentActivities.map(activity => ({
                id: activity.id,
                date: activity.activityDate,
                type: activity.activityType.name,
                userName: activity.cycle.plot.user.fullName,
                plotName: activity.cycle.plot.plotName,
                cost: parseFloat(activity.cost),
                revenue: parseFloat(activity.revenue)
            }))
        }
    });
});

/**
 * Create crop type (admin only)
 * POST /api/v1/admin/crop-types
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
 * Create crop variety (admin only)
 * POST /api/v1/admin/crop-varieties
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
 * Create activity type (admin only)
 * POST /api/v1/admin/activity-types
 */
const createActivityType = asyncHandler(async (req, res) => {
    const { name, icon, color } = req.body;

    const activityType = await prisma.activityType.create({
        data: {
            name,
            icon: icon || null,
            color: color || null
        }
    });

    res.status(201).json({
        success: true,
        message: 'สร้างประเภทกิจกรรมสำเร็จ',
        activityType
    });
});

module.exports = {
    getUsers,
    getUserById,
    getUserPlots,
    getMapData,
    getStats,
    createCropType,
    createCropVariety,
    createActivityType
};
