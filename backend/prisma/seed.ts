// Prisma Seed - ข้อมูลพื้นฐานสำหรับระบบ Smart Farm
import {
    PrismaClient,
    AdminRole,
    AuthType,
    ActivityType,
    PlotStatus,
    CropCycleStatus,
    SoilType,
    WaterSource,
    IrrigationType,
    SunExposure
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // 0. สร้าง System Settings
    console.log('⚙️ Creating system settings...');
    await prisma.systemSettings.upsert({
        where: { id: 'system' },
        update: {},
        create: {
            id: 'system',
            siteName: 'Smart Farm',
            siteDescription: 'ระบบจัดการฟาร์มอัจฉริยะ',
            defaultLanguage: 'th',
            enableNotifications: true,
            maintenanceMode: false,
            enableAI: true,
            aiMode: 'ASSIST',
            maxSponsoredRatio: 0.3,
            sponsoredLabelText: 'โฆษณา',
        },
    });
    console.log('  ✅ Created system settings');

    // 1. สร้าง Admin
    console.log('👤 Creating admins...');
    const adminPassword = await bcrypt.hash('admin123', 10);

    const admin1 = await prisma.admin.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            username: 'admin',
            email: 'admin@smartfarm.com',
            password: adminPassword,
            name: 'System Admin',
            role: AdminRole.SUPER_ADMIN,
            isActive: true,
        },
    });

    const admin2 = await prisma.admin.upsert({
        where: { username: 'support' },
        update: {},
        create: {
            username: 'support',
            email: 'support@smartfarm.com',
            password: adminPassword,
            name: 'Support Team',
            role: AdminRole.STAFF,
            isActive: true,
        },
    });
    console.log(`  ✅ Created admin: ${admin1.name} (${admin1.username})`);
    console.log(`  ✅ Created admin: ${admin2.name} (${admin2.username})`);

    // 2. สร้าง Product Categories
    console.log('📦 Creating product categories...');
    const categoryNames = ['ปุ๋ย', 'สารกำจัดศัตรูพืช', 'เมล็ดพันธุ์', 'อุปกรณ์การเกษตร', 'ระบบน้ำ'];

    const createdCategories: Record<string, any> = {};
    for (const name of categoryNames) {
        const created = await prisma.productCategory.upsert({
            where: { name },
            update: {},
            create: { name },
        });
        createdCategories[name] = created;
    }
    console.log(`  ✅ Created ${categoryNames.length} categories`);

    // 3. สร้าง Product Brands
    console.log('🏭 Creating product brands...');
    const brands = [
        { name: 'ตราหมี' },
        { name: 'ตรากระต่าย' },
        { name: 'ตราม้า' },
        { name: 'เจียไต๋' },
        { name: 'ซินเจนทา' },
        { name: 'ไบเออร์' },
    ];

    const createdBrands: Record<string, any> = {};
    for (const brand of brands) {
        const created = await prisma.productBrand.upsert({
            where: { name: brand.name },
            update: {},
            create: brand,
        });
        createdBrands[brand.name] = created;
    }
    console.log(`  ✅ Created ${brands.length} brands`);

    // 4. สร้าง Crop Types และ Varieties (พันธุ์พืช)
    console.log('🌾 Creating crop types and varieties...');
    const cropTypes = [
        {
            name: 'ข้าว',
            varieties: [
                { name: 'ข้าวขาวดอกมะลิ 105', duration: 120 },
                { name: 'ข้าว กข15', duration: 110 },
                { name: 'ข้าวหอมปทุมธานี 1', duration: 115 },
            ]
        },
        {
            name: 'มันสำปะหลัง',
            varieties: [
                { name: 'พันธุ์ระยอง 5', duration: 300 },
                { name: 'พันธุ์ห้วยบง 80', duration: 330 },
            ]
        },
        {
            name: 'อ้อย',
            varieties: [
                { name: 'พันธุ์ขอนแก่น 3', duration: 365 },
            ]
        },
        {
            name: 'ข้าวโพด',
            varieties: [
                { name: 'ข้าวโพดหวาน ไฮบริกซ์ 3', duration: 70 },
            ]
        },
    ];

    for (const ct of cropTypes) {
        const cropType = await prisma.cropType.upsert({
            where: { name: ct.name },
            update: {},
            create: { name: ct.name },
        });

        for (const v of ct.varieties) {
            await prisma.cropVariety.create({
                data: {
                    name: v.name,
                    duration: v.duration,
                    cropTypeId: cropType.id,
                },
            }).catch(() => null); // Skip if already exists
        }
    }
    console.log(`  ✅ Created ${cropTypes.length} crop types with varieties`);

    // 5. สร้าง Sample Products
    console.log('🛒 Creating sample products...');

    // ... (existing product code later) ... 

    // [INSERTED] 4.1 Create Crop Plans (After Varieties)
    console.log('📅 Creating crop plans...');
    const riceType = await prisma.cropType.findFirst({ where: { name: 'ข้าว' } });
    if (riceType) {
        const jasmineRice = await prisma.cropVariety.findFirst({
            where: { name: 'ข้าวขาวดอกมะลิ 105', cropTypeId: riceType.id }
        });

        if (jasmineRice) {
            const ricePlan = await prisma.cropPlan.create({
                data: {
                    name: 'แผนการปลูกข้าวหอมมะลิ (มาตรฐาน)',
                    description: 'แผนการปลูกสำหรับฤดูนาปี ระยะเวลา 120 วัน',
                    varieties: { connect: { id: jasmineRice.id } },
                    stages: {
                        create: [
                            { stageName: 'เตรียมดิน', dayStart: 1, dayEnd: 15, action: 'ไถดะและตากดิน', method: 'รถไถ', reason: 'กำจัดวัชพืชและตากดินฆ่าเชื้อ' },
                            { stageName: 'ตกกล้า/หว่าน', dayStart: 16, dayEnd: 18, action: 'หว่านเมล็ดพันธุ์', method: 'หว่านมือ/เครื่องพ่น', reason: 'เริ่มการเพาะปลูก' },
                            { stageName: 'ใส่ปุ๋ยครั้งที่ 1', dayStart: 30, dayEnd: 35, action: 'ใส่ปุ๋ยสูตร 16-20-0', method: 'หว่าน', reason: 'เร่งการเจริญเติบโต' },
                            { stageName: 'กำจัดวัชพืช', dayStart: 45, dayEnd: 50, action: 'ฉีดพ่นสารกำจัดวัชพืช', method: 'เครื่องพ่น', reason: 'ป้องกันวัชพืชแย่งอาหาร' },
                            { stageName: 'ใส่ปุ๋ยครั้งที่ 2', dayStart: 60, dayEnd: 65, action: 'ใส่ปุ๋ยสูตร 46-0-0', method: 'หว่าน', reason: 'รับรวง (ข้าวตั้งท้อง)' },
                            { stageName: 'เก็บเกี่ยว', dayStart: 120, dayEnd: 125, action: 'เก็บเกี่ยวผลผลิต', method: 'รถเกี่ยวข้าว', reason: 'ข้าวสุกแก่เต็มที่' },
                        ]
                    }
                }
            });
            console.log(`  ✅ Created crop plan: ${ricePlan.name}`);
        }
    }

    const fertilizerCat = createdCategories['ปุ๋ย'];
    const bearBrand = createdBrands['ตราหมี'];

    if (fertilizerCat && bearBrand) {
        const products = [
            { name: 'ปุ๋ยยูเรีย 46-0-0', price: 850, unit: 'กก.' },
            { name: 'ปุ๋ยสูตร 15-15-15', price: 750, unit: 'กก.' },
            { name: 'ปุ๋ยสูตร 16-20-0', price: 780, unit: 'กก.' },
            { name: 'ปุ๋ยโพแทสเซียม 0-0-60', price: 900, unit: 'กก.' },
        ];

        for (const product of products) {
            await prisma.product.create({
                data: {
                    name: product.name,
                    price: product.price,
                    unit: product.unit,
                    isActive: true,
                    categoryId: fertilizerCat.id,
                    brandId: bearBrand.id,
                },
            }).catch(() => null);
        }
        console.log(`  ✅ Created ${products.length} products`);
    }

    // 6. สร้าง Demo User
    console.log('👨‍🌾 Creating demo user...');
    const demoPasswordHash = await bcrypt.hash('demo123', 10);

    let demoUser = await prisma.user.findFirst({
        where: {
            providers: {
                some: {
                    provider: AuthType.EMAIL,
                    email: 'demo@smartfarm.com'
                }
            }
        }
    });

    if (!demoUser) {
        demoUser = await prisma.user.create({
            data: {
                displayName: 'เกษตรกรตัวอย่าง',
                firstName: 'สมชาย',
                lastName: 'ใจดี',
                providers: {
                    create: {
                        provider: AuthType.EMAIL,
                        providerUid: demoPasswordHash, // เก็บ password hash ใน providerUid
                        email: 'demo@smartfarm.com',
                    },
                },
            },
        });
    }
    console.log(`  ✅ Created demo user: ${demoUser.displayName}`);

    // 7. สร้าง Demo Plot
    console.log('🌾 Creating demo plots...');
    const demoPlot = await prisma.plot.create({
        data: {
            name: 'นาข้าว หลังบ้าน',
            size: 15,
            status: PlotStatus.NORMAL,
            lat: 15.8700,
            lng: 100.9925,
            address: 'ต.ในเมือง อ.เมือง จ.นครราชสีมา',
            soilType: SoilType.LOAM,
            waterSource: WaterSource.RIVER,
            irrigation: IrrigationType.FLOOD,
            sunExposure: SunExposure.FULL,
            userId: demoUser.id,
        },
    }).catch(() => null);

    const demoPlot2 = await prisma.plot.create({
        data: {
            name: 'สวนผัก ริมคลอง',
            size: 5,
            status: PlotStatus.NORMAL,
            lat: 15.8710,
            lng: 100.9930,
            address: 'ต.ในเมือง อ.เมือง จ.นครราชสีมา',
            soilType: SoilType.CLAY,
            waterSource: WaterSource.WELL,
            irrigation: IrrigationType.DRIP,
            sunExposure: SunExposure.PARTIAL,
            userId: demoUser.id,
        },
    }).catch(() => null);

    console.log(`  ✅ Created demo plots`);

    // 8. สร้าง Demo Crop Cycle
    let demoCycle = null;
    if (demoPlot) {
        console.log('🌱 Creating demo crop cycle...');
        const riceVariety = await prisma.cropVariety.findFirst({
            where: { name: { contains: 'มะลิ' } } // หาพันธุ์ข้าวหอมมะลิ
        });

        if (riceVariety) {
            // Check if plan exists (created in step 4.1)
            const plan = await prisma.cropPlan.findFirst({
                where: { varieties: { some: { id: riceVariety.id } } }
            });

            demoCycle = await prisma.cropCycle.create({
                data: {
                    plotId: demoPlot.id,
                    cropType: 'ข้าว',
                    cropVarietyId: riceVariety.id,
                    planId: plan?.id, // Auto-assign plan if available
                    startDate: new Date('2025-11-15'),
                    plantedAt: new Date('2025-11-16'),
                    status: CropCycleStatus.ACTIVE,
                    note: 'รอบการปลูกในฤดูฝน (Demo)',
                },
            }).catch(() => null);
            console.log(`  ✅ Created demo crop cycle with Plan: ${plan ? 'Yes' : 'No'}`);
        }

        // 9. สร้าง Demo Activities
        console.log('📝 Creating demo activities...');
        const activities = [
            { type: ActivityType.EXPENSE, amount: 2500, description: 'ค่าเมล็ดพันธุ์ข้าว', date: new Date('2025-11-15') },
            { type: ActivityType.PLANTING, amount: 0, description: 'หว่านข้าว', date: new Date('2025-11-16') },
            { type: ActivityType.EXPENSE, amount: 3400, description: 'ค่าปุ๋ยรองพื้น', date: new Date('2025-11-20') },
            { type: ActivityType.EXPENSE, amount: 1800, description: 'ค่าแรงหว่านข้าว', date: new Date('2025-11-18') },
            { type: ActivityType.EXPENSE, amount: 2100, description: 'ค่าปุ๋ยแต่งหน้า', date: new Date('2025-12-15') },
            { type: ActivityType.EXPENSE, amount: 800, description: 'ค่ายากำจัดวัชพืช', date: new Date('2025-12-20') },
            { type: ActivityType.INCOME, amount: 45000, description: 'ขายข้าวรอบก่อน', date: new Date('2025-10-01') },
        ];

        for (const activity of activities) {
            // ถ้าเป็นรายการขายรอบก่อน ไม่ต้อง link กับ cycle นี้
            const isOldCycle = activity.date < new Date('2025-11-15');

            await prisma.activity.create({
                data: {
                    type: activity.type,
                    amount: activity.amount,
                    description: activity.description,
                    date: activity.date,
                    userId: demoUser.id,
                    plotId: demoPlot.id,
                    cropCycleId: isOldCycle ? undefined : demoCycle?.id, // Link to cycle
                },
            }).catch(() => null);
        }
        console.log(`  ✅ Created ${activities.length} demo activities`);
    }

    console.log('\n✅ Seeding completed successfully!');
    console.log('\n📋 Demo Credentials:');
    console.log('  Admin: admin / admin123');
    console.log('  User:  demo@smartfarm.com / demo123');
}

main()
    .catch((e) => {
        console.error('❌ Seeding error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
