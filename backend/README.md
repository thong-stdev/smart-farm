# Smart Farm Backend

Backend API สำหรับระบบจัดการแปลงเกษตร (Smart Farm)

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment Variables

คัดลอก `.env.example` เป็น `.env` และกรอกค่าที่จำเป็น:

```bash
cp .env.example .env
```

แก้ไขไฟล์ `.env`:

```env
DATABASE_URL="mysql://username:password@localhost:3306/smart_farm"
JWT_SECRET=your_secret_key
FIREBASE_PROJECT_ID=your_project_id
# ... etc
```

### 3. Setup Database

```bash
# สร้าง database
mysql -u root -p -e "CREATE DATABASE smart_farm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# (Optional) Seed data
npm run prisma:seed
```

### 4. Run Development Server

```bash
npm run dev
```

Server จะรันที่ `http://localhost:3000`

## 📡 API Documentation

### Base URL

```
http://localhost:3000/api/v1
```

### Authentication

ส่ง JWT token ใน Authorization header:

```http
Authorization: Bearer <your_token>
```

### Endpoints

#### Authentication

- POST `/auth/line/callback` - Line OAuth login
- POST `/auth/refresh` - Refresh access token
- GET `/auth/me` - Get current user
- POST `/auth/logout` - Logout

#### Plot Management

- GET `/plots` - Get all user's plots
- GET `/plots/:id` - Get plot by ID
- POST `/plots` - Create new plot
- PATCH `/plots/:id` - Update plot
- DELETE `/plots/:id` - Delete plot

#### Planting Cycles

- GET `/cycles?plot_id=:id` - Get cycles by plot
- GET `/cycles/:id` - Get cycle by ID
- POST `/cycles` - Create new cycle
- PATCH `/cycles/:id` - Update cycle
- POST `/cycles/:id/complete` - Complete cycle
- DELETE `/cycles/:id` - Delete cycle

#### Activity Logging

- GET `/activities?cycle_id=:id` - Get activities by cycle
- GET `/activities/:id` - Get activity by ID
- POST `/activities` - Create activity
- PATCH `/activities/:id` - Update activity
- DELETE `/activities/:id` - Delete activity
- POST `/activities/:id/images` - Upload images (multipart/form-data)
- DELETE `/activities/:activity_id/images/:image_id` - Delete image

#### Public APIs (No Auth Required)

- GET `/public/crop-types` - Get all crop types
- GET `/public/crop-varieties?crop_type_id=:id` - Get crop varieties
- GET `/public/standard-plans/:variety_id` - Get standard plans
- GET `/public/activity-types` - Get activity types

## 🗂️ Project Structure

```
backend/
├── prisma/
│   └── schema.prisma          # Prisma schema
├── src/
│   ├── config/
│   │   ├── database.js        # Prisma client
│   │   └── firebase.js        # Firebase config
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── plotController.js
│   │   ├── cycleController.js
│   │   ├── activityController.js
│   │   └── publicController.js
│   ├── middleware/
│   │   ├── auth.js            # JWT authentication
│   │   ├── errorHandler.js
│   │   ├── validation.js
│   │   └── upload.js          # Multer config
│   ├── routes/
│   │   ├── auth.js
│   │   ├── plots.js
│   │   ├── cycles.js
│   │   ├── activities.js
│   │   ├── public.js
│   │   └── index.js
│   ├── utils/
│   │   └── jwt.js
│   └── server.js              # Main entry point
├── .env.example
├── .gitignore
└── package.json
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage
```

## 🔧 Prisma Commands

```bash
# Generate Prisma Client
npm run prisma:generate

# Create migration
npm run prisma:migrate

# Open Prisma Studio (Database GUI)
npm run prisma:studio

# Seed database
npm run prisma:seed
```

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | MySQL connection string | ✅ |
| `JWT_SECRET` | Secret for JWT signing | ✅ |
| `REFRESH_TOKEN_SECRET` | Secret for refresh token | ✅ |
| `LINE_CHANNEL_ID` | Line OAuth channel ID | ✅ |
| `LINE_CHANNEL_SECRET` | Line OAuth secret | ✅ |
| `FIREBASE_PROJECT_ID` | Firebase project ID | ✅ |
| `FIREBASE_PRIVATE_KEY` | Firebase private key | ✅ |
| `FIREBASE_CLIENT_EMAIL` | Firebase client email | ✅ |
| `FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | ✅ |
| `PORT` | Server port | ❌ (default: 3000) |
| `NODE_ENV` | Environment | ❌ (default: development) |

## 🔐 Security

- JWT tokens สำหรับ authentication
- bcryptjs สำหรับ hash passwords (ถ้ามี)
- express-validator สำหรับ input validation
- CORS configuration
- File upload size limits
- File type validation

## 🚀 Deployment

### Production Checklist

- [ ] เปลี่ยน `JWT_SECRET` และ `REFRESH_TOKEN_SECRET`
- [ ] ตั้งค่า Firebase credentials
- [ ] ตั้งค่า DATABASE_URL ให้ชี้ไปยัง production database
- [ ] ตั้งค่า `NODE_ENV=production`
- [ ] ตั้งค่า CORS_ORIGIN ให้เฉพาะเจาะจง
- [ ] Run database migrations
- [ ] Setup SSL/TLS

### Deploy Commands

```bash
# Build (if needed)
npm run build

# Start production server
npm start
```

## 📄 License

MIT
