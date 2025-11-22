# Smart Farm System Architecture

ระบบจัดการแปลงเกษตรอัจฉริยะ (Smart Farm Management System) สำหรับเกษตรกรและเจ้าหน้าที่

## 📋 Overview

ระบบนี้ออกแบบมาเพื่อช่วยเกษตรกรในการบริหารจัดการแปลงเกษตร บันทึกกิจกรรมรายวัน และติดตามรายได้-ค่าใช้จ่าย ผ่านอินเทอร์เฟซที่ใช้งานง่ายบน Line Official Account

### User Types

- **User (เกษตรกร)**: ใช้งานผ่าน Line OA + LIFF, Web App (อนาคต)
- **Admin (เจ้าหน้าที่)**: ใช้งานผ่าน Web Dashboard

### Core Features

1. **📍 Plot Management**: จัดการแปลงเกษตร (เพิ่ม/แก้ไข/ลบ) พร้อมระบุพิกัด GPS
2. **🌱 Planting Cycle Management**: จัดการรอบการเพาะปลูก พร้อม Template System
3. **📝 Activity Logging**: บันทึกกิจกรรมรายวัน พร้อมรูปภาพและข้อมูลทางการเงิน
4. **📊 Dashboard & Reports**: สรุปรายได้-ค่าใช้จ่าย และ ROI
5. **🗺️ Admin Map View**: แสดงแปลงเกษตรทั้งหมดบนแผนที่

---

## 🗂️ Project Structure

```
Farm/
├── database/
│   ├── schema.sql              # MySQL Database Schema
│   └── seed_data.sql           # Sample Data for Testing
├── docs/
│   ├── database-design.md      # ER Diagram & Database Documentation
│   ├── api-examples.md         # Complete API Examples
│   └── ux-ui-flow.md          # UX/UI Flow for Line OA + LIFF
└── README.md                  # This file
```

---

## 🔧 Tech Stack

### Backend
- **Framework**: Node.js + Express / NestJS
- **Database**: MySQL 8.0+
- **ORM**: Prisma / TypeORM
- **Authentication**: JWT + OAuth (Line, Google, Facebook)
- **File Storage**: Firebase Storage / AWS S3

### Frontend (LIFF)
- **Framework**: React + Vite / Next.js
- **UI Library**: Tailwind CSS + shadcn/ui
- **Maps**: Google Maps JavaScript API
- **State Management**: React Query + Zustand

### Admin Dashboard
- **Framework**: React / Next.js
- **UI Library**: Ant Design / Material-UI
- **Charts**: Chart.js / Recharts

---

## 📊 Database Schema

### Tables Overview (11 ตาราง)

#### User Management
- `users` - ข้อมูลผู้ใช้หลัก
- `user_oauth_providers` - OAuth Providers (รองรับหลาย Provider)
- `user_sessions` - Refresh Tokens

#### Master Data
- `crop_types` - ประเภทพืช (ผลไม้, ผัก, ไม้ดอก, พืชไร่)
- `crop_varieties` - สายพันธุ์พืช
- `activity_types` - ประเภทกิจกรรม (รดน้ำ, ใส่ปุ๋ย, ฉีดยา, เก็บเกี่ยว)
- `standard_plans` - แผนการปลูกมาตรฐาน (Templates)

#### Operational Data
- `plots` - แปลงเกษตร
- `planting_cycles` - รอบการเพาะปลูก
- `activity_logs` - บันทึกกิจกรรม
- `activity_images` - รูปภาพกิจกรรม (1:N)

### Key Relationships

```
users (1) ──────< (M) plots
plots (1) ──────< (M) planting_cycles
planting_cycles (1) ──< (M) activity_logs
activity_logs (1) ──< (M) activity_images
```

📖 **ดูรายละเอียดเพิ่มเติม**: [database-design.md](docs/database-design.md)

---

## 🚀 Quick Start

### 1. Setup Database

```bash
# สร้าง Database
mysql -u root -p -e "CREATE DATABASE smart_farm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Import Schema
mysql -u root -p smart_farm < database/schema.sql

# Import Seed Data (ถ้าต้องการ)
mysql -u root -p smart_farm < database/seed_data.sql
```

### 2. Configure Environment Variables

สร้างไฟล์ `.env`:

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=smart_farm
DB_USER=root
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_EXPIRES_IN=30d

# Line OAuth
LINE_CHANNEL_ID=your_line_channel_id
LINE_CHANNEL_SECRET=your_line_channel_secret
LINE_CALLBACK_URL=https://yourdomain.com/api/auth/line/callback
LIFF_ID=your_liff_id

# Google OAuth (Future)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Cloud Storage
CLOUD_STORAGE_BUCKET=your_bucket_name
# Firebase
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_bucket_name
# หรือ AWS S3
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=your_bucket_name

# App
PORT=3000
NODE_ENV=development
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Development Server

```bash
npm run dev
```

---

## 📡 API Endpoints

### Base URL
```
https://api.smartfarm.com/api/v1
```

### Authentication
```http
Authorization: Bearer <JWT_TOKEN>
```

### Main Endpoints

| Category | Endpoint | Method | Description |
|----------|----------|--------|-------------|
| **Auth** | `/auth/line/callback` | POST | Line OAuth Login |
| | `/auth/me` | GET | Get Current User |
| **Plots** | `/plots` | GET | Get All User's Plots |
| | `/plots` | POST | Create New Plot |
| | `/plots/:id` | PATCH | Update Plot |
| | `/plots/:id` | DELETE | Delete Plot |
| **Cycles** | `/cycles?plot_id=:id` | GET | Get Cycles by Plot |
| | `/cycles` | POST | Start New Cycle |
| | `/cycles/:id/complete` | POST | Complete Cycle |
| **Activities** | `/activities?cycle_id=:id` | GET | Get Activities |
| | `/activities` | POST | Create Activity Log |
| | `/activities/:id/images` | POST | Upload Images |
| **Master Data** | `/public/crop-types` | GET | Get Crop Types |
| | `/public/crop-varieties` | GET | Get Varieties |
| | `/public/standard-plans/:id` | GET | Get Standard Plans |

📖 **ดูรายละเอียดและตัวอย่าง**: [api-examples.md](docs/api-examples.md)

---

## 🎨 UX/UI Flow

### Rich Menu Layout

```
┌──────────────────────┬──────────────────────┐
│   📍 แปลงของฉัน       │   🌱 เริ่มปลูก        │
├──────────────────────┼──────────────────────┤
│   📝 บันทึกวันนี้      │   📊 สรุปรายได้       │
├──────────────────────┴──────────────────────┤
│         👤 โปรไฟล์ของฉัน                      │
└─────────────────────────────────────────────┘
```

### User Flows

1. **First-Time User** → Line Login → Add First Plot → Start Planting Cycle
2. **Add Plot** → Fill Form → Select Location on Map → Save
3. **Start Planting** → Select Plot → Choose Crop Variety → Pick Template → Set Start Date
4. **Log Activity** → Select Cycle → Choose Activity Type → Add Cost/Revenue → Upload Images → Save
5. **View Dashboard** → See Total Revenue/Cost/Profit → Charts → Cycle Details

📖 **ดูรายละเอียดทั้งหมด**: [ux-ui-flow.md](docs/ux-ui-flow.md)

---

## 🔐 Authentication Strategy

### Multi-Provider OAuth Support

ระบบรองรับการล็อกอินผ่าน:
- ✅ **Line** (ปัจจุบัน)
- 🔄 **Google** (อนาคต)
- 🔄 **Facebook** (อนาคต)

### JWT Token Structure

```json
{
  "user_id": 123,
  "role": "user",
  "email": "user@example.com",
  "iat": 1234567890,
  "exp": 1234571490
}
```

- **Access Token**: 1 hour
- **Refresh Token**: 30 days

### Account Merging

ถ้า `email` ซ้ำกัน → ระบบจะ Link เข้า User เดียวกัน (แนะนำให้ถามผู้ใช้ยืนยันก่อน)

---

## 💾 Data Storage Best Practices

### Image Storage

❌ **ไม่แนะนำ**: เก็บ Binary ใน MySQL
✅ **แนะนำ**: เก็บ URL ที่ชี้ไปยัง Cloud Storage

```
activity_images.image_url = "https://storage.example.com/activities/abc123.jpg"
```

### Area Measurement

แนะนำเก็บเป็น `area_sqm` (ตารางเมตร) แล้วแปลงเป็นไร่-งาน-วา ที่ Frontend

**การแปลง**:
- 1 ไร่ = 1,600 ตร.ม.
- 1 งาน = 400 ตร.ม.
- 1 วา = 4 ตร.ม.

### JSON Columns

ใช้ JSON สำหรับข้อมูลที่:
1. แต่ละ record มีโครงสร้างแตกต่างกัน (เช่น `soil_info`, `additional_info`)
2. ไม่ต้อง Query ด้วย WHERE clause บ่อยๆ
3. ยืดหยุ่น ไม่ต้องแก้ Schema บ่อย

---

## 🧪 Testing

### Database Tests

```sql
-- ทดสอบ Trigger (อัปเดต actual_cost/revenue)
INSERT INTO activity_logs (cycle_id, activity_type_id, activity_date, cost) 
VALUES (1, 1, '2024-03-01', 500.00);

-- ตรวจสอบว่า planting_cycles.actual_cost อัปเดตหรือไม่
SELECT actual_cost FROM planting_cycles WHERE id = 1;
```

### API Tests

```bash
# ใช้ Postman Collection หรือ
npm run test:api
```

---

## 📈 Future Enhancements

### Phase 2 (Q3 2024)
- [ ] Web App สำหรับ User (Login ด้วย Google/Facebook)
- [ ] ระบบแจ้งเตือนอัตโนมัติ (ถึงเวลาใส่ปุ๋ย/รดน้ำ)
- [ ] Export รายงาน PDF/Excel

### Phase 3 (Q4 2024)
- [ ] Weather Integration (ข้อมูลสภาพอากาศ)
- [ ] IoT Sensors Integration (ความชื้น, อุณหภูมิ)
- [ ] AI Recommendations (แนะนำการดูแล)

### Phase 4 (2025)
- [ ] Marketplace (ซื้อ-ขายผลผลิต)
- [ ] Community Features (แชร์ความรู้)
- [ ] Gamification (Achievements, Badges)

---

## 🤝 Contributing

### Development Workflow

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

### Code Style

- **Backend**: ESLint + Prettier
- **Frontend**: ESLint + Prettier + Tailwind
- **Database**: Use migrations for schema changes

---

## 📞 Support

### Documentation
- [Database Design](docs/database-design.md) - ER Diagram, Relationships, Query Examples
- [API Examples](docs/api-examples.md) - Complete Request/Response Examples
- [UX/UI Flow](docs/ux-ui-flow.md) - User Flows, Wireframes, LIFF Integration

### Contact
- **Email**: support@smartfarm.com
- **Line OA**: @smartfarm
- **Website**: https://smartfarm.com

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

---

## 🙏 Acknowledgments

- **Line Developers** - LIFF Platform
- **Google Maps API** - Location Services
- **Open Source Community** - Various Libraries & Tools

---

## 🎯 Next Steps

1. ✅ Review implementation plan
2. ⏭️ Setup development environment
3. ⏭️ Implement Backend API (Node.js + Express)
4. ⏭️ Implement LIFF Frontend (React + Vite)
5. ⏭️ Deploy to staging
6. ⏭️ User testing
7. ⏭️ Production deployment

---

**สร้างด้วย ❤️ สำหรับเกษตรกรไทย** 🌾
