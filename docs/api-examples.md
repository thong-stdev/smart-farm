# Smart Farm API - Complete Examples

บทความนี้รวบรวม API Endpoints ทั้งหมดพร้อมตัวอย่าง Request/Response ที่ครบถ้วน

---

## Base Configuration

**Base URL**: `https://api.smartfarm.com/api/v1`

**Authentication**: Bearer Token (JWT)

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 1. Authentication APIs

### 1.1 Line OAuth Login

**Endpoint**: `POST /auth/line/callback`

**Request Body**:
```json
{
  "userId": "U1234567890abcdef",
  "displayName": "สมชาย ใจดี",
  "pictureUrl": "https://profile.line-scdn.net/xxxxx",
  "statusMessage": "เกษตรกรมืออาชีพ"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "refresh_xxxxxxxxxxxxx",
  "user": {
    "id": 1,
    "full_name": "สมชาย ใจดี",
    "email": null,
    "role": "user",
    "providers": ["line"]
  }
}
```

**Response** (400 Bad Request):
```json
{
  "success": false,
  "error": "Invalid Line user data"
}
```

---

### 1.2 Get Current User

**Endpoint**: `GET /auth/me`

**Headers**:
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response** (200 OK):
```json
{
  "success": true,
  "user": {
    "id": 1,
    "username": null,
    "email": "user@example.com",
    "full_name": "สมชาย ใจดี",
    "phone": "081-234-5678",
    "role": "user",
    "created_at": "2024-01-01T00:00:00Z",
    "providers": [
      {
        "provider": "line",
        "provider_user_id": "U1234567890abcdef",
        "linked_at": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

---

### 1.3 Refresh Token

**Endpoint**: `POST /auth/refresh`

**Request Body**:
```json
{
  "refresh_token": "refresh_xxxxxxxxxxxxx"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600
}
```

---

## 2. Plot Management APIs

### 2.1 Get All User's Plots

**Endpoint**: `GET /plots`

**Headers**:
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response** (200 OK):
```json
{
  "success": true,
  "plots": [
    {
      "id": 1,
      "plot_name": "แปลงมะม่วง A",
      "area_sqm": 3200.00,
      "area_rai": 2.0,
      "area_ngan": 0.0,
      "area_wa": 0.0,
      "latitude": 13.7563,
      "longitude": 100.5018,
      "soil_info": {
        "ph": 6.5,
        "type": "ดินร่วน",
        "drainage": "ดี"
      },
      "notes": "แปลงใกล้บ้าน",
      "active_cycles": 1,
      "total_cycles": 3,
      "created_at": "2024-01-15T10:00:00Z"
    },
    {
      "id": 2,
      "plot_name": "แปลงผักหลังบ้าน",
      "area_sqm": 400.00,
      "area_rai": 0.0,
      "area_ngan": 1.0,
      "area_wa": 0.0,
      "latitude": 13.7570,
      "longitude": 100.5025,
      "soil_info": {
        "ph": 7.0,
        "type": "ดินร่วนปนทราย"
      },
      "notes": "แปลงเล็กๆ ปลูกผักสวนครัว",
      "active_cycles": 0,
      "total_cycles": 5,
      "created_at": "2024-02-01T08:30:00Z"
    }
  ],
  "total": 2
}
```

---

### 2.2 Get Plot Detail

**Endpoint**: `GET /plots/:id`

**Example**: `GET /plots/1`

**Response** (200 OK):
```json
{
  "success": true,
  "plot": {
    "id": 1,
    "plot_name": "แปลงมะม่วง A",
    "area_sqm": 3200.00,
    "area_rai": 2.0,
    "latitude": 13.7563,
    "longitude": 100.5018,
    "soil_info": {
      "ph": 6.5,
      "type": "ดินร่วน",
      "drainage": "ดี",
      "notes": "เหมาะสำหรับปลูกผลไม้"
    },
    "notes": "แปลงใกล้บ้าน",
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T10:00:00Z"
  },
  "cycles": [
    {
      "id": 1,
      "cycle_name": "มะม่วงรุ่นที่ 1/2567",
      "crop_variety": {
        "id": 1,
        "name": "มะม่วงน้ำดอกไม้",
        "crop_type": "ผลไม้"
      },
      "start_date": "2024-01-15",
      "status": "active",
      "actual_cost": 3300.00,
      "actual_revenue": 0.00,
      "profit": -3300.00
    }
  ]
}
```

---

### 2.3 Create New Plot

**Endpoint**: `POST /plots`

**Request Body**:
```json
{
  "plot_name": "แปลงทดลองใหม่",
  "area_sqm": 1600.00,
  "latitude": 13.7580,
  "longitude": 100.5030,
  "soil_info": {
    "ph": 6.8,
    "type": "ดินร่วนปนทราย",
    "drainage": "ปานกลาง"
  },
  "notes": "แปลงสำหรับทดลองปลูกผัก"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "สร้างแปลงสำเร็จ",
  "plot": {
    "id": 3,
    "plot_name": "แปลงทดลองใหม่",
    "area_sqm": 1600.00,
    "area_rai": 1.0,
    "latitude": 13.7580,
    "longitude": 100.5030,
    "created_at": "2024-03-01T14:30:00Z"
  }
}
```

**Validation Errors** (400 Bad Request):
```json
{
  "success": false,
  "errors": [
    {
      "field": "plot_name",
      "message": "ชื่อแปลงต้องมีความยาวอย่างน้อย 3 ตัวอักษร"
    },
    {
      "field": "area_sqm",
      "message": "พื้นที่ต้องมากกว่า 0"
    }
  ]
}
```

---

### 2.4 Update Plot

**Endpoint**: `PATCH /plots/:id`

**Example**: `PATCH /plots/1`

**Request Body** (partial update):
```json
{
  "plot_name": "แปลงมะม่วง A (ปรับปรุงแล้ว)",
  "notes": "เพิ่มระบบน้ำหยด"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "อัปเดตแปลงสำเร็จ",
  "plot": {
    "id": 1,
    "plot_name": "แปลงมะม่วง A (ปรับปรุงแล้ว)",
    "notes": "เพิ่มระบบน้ำหยด",
    "updated_at": "2024-03-05T10:15:00Z"
  }
}
```

---

### 2.5 Delete Plot

**Endpoint**: `DELETE /plots/:id`

**Example**: `DELETE /plots/3`

**Response** (200 OK):
```json
{
  "success": true,
  "message": "ลบแปลงสำเร็จ"
}
```

**Response** (409 Conflict - มีรอบการปลูกอยู่):
```json
{
  "success": false,
  "error": "ไม่สามารถลบแปลงที่มีรอบการปลูกอยู่ กรุณาลบรอบการปลูกก่อน",
  "active_cycles": 2
}
```

---

## 3. Planting Cycle APIs

### 3.1 Get Cycles by Plot

**Endpoint**: `GET /cycles?plot_id=1`

**Response** (200 OK):
```json
{
  "success": true,
  "cycles": [
    {
      "id": 1,
      "plot_name": "แปลงมะม่วง A",
      "cycle_name": "มะม่วงรุ่นที่ 1/2567",
      "crop_variety": {
        "id": 1,
        "name": "มะม่วงน้ำดอกไม้",
        "crop_type": {
          "id": 1,
          "name": "ผลไม้"
        }
      },
      "start_date": "2024-01-15",
      "end_date": null,
      "status": "active",
      "expected_harvest_date": "2024-05-15",
      "actual_cost": 3300.00,
      "actual_revenue": 0.00,
      "profit": -3300.00,
      "days_elapsed": 45,
      "activity_count": 4
    }
  ]
}
```

---

### 3.2 Get Cycle Detail

**Endpoint**: `GET /cycles/:id`

**Example**: `GET /cycles/1`

**Response** (200 OK):
```json
{
  "success": true,
  "cycle": {
    "id": 1,
    "plot": {
      "id": 1,
      "plot_name": "แปลงมะม่วง A",
      "area_rai": 2.0
    },
    "crop_variety": {
      "id": 1,
      "name": "มะม่วงน้ำดอกไม้",
      "crop_type": "ผลไม้",
      "image_url": "https://example.com/crops/mango.jpg"
    },
    "standard_plan": {
      "id": 1,
      "plan_name": "แผนปลูกมะม่วงแบบมาตรฐาน",
      "total_days": 120,
      "plan_details": {
        "milestones": [
          {
            "day": 1,
            "activity": "เตรียมดิน",
            "description": "ไถดินและใส่ปุ๋ยอินทรีย์"
          },
          {
            "day": 7,
            "activity": "ปลูกกล้า",
            "description": "ปลูกกล้ามะม่วงและรดน้ำ"
          }
        ]
      }
    },
    "cycle_name": "มะม่วงรุ่นที่ 1/2567",
    "start_date": "2024-01-15",
    "end_date": null,
    "status": "active",
    "expected_harvest_date": "2024-05-15",
    "actual_cost": 3300.00,
    "actual_revenue": 0.00,
    "profit": -3300.00,
    "days_elapsed": 45,
    "notes": null,
    "created_at": "2024-01-15T09:00:00Z"
  },
  "activities": [
    {
      "id": 1,
      "activity_type": {
        "id": 6,
        "name": "เตรียมดิน",
        "icon": "🚜",
        "color": "#6B7280"
      },
      "activity_date": "2024-01-15",
      "cost": 2000.00,
      "revenue": 0.00,
      "notes": "ไถดินและใส่ปุ๋ยคอก",
      "images": [
        {
          "id": 1,
          "image_url": "https://storage.example.com/activities/plot1_prepare.jpg",
          "caption": "สภาพดินหลังไถและใส่ปุ๋ย"
        }
      ]
    }
  ]
}
```

---

### 3.3 Start New Planting Cycle

**Endpoint**: `POST /cycles`

**Request Body**:
```json
{
  "plot_id": 1,
  "crop_variety_id": 1,
  "standard_plan_id": 1,
  "cycle_name": "มะม่วงรุ่นที่ 2/2567",
  "start_date": "2024-06-01",
  "notes": "ทดลองใช้ปุ๋ยอินทรีย์"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "เริ่มรอบการปลูกสำเร็จ",
  "cycle": {
    "id": 5,
    "cycle_name": "มะม่วงรุ่นที่ 2/2567",
    "plot_name": "แปลงมะม่วง A",
    "crop_variety": "มะม่วงน้ำดอกไม้",
    "start_date": "2024-06-01",
    "expected_harvest_date": "2024-09-29",
    "status": "active",
    "created_at": "2024-03-01T15:00:00Z"
  }
}
```

**Error** (409 Conflict - มีรอบ active อยู่แล้ว):
```json
{
  "success": false,
  "error": "แปลงนี้มีรอบการปลูกที่กำลังดำเนินการอยู่แล้ว",
  "existing_cycle": {
    "id": 1,
    "cycle_name": "มะม่วงรุ่นที่ 1/2567",
    "start_date": "2024-01-15"
  }
}
```

---

### 3.4 Complete Planting Cycle

**Endpoint**: `POST /cycles/:id/complete`

**Example**: `POST /cycles/1/complete`

**Request Body**:
```json
{
  "end_date": "2024-05-20",
  "notes": "ผลผลิตดี ได้มะม่วงคุณภาพดี 150 กก."
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "จบรอบการปลูกสำเร็จ",
  "cycle": {
    "id": 1,
    "status": "completed",
    "start_date": "2024-01-15",
    "end_date": "2024-05-20",
    "total_days": 126,
    "actual_cost": 3300.00,
    "actual_revenue": 15000.00,
    "profit": 11700.00,
    "roi_percentage": 354.55
  }
}
```

---

## 4. Activity Logging APIs

### 4.1 Get Activities by Cycle

**Endpoint**: `GET /activities?cycle_id=1`

**Response** (200 OK):
```json
{
  "success": true,
  "activities": [
    {
      "id": 1,
      "activity_type": {
        "id": 6,
        "name": "เตรียมดิน",
        "icon": "🚜",
        "color": "#6B7280"
      },
      "activity_date": "2024-01-15",
      "cost": 2000.00,
      "revenue": 0.00,
      "notes": "ไถดินและใส่ปุ๋ยคอก",
      "images": [
        {
          "id": 1,
          "image_url": "https://storage.example.com/activities/plot1_prepare.jpg",
          "caption": "สภาพดินหลังไถและใส่ปุ๋ย"
        }
      ],
      "created_at": "2024-01-15T14:30:00Z"
    },
    {
      "id": 2,
      "activity_type": {
        "id": 7,
        "name": "ปลูก",
        "icon": "🌿",
        "color": "#22C55E"
      },
      "activity_date": "2024-01-22",
      "cost": 500.00,
      "revenue": 0.00,
      "notes": "ปลูกกล้ามะม่วง 10 ต้น",
      "images": [
        {
          "id": 2,
          "image_url": "https://storage.example.com/activities/plot1_planting.jpg",
          "caption": "กล้ามะม่วงที่ปลูกใหม่"
        }
      ],
      "created_at": "2024-01-22T09:00:00Z"
    }
  ],
  "summary": {
    "total_activities": 4,
    "total_cost": 3300.00,
    "total_revenue": 0.00,
    "date_range": {
      "first": "2024-01-15",
      "last": "2024-02-15"
    }
  }
}
```

---

### 4.2 Create Activity Log

**Endpoint**: `POST /activities`

**Request Body**:
```json
{
  "cycle_id": 1,
  "activity_type_id": 1,
  "activity_date": "2024-03-01",
  "cost": 0,
  "revenue": 0,
  "notes": "รดน้ำเช้า-เย็น ต้นไม้เริ่มออกดอก"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "บันทึกกิจกรรมสำเร็จ",
  "activity": {
    "id": 10,
    "cycle_id": 1,
    "activity_type": {
      "id": 1,
      "name": "รดน้ำ",
      "icon": "💧"
    },
    "activity_date": "2024-03-01",
    "cost": 0.00,
    "revenue": 0.00,
    "notes": "รดน้ำเช้า-เย็น ต้นไม้เริ่มออกดอก",
    "created_at": "2024-03-01T18:00:00Z"
  }
}
```

---

### 4.3 Upload Activity Images

**Endpoint**: `POST /activities/:id/images`

**Content-Type**: `multipart/form-data`

**Example**: `POST /activities/10/images`

**Form Data**:
```
files: [File, File, File]  // Array of image files
captions: ["รูปที่ 1", "รูปที่ 2", "รูปที่ 3"]  // Optional
```

**cURL Example**:
```bash
curl -X POST https://api.smartfarm.com/api/v1/activities/10/images \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -F "files=@photo1.jpg" \
  -F "files=@photo2.jpg" \
  -F "captions[]=สภาพต้นไม้ช่วงดอกบาน" \
  -F "captions[]=ใบไม้สีเขียวสด"
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "อัปโหลดรูปภาพสำเร็จ",
  "images": [
    {
      "id": 15,
      "activity_log_id": 10,
      "image_url": "https://storage.example.com/activities/abc123.jpg",
      "caption": "สภาพต้นไม้ช่วงดอกบาน",
      "uploaded_at": "2024-03-01T18:05:00Z"
    },
    {
      "id": 16,
      "activity_log_id": 10,
      "image_url": "https://storage.example.com/activities/def456.jpg",
      "caption": "ใบไม้สีเขียวสด",
      "uploaded_at": "2024-03-01T18:05:01Z"
    }
  ]
}
```

**Error** (400 Bad Request - File too large):
```json
{
  "success": false,
  "error": "ไฟล์รูปภาพมีขนาดใหญ่เกินไป (สูงสุด 5MB)",
  "max_size": "5MB"
}
```

---

### 4.4 Delete Activity Image

**Endpoint**: `DELETE /activities/:activity_id/images/:image_id`

**Example**: `DELETE /activities/10/images/15`

**Response** (200 OK):
```json
{
  "success": true,
  "message": "ลบรูปภาพสำเร็จ"
}
```

---

## 5. Master Data APIs (Public)

### 5.1 Get All Crop Types

**Endpoint**: `GET /public/crop-types`

**No authentication required**

**Response** (200 OK):
```json
{
  "success": true,
  "crop_types": [
    {
      "id": 1,
      "name": "ผลไม้",
      "description": "พืชผลไม้ เช่น มะม่วง กล้วย ส้ม",
      "icon_url": "https://example.com/icons/fruits.png",
      "variety_count": 15
    },
    {
      "id": 2,
      "name": "ผัก",
      "description": "พืชผัก เช่น ผักบุ้ง ผักคะน้า กะหล่ำ",
      "icon_url": "https://example.com/icons/vegetables.png",
      "variety_count": 25
    }
  ]
}
```

---

### 5.2 Get Crop Varieties by Type

**Endpoint**: `GET /public/crop-varieties?crop_type_id=1`

**Response** (200 OK):
```json
{
  "success": true,
  "varieties": [
    {
      "id": 1,
      "crop_type_id": 1,
      "name": "มะม่วงน้ำดอกไม้",
      "description": "มะม่วงพันธุ์ยอดนิยม รสชาติหวาน",
      "image_url": "https://example.com/crops/mango.jpg",
      "additional_info": {
        "growing_days_min": 90,
        "growing_days_max": 120,
        "suitable_temp": "25-35°C",
        "water_frequency": "ทุกวัน (ช่วงแรก)"
      }
    }
  ]
}
```

---

### 5.3 Get Standard Plans by Variety

**Endpoint**: `GET /public/standard-plans/:variety_id`

**Example**: `GET /public/standard-plans/1`

**Response** (200 OK):
```json
{
  "success": true,
  "plans": [
    {
      "id": 1,
      "crop_variety_id": 1,
      "plan_name": "แผนปลูกมะม่วงแบบมาตรฐาน",
      "total_days": 120,
      "cost_estimate": 15000.00,
      "plan_details": {
        "milestones": [
          {
            "day": 1,
            "activity": "เตรียมดิน",
            "description": "ไถดินและใส่ปุ๋ยอินทรีย์",
            "cost_estimate": 2000
          },
          {
            "day": 7,
            "activity": "ปลูกกล้า",
            "description": "ปลูกกล้ามะม่วงและรดน้ำ",
            "cost_estimate": 500
          }
        ]
      }
    }
  ]
}
```

---

## 6. Admin APIs

### 6.1 Get All Users (Admin Only)

**Endpoint**: `GET /admin/users`

**Headers**:
```http
Authorization: Bearer <admin_token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "users": [
    {
      "id": 1,
      "username": null,
      "email": "farmer1@example.com",
      "full_name": "สมชาย ใจดี",
      "phone": "081-234-5678",
      "role": "user",
      "created_at": "2024-01-01T00:00:00Z",
      "stats": {
        "total_plots": 2,
        "total_cycles": 8,
        "total_revenue": 45000.00,
        "total_cost": 28000.00,
        "profit": 17000.00
      }
    }
  ],
  "total": 15,
  "page": 1,
  "per_page": 20
}
```

---

### 6.2 Get All Plots on Map (Admin Only)

**Endpoint**: `GET /admin/map/plots`

**Response** (200 OK):
```json
{
  "success": true,
  "plots": [
    {
      "id": 1,
      "user_name": "สมชาย ใจดี",
      "plot_name": "แปลงมะม่วง A",
      "latitude": 13.7563,
      "longitude": 100.5018,
      "area_rai": 2.0,
      "active_cycles": 1,
      "crop_varieties": ["มะม่วงน้ำดอกไม้"]
    }
  ]
}
```

---

## Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Token is invalid or expired",
  "code": "UNAUTHORIZED"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "You don't have permission to access this resource",
  "code": "FORBIDDEN"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Resource not found",
  "code": "NOT_FOUND"
}
```

### 422 Validation Error
```json
{
  "success": false,
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "errors": [
    {
      "field": "area_sqm",
      "message": "พื้นที่ต้องมากกว่า 0"
    }
  ]
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error",
  "code": "INTERNAL_ERROR",
  "request_id": "req_abc123xyz"
}
```

---

## Rate Limiting

**Limits**:
- **Normal Users**: 100 requests/minute
- **Admin Users**: 200 requests/minute

**Headers**:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1234567890
```

**Rate Limit Exceeded** (429):
```json
{
  "success": false,
  "error": "Too many requests",
  "retry_after": 60
}
```
