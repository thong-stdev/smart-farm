# 🌾 Smart Farm Management System

ระบบจัดการแปลงเกษตรอัจฉริยะ สำหรับบันทึกกิจกรรมการเกษตร รองรับ LINE LIFF, Web Portal และ Admin Web

## ✨ คุณสมบัติหลัก

- 🔐 **ระบบผู้ใช้**: รองรับ LINE Login, Google OAuth และ Email/Password
- 🌱 **จัดการแปลง**: สร้าง แก้ไข ลบแปลงเกษตร พร้อมพิกัดแผนที่
- 🌾 **รอบการปลูก**: จัดการรอบการปลูก ผูกกับพันธุ์พืช
- 📋 **บันทึกกิจกรรม**: รายรับ รายจ่าย งานเกษตร
- 🤖 **AI ผู้ช่วย**: บันทึกข้อมูลด้วยข้อความ/เสียง
- 📦 **สินค้า/วัสดุ**: จัดการ Master Data ปุ๋ย/ยา/อุปกรณ์
- 📊 **รายงาน**: สรุปต้นทุน กำไร ผลผลิต

## 🛠️ เทคโนโลยี

### Backend
- **Runtime**: Node.js + NestJS
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: JWT + Passport
- **Docs**: Swagger API

### Frontend (จะสร้างต่อ)
- **Framework**: Next.js + React
- **UI**: Tailwind CSS + shadcn/ui
- **State**: Zustand
- **Charts**: Recharts

## 📁 โครงสร้างโปรเจกต์

```
smart-farm/
├── backend/              # NestJS API
│   ├── src/
│   │   ├── common/       # Prisma, Guards, Utils
│   │   └── modules/      # Feature Modules
│   │       ├── auth/     # Authentication
│   │       ├── user/     # User Management
│   │       ├── plot/     # Farm Plots
│   │       ├── crop-cycle/   # Crop Cycles
│   │       ├── activity/     # Activities
│   │       ├── product/      # Products
│   │       └── ai/           # AI Assistant
│   └── prisma/           # Database Schema
├── frontend/             # (จะสร้างต่อ)
├── shared/               # (จะสร้างต่อ)
├── infra/                # (จะสร้างต่อ)
└── docker-compose.yml    # PostgreSQL + Redis
```

## 🚀 เริ่มต้นใช้งาน

### 1. เตรียม Database (Docker)

```bash
docker-compose up -d
```

### 2. ติดตั้ง Dependencies

```bash
cd backend
npm install
```

### 3. Generate Prisma Client

```bash
npx prisma generate
```

### 4. Migrate Database

```bash
npx prisma migrate dev
```

### 5. รัน Backend

```bash
npm run start:dev
```

### 6. ดู API Docs

เปิด http://localhost:3001/api/docs

## 📚 API Endpoints

### Auth
- `POST /api/auth/register` - ลงทะเบียน Email
- `POST /api/auth/login` - เข้าสู่ระบบ
- `POST /api/auth/line/mock` - Mock LINE Login
- `POST /api/auth/google/mock` - Mock Google Login
- `GET /api/auth/me` - ข้อมูลผู้ใช้ปัจจุบัน

### Plots (แปลงเกษตร)
- `POST /api/plots` - สร้างแปลง
- `GET /api/plots` - รายการแปลง
- `GET /api/plots/:id` - ข้อมูลแปลง
- `PATCH /api/plots/:id` - แก้ไขแปลง
- `DELETE /api/plots/:id` - ลบแปลง

### Crop Cycles (รอบการปลูก)
- `POST /api/crop-cycles` - เริ่มรอบใหม่
- `GET /api/crop-cycles/plot/:plotId` - รอบการปลูกตามแปลง
- `POST /api/crop-cycles/:id/complete` - จบรอบ

### Activities (กิจกรรม)
- `POST /api/activities` - บันทึกกิจกรรม
- `GET /api/activities` - รายการกิจกรรม
- `GET /api/activities/summary` - สรุป (รายรับ/รายจ่าย/กำไร)

### AI
- `POST /api/ai/parse` - แยกข้อมูลจากข้อความ

## 📝 License

MIT
