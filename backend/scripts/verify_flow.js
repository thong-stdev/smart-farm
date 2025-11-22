const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Starting Standard Plan Flow Verification...');

    let createdIds = {};

    try {
        // 0. Create Activity Type (Required for ActivityLog)
        console.log('0. Creating Test Activity Type...');
        // Upsert to avoid unique constraint error if it exists
        const activityType = await prisma.activityType.upsert({
            where: { name: 'General Test' },
            update: {},
            create: {
                name: 'General Test',
                color: '#000000'
            }
        });
        createdIds.activityTypeId = activityType.id;
        console.log('   ✅ Activity Type Ready:', activityType.name);

        // 1. Create Crop Type
        console.log('1. Creating Test Crop Type...');
        const cropType = await prisma.cropType.create({
            data: {
                name: 'Test Crop ' + Date.now(),
                description: 'For verification'
            }
        });
        createdIds.cropTypeId = cropType.id;
        console.log('   ✅ Created Crop Type:', cropType.name);

        // 2. Create Crop Variety
        console.log('2. Creating Test Crop Variety...');
        const variety = await prisma.cropVariety.create({
            data: {
                name: 'Test Variety ' + Date.now(),
                description: 'For verification',
                cropTypeId: cropType.id
            }
        });
        createdIds.varietyId = variety.id;
        console.log('   ✅ Created Variety:', variety.name);

        // 3. Create Standard Plan
        console.log('3. Creating Standard Plan...');
        const plan = await prisma.standardPlan.create({
            data: {
                planName: 'Test Plan ' + Date.now(),
                totalDays: 90,
                cropVarietyId: variety.id,
                planDetails: {
                    activities: [
                        { day: 1, name: 'Day 1 Activity', description: 'Start', cost: 100 },
                        { day: 5, name: 'Day 5 Activity', description: 'Check', cost: 50 }
                    ]
                },
                costEstimate: 150
            }
        });
        createdIds.planId = plan.id;
        console.log('   ✅ Created Standard Plan:', plan.planName);

        // 4. Create Plot
        console.log('4. Creating Test Plot...');
        // Need a user for Plot
        const user = await prisma.user.findFirst();
        if (!user) throw new Error('No user found to assign plot to. Please seed users first.');

        const plot = await prisma.plot.create({
            data: {
                plotName: 'Test Plot ' + Date.now(),
                userId: user.id,
                areaSqm: 100,
                notes: 'Test Plot'
            }
        });
        createdIds.plotId = plot.id;
        console.log('   ✅ Created Plot:', plot.plotName);

        // 5. Create Cycle
        console.log('5. Creating Planting Cycle...');
        const cycle = await prisma.plantingCycle.create({
            data: {
                plotId: plot.id,
                cropVarietyId: variety.id,
                startDate: new Date(),
                status: 'active'
            }
        });
        createdIds.cycleId = cycle.id;
        console.log('   ✅ Created Cycle:', cycle.id);

        // 6. Verify Fetching Plan for Cycle
        console.log('6. Verifying Plan Availability...');
        const plansForVariety = await prisma.standardPlan.findMany({
            where: { cropVarietyId: cycle.cropVarietyId }
        });

        if (plansForVariety.length === 0) throw new Error('No plans found for the cycle\'s variety!');
        const targetPlan = plansForVariety.find(p => p.id === plan.id);
        if (!targetPlan) throw new Error('Created plan not found in query results!');

        console.log('   ✅ Plan found for cycle. Activities:', targetPlan.planDetails.activities.length);

        // 7. Simulate Adding Activity from Plan
        console.log('7. Simulating Activity Creation from Plan...');
        const planActivity = targetPlan.planDetails.activities[0];
        const activityDate = new Date(cycle.startDate);
        activityDate.setDate(activityDate.getDate() + planActivity.day);

        const activity = await prisma.activityLog.create({
            data: {
                cycleId: cycle.id,
                activityTypeId: activityType.id,
                notes: `${planActivity.name}: ${planActivity.description}`,
                activityDate: activityDate,
                cost: planActivity.cost
            }
        });
        createdIds.activityId = activity.id;
        console.log('   ✅ Created Activity from Plan:', activity.id);

        console.log('\n✨ Verification SUCCESS! The data flow is valid.');

    } catch (error) {
        console.error('\n❌ Verification FAILED:', error);
    } finally {
        // Cleanup
        console.log('\n🧹 Cleaning up test data...');
        if (createdIds.activityId) await prisma.activityLog.delete({ where: { id: createdIds.activityId } });
        if (createdIds.cycleId) await prisma.plantingCycle.delete({ where: { id: createdIds.cycleId } });
        if (createdIds.planId) await prisma.standardPlan.delete({ where: { id: createdIds.planId } });
        if (createdIds.plotId) await prisma.plot.delete({ where: { id: createdIds.plotId } });
        if (createdIds.varietyId) await prisma.cropVariety.delete({ where: { id: createdIds.varietyId } });
        if (createdIds.cropTypeId) await prisma.cropType.delete({ where: { id: createdIds.cropTypeId } });
        console.log('   ✅ Cleanup complete.');

        await prisma.$disconnect();
    }
}

main();
