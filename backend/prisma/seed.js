const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Start seeding...');

    // Activity Types
    const activityTypes = [
        { name: 'รดน้ำ', icon: '💧', color: '#3B82F6' },
        { name: 'ใส่ปุ๋ย', icon: '🌿', color: '#10B981' },
        { name: 'ฉีดยา', icon: '💊', color: '#F59E0B' },
        { name: 'กำจัดวัชพืช', icon: '🌾', color: '#EF4444' },
        { name: 'เก็บเกี่ยว', icon: '🚜', color: '#8B5CF6' },
        { name: 'อื่นๆ', icon: '📝', color: '#6B7280' }
    ];

    for (const type of activityTypes) {
        await prisma.activityType.upsert({
            where: { name: type.name },
            update: {},
            create: type
        });
    }
    console.log('✅ Activity types created');

    // Crop Types
    const cropTypes = [
        { name: 'ผลไม้', description: 'พืชผลไม้ เช่น มะม่วง ทุเรียน ลำไย', iconUrl: '🍎' },
        { name: 'ผัก', description: 'พืชผัก เช่น กะหล่ำปลี ผักกาด', iconUrl: '🥬' },
        { name: 'พืชไร่', description: 'ข้าว ข้าวโพด อ้อย', iconUrl: '🌾' },
        { name: 'ไม้ดอก', description: 'กล้วยไม้ กุหลาบ', iconUrl: '🌸' }
    ];

    for (const type of cropTypes) {
        await prisma.cropType.upsert({
            where: { name: type.name },
            update: {},
            create: type
        });
    }
    console.log('✅ Crop types created');

    // Crop Varieties
    const fruitType = await prisma.cropType.findUnique({ where: { name: 'ผลไม้' } });
    const vegType = await prisma.cropType.findUnique({ where: { name: 'ผัก' } });

    const varieties = [
        {
            cropTypeId: fruitType.id,
            name: 'มะม่วงน้ำดกไม้',
            description: 'มะม่วงพันธุ์ยอดนิยม รสหวาน',
            additionalInfo: { growthPeriodDays: 120, idealTemperature: '25-35°C' }
        },
        {
            cropTypeId: fruitType.id,
            name: 'ทุเรียนหมอนทอง',
            description: 'ทุเรียนพันธุ์ยอดนิยม เนื้อหนา',
            additionalInfo: { growthPeriodDays: 150, idealTemperature: '24-30°C' }
        },
        {
            cropTypeId: vegType.id,
            name: 'กะหล่ำปลี',
            description: 'ผักกินยอด ปลูกง่าย',
            additionalInfo: { growthPeriodDays: 60, idealTemperature: '15-20°C' }
        }
    ];

    for (const variety of varieties) {
        await prisma.cropVariety.upsert({
            where: { id: 0 }, // Will always create new
            update: {},
            create: variety
        });
    }
    console.log('✅ Crop varieties created');

    // Demo Admin User (for development only)
    // NOTE: This creates a user without LINE OAuth
    // To make an existing LINE user admin, use Prisma Studio:
    // 1. Run: npx prisma studio
    // 2. Open User table
    // 3. Find your user (by email or LINE userId)
    // 4. Change role from 'user' to 'admin'
    const admin = await prisma.user.upsert({
        where: { email: 'admin@smartfarm.com' },
        update: { role: 'admin' }, // Update to admin if exists
        create: {
            email: 'admin@smartfarm.com',
            fullName: 'System Admin',
            role: 'admin'
        }
    });
    console.log('✅ Admin user created (email: admin@smartfarm.com)');
    console.log('⚠️  To use LINE login as admin, update your LINE user role to "admin" via Prisma Studio');

    console.log('\n🎉 Seeding finished!');
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error('❌ Error seeding:', e);
        await prisma.$disconnect();
        process.exit(1);
    });
