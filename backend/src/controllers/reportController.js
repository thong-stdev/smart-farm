const prisma = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Get farm overview report
 * GET /api/v1/reports/overview
 */
const getFarmOverview = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    try {
        // 1. Get Plot Statistics
        const plots = await prisma.plot.findMany({
            where: { userId },
            include: {
                cycles: {
                    where: { status: 'active' },
                    take: 1
                }
            }
        });

        const totalPlots = plots.length;

        // Calculate total area in Rai (1 Rai = 1600 Sqm)
        const totalAreaRai = plots.reduce((sum, p) => {
            const areaSqm = p.areaSqm ? Number(p.areaSqm) : 0;
            const areaRai = areaSqm / 1600;
            return sum + (isNaN(areaRai) ? 0 : areaRai);
        }, 0);

        const activePlots = plots.filter(p => p.cycles.length > 0).length;
        const emptyPlots = totalPlots - activePlots;

        // 2. Get Financial Statistics
        const completedCycles = await prisma.plantingCycle.findMany({
            where: {
                plot: { userId },
                status: 'completed'
            },
            select: {
                actualCost: true,
                actualRevenue: true
            }
        });

        const totalRevenue = completedCycles.reduce((sum, c) => {
            const val = c.actualRevenue ? Number(c.actualRevenue) : 0;
            return sum + (isNaN(val) ? 0 : val);
        }, 0);

        const totalCost = completedCycles.reduce((sum, c) => {
            const val = c.actualCost ? Number(c.actualCost) : 0;
            return sum + (isNaN(val) ? 0 : val);
        }, 0);

        const netProfit = totalRevenue - totalCost;

        // 3. Get Recent Activities
        const recentActivities = await prisma.activityLog.findMany({
            where: {
                cycle: {
                    plot: { userId }
                }
            },
            include: {
                activityType: true,
                cycle: {
                    include: {
                        plot: { select: { plotName: true } },
                        cropVariety: { select: { name: true } }
                    }
                }
            },
            orderBy: { activityDate: 'desc' },
            take: 5
        });

        // 4. Prepare Plot Status List
        const plotStatuses = await Promise.all(plots.map(async (plot) => {
            const activeCycle = plot.cycles[0];
            let cycleDetails = null;

            if (activeCycle) {
                const fullCycle = await prisma.plantingCycle.findUnique({
                    where: { id: activeCycle.id },
                    include: { cropVariety: true }
                });

                if (fullCycle) {
                    const startDate = new Date(activeCycle.startDate);
                    const now = new Date();
                    const diffTime = Math.abs(now - startDate);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    cycleDetails = {
                        id: activeCycle.id,
                        cropName: fullCycle.cropVariety ? fullCycle.cropVariety.name : 'Unknown Crop',
                        startDate: activeCycle.startDate,
                        daysElapsed: diffDays
                    };
                }
            }

            const areaSqm = plot.areaSqm ? Number(plot.areaSqm) : 0;
            const areaRai = areaSqm / 1600;

            return {
                id: plot.id,
                name: plot.plotName,
                areaRai: parseFloat(areaRai.toFixed(2)),
                status: activeCycle ? 'active' : 'empty',
                activeCycle: cycleDetails
            };
        }));

        res.json({
            success: true,
            overview: {
                plots: {
                    total: totalPlots,
                    active: activePlots,
                    empty: emptyPlots,
                    totalAreaRai: parseFloat(totalAreaRai.toFixed(2))
                },
                financials: {
                    totalRevenue,
                    totalCost,
                    netProfit
                }
            },
            recentActivities: recentActivities.map(log => ({
                id: log.id,
                type: log.activityType ? log.activityType.name : 'Unknown',
                icon: log.activityType ? log.activityType.icon : '📝',
                date: log.activityDate,
                plotName: log.cycle && log.cycle.plot ? log.cycle.plot.plotName : 'Unknown Plot',
                cropName: log.cycle && log.cycle.cropVariety ? log.cycle.cropVariety.name : 'Unknown Crop',
                cost: log.cost ? Number(log.cost) : 0,
                revenue: log.revenue ? Number(log.revenue) : 0
            })),
            plotStatuses
        });

    } catch (error) {
        console.error('[Report Error] Failed to generate farm overview:', error);
        res.status(500).json({
            success: false,
            error: 'Internal Server Error',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

module.exports = {
    getFarmOverview
};
