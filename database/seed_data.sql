-- ====================================
-- Smart Farm Database - Seed Data
-- ตัวอย่างข้อมูลเริ่มต้นสำหรับทดสอบระบบ
-- ====================================

-- ====================================
-- 1. ACTIVITY TYPES (ประเภทกิจกรรม)
-- ====================================
INSERT INTO activity_types (name, icon, color) VALUES
('รดน้ำ', '💧', '#3B82F6'),
('ใส่ปุ๋ย', '🌱', '#10B981'),
('ฉีดยา', '💉', '#EF4444'),
('เก็บเกี่ยว', '🌾', '#F59E0B'),
('ตัดแต่งกิ่ง', '✂️', '#8B5CF6'),
('เตรียมดิน', '🚜', '#6B7280'),
('ปลูก', '🌿', '#22C55E'),
('กำจัดวัชพืช', '🌾', '#EAB308');

-- ====================================
-- 2. CROP TYPES (ประเภทพืช)
-- ====================================
INSERT INTO crop_types (name, description, icon_url) VALUES
('ผลไม้', 'พืชผลไม้ เช่น มะม่วง กล้วย ส้ม', 'https://example.com/icons/fruits.png'),
('ผัก', 'พืชผัก เช่น ผักบุ้ง ผักคะน้า กะหล่ำ', 'https://example.com/icons/vegetables.png'),
('ไม้ดอก', 'ไม้ดอกไม้ประดับ', 'https://example.com/icons/flowers.png'),
('พืชไร่', 'ข้าว ข้าวโพด อ้อย', 'https://example.com/icons/field-crops.png');

-- ====================================
-- 3. CROP VARIETIES (สายพันธุ์พืช)
-- ====================================

-- ผลไม้
INSERT INTO crop_varieties (crop_type_id, name, description, additional_info) VALUES
(1, 'มะม่วงน้ำดอกไม้', 'มะม่วงพันธุ์ยอดนิยม รสชาติหวาน', 
    JSON_OBJECT(
        'growing_days_min', 90,
        'growing_days_max', 120,
        'suitable_temp', '25-35°C',
        'water_frequency', 'ทุกวัน (ช่วงแรก)'
    )
),
(1, 'กล้วยน้ำว้า', 'กล้วยพันธุ์ไทย กลิ่นหอม หวานมัน',
    JSON_OBJECT(
        'growing_days_min', 300,
        'growing_days_max', 365,
        'suitable_temp', '20-30°C',
        'water_frequency', 'สม่ำเสมอ'
    )
),
(1, 'ส้มโอทองดี', 'ส้มโอพันธุ์ดี เนื้อหวาน ไม่ขม',
    JSON_OBJECT(
        'growing_days_min', 180,
        'growing_days_max', 240,
        'suitable_temp', '23-32°C',
        'water_frequency', 'ทุก 2-3 วัน'
    )
);

-- ผัก
INSERT INTO crop_varieties (crop_type_id, name, description, additional_info) VALUES
(2, 'ผักบุ้งจีน', 'ผักบุ้งใบใหญ่ เจริญเร็ว',
    JSON_OBJECT(
        'growing_days_min', 25,
        'growing_days_max', 35,
        'suitable_temp', '25-35°C',
        'water_frequency', 'ทุกวัน (ชอบน้ำมาก)'
    )
),
(2, 'คะน้าไฮบริด', 'คะน้าพันธุ์ดี ลำต้นใหญ่',
    JSON_OBJECT(
        'growing_days_min', 40,
        'growing_days_max', 50,
        'suitable_temp', '20-28°C',
        'water_frequency', 'ทุกวัน'
    )
);

-- พืชไร่
INSERT INTO crop_varieties (crop_type_id, name, description, additional_info) VALUES
(4, 'ข้าวหอมมะลิ 105', 'ข้าวพันธุ์ดี กลิ่นหอม',
    JSON_OBJECT(
        'growing_days_min', 120,
        'growing_days_max', 135,
        'suitable_temp', '25-30°C',
        'water_frequency', 'ตามฤดูกาล'
    )
);

-- ====================================
-- 4. STANDARD PLANS (แผนการปลูกมาตรฐาน)
-- ====================================

-- แผนปลูกมะม่วงน้ำดอกไม้
INSERT INTO standard_plans (crop_variety_id, plan_name, total_days, plan_details, cost_estimate) VALUES
(1, 'แผนปลูกมะม่วงแบบมาตรฐาน', 120, 
    JSON_OBJECT(
        'milestones', JSON_ARRAY(
            JSON_OBJECT('day', 1, 'activity', 'เตรียมดิน', 'description', 'ไถดินและใส่ปุ๋ยอินทรีย์'),
            JSON_OBJECT('day', 7, 'activity', 'ปลูกกล้า', 'description', 'ปลูกกล้ามะม่วงและรดน้ำ'),
            JSON_OBJECT('day', 30, 'activity', 'ใส่ปุ๋ยครั้งที่ 1', 'description', 'ปุ๋ยเคมีสูตร 15-15-15'),
            JSON_OBJECT('day', 60, 'activity', 'ใส่ปุ๋ยครั้งที่ 2', 'description', 'ปุ๋ยเคมีสูตร 13-13-21'),
            JSON_OBJECT('day', 90, 'activity', 'ตัดแต่งกิ่ง', 'description', 'ตัดกิ่งแห้งออก'),
            JSON_OBJECT('day', 120, 'activity', 'เก็บเกี่ยว', 'description', 'เก็บผลมะม่วงที่สุกแล้ว')
        )
    ),
    15000.00
);

-- แผนปลูกผักบุ้งจีน
INSERT INTO standard_plans (crop_variety_id, plan_name, total_days, plan_details, cost_estimate) VALUES
(4, 'แผนปลูกผักบุ้งแบบเร็ว', 30,
    JSON_OBJECT(
        'milestones', JSON_ARRAY(
            JSON_OBJECT('day', 1, 'activity', 'เตรียมดิน', 'description', 'ไถดินและทำแปลง'),
            JSON_OBJECT('day', 3, 'activity', 'หว่านเมล็ด', 'description', 'หว่านเมล็ดผักบุ้ง'),
            JSON_OBJECT('day', 7, 'activity', 'รดน้ำสม่ำเสมอ', 'description', 'รดน้ำเช้า-เย็น'),
            JSON_OBJECT('day', 15, 'activity', 'ใส่ปุ๋ย', 'description', 'ปุ๋ยยูเรีย'),
            JSON_OBJECT('day', 25, 'activity', 'เก็บเกี่ยวครั้งที่ 1', 'description', 'เก็บผักบุ้งโตเต็มที่'),
            JSON_OBJECT('day', 30, 'activity', 'เก็บเกี่ยวครั้งสุดท้าย', 'description', 'เก็บทั้งหมด')
        )
    ),
    1500.00
);

-- แผนปลูกข้าวหอมมะลิ
INSERT INTO standard_plans (crop_variety_id, plan_name, total_days, plan_details, cost_estimate) VALUES
(6, 'แผนปลูกข้าวหอมมะลิ 105', 130,
    JSON_OBJECT(
        'milestones', JSON_ARRAY(
            JSON_OBJECT('day', 1, 'activity', 'เตรียมนาและไถ', 'description', 'ไถนาและปรับระดับ'),
            JSON_OBJECT('day', 7, 'activity', 'ปักดำ', 'description', 'ปักดำกล้าข้าว'),
            JSON_OBJECT('day', 30, 'activity', 'ใส่ปุ๋ย', 'description', 'ปุ๋ยยูเรีย'),
            JSON_OBJECT('day', 60, 'activity', 'ใส่ปุ๋ยครั้งที่ 2', 'description', 'ปุ๋ยสูตร 16-20-0'),
            JSON_OBJECT('day', 90, 'activity', 'ฉีดยาป้องกันศัตรูพืช', 'description', 'ฉีดยากำจัดแมลง'),
            JSON_OBJECT('day', 130, 'activity', 'เก็บเกี่ยว', 'description', 'เกี่ยวข้าว')
        )
    ),
    8000.00
);

-- ====================================
-- 5. DEMO USER & ADMIN
-- ====================================

-- สร้าง User ทดสอบ
INSERT INTO users (username, email, full_name, phone, role) VALUES
('farmer1', 'farmer1@example.com', 'สมชาย ใจดี', '081-234-5678', 'user'),
('admin', 'admin@smartfarm.com', 'ผู้ดูแลระบบ', '092-345-6789', 'admin');

-- เชื่อม Line OAuth (สมมติ)
INSERT INTO user_oauth_providers (user_id, provider, provider_user_id, provider_data) VALUES
(1, 'line', 'U1234567890abcdef', 
    JSON_OBJECT(
        'displayName', 'สมชาย ใจดี',
        'pictureUrl', 'https://profile.line-scdn.net/xxxxx',
        'statusMessage', 'เกษตรกรมืออาชีพ'
    )
);

-- ====================================
-- 6. DEMO PLOT (แปลงตัวอย่าง)
-- ====================================

INSERT INTO plots (user_id, plot_name, area_sqm, latitude, longitude, soil_info, notes) VALUES
(1, 'แปลงมะม่วง A', 3200.00, 13.7563, 100.5018,
    JSON_OBJECT(
        'ph', 6.5,
        'type', 'ดินร่วน',
        'drainage', 'ดี',
        'notes', 'เหมาะสำหรับปลูกผลไม้'
    ),
    'แปลงใกล้บ้าน'
),
(1, 'แปลงผักหลังบ้าน', 400.00, 13.7570, 100.5025,
    JSON_OBJECT(
        'ph', 7.0,
        'type', 'ดินร่วนปนทราย',
        'drainage', 'ดีมาก',
        'notes', 'ผักเจริญเติบโตดี'
    ),
    'แปลงเล็กๆ ปลูกผักสวนครัว'
);

-- ====================================
-- 7. DEMO PLANTING CYCLE
-- ====================================

-- รอบการปลูกมะม่วง (กำลังดำเนินการ)
INSERT INTO planting_cycles (plot_id, crop_variety_id, standard_plan_id, cycle_name, start_date, status, expected_harvest_date) VALUES
(1, 1, 1, 'มะม่วงรุ่นที่ 1/2567', '2024-01-15', 'active', '2024-05-15');

-- รอบการปลูกผักบุ้ง (เสร็จสิ้นแล้ว)
INSERT INTO planting_cycles (plot_id, crop_variety_id, standard_plan_id, cycle_name, start_date, end_date, status, expected_harvest_date, actual_cost, actual_revenue) VALUES
(2, 4, 2, 'ผักบุ้งรอบที่ 3', '2024-02-01', '2024-03-02', 'completed', '2024-02-26', 1200.00, 3500.00);

-- ====================================
-- 8. DEMO ACTIVITY LOGS
-- ====================================

-- กิจกรรมของรอบมะม่วง
INSERT INTO activity_logs (cycle_id, activity_type_id, activity_date, cost, revenue, notes) VALUES
(1, 6, '2024-01-15', 2000.00, 0, 'ไถดินและใส่ปุ๋ยคอก'),
(1, 7, '2024-01-22', 500.00, 0, 'ปลูกกล้ามะม่วง 10 ต้น'),
(1, 1, '2024-01-23', 0, 0, 'รดน้ำทุกวัน'),
(1, 2, '2024-02-15', 800.00, 0, 'ใส่ปุ๋ยเคมี 15-15-15');

-- กิจกรรมของรอบผักบุ้ง (จบแล้ว)
INSERT INTO activity_logs (cycle_id, activity_type_id, activity_date, cost, revenue, notes) VALUES
(2, 6, '2024-02-01', 300.00, 0, 'เตรียมดินและทำแปลง'),
(2, 7, '2024-02-03', 200.00, 0, 'หว่านเมล็ดผักบุ้ง'),
(2, 1, '2024-02-10', 0, 0, 'รดน้ำสม่ำเสมอ'),
(2, 2, '2024-02-18', 300.00, 0, 'ใส่ปุ๋ยยูเรีย'),
(2, 4, '2024-02-26', 0, 2000.00, 'เก็บเกี่ยวครั้งที่ 1 ได้ 20 กก.'),
(2, 4, '2024-03-02', 0, 1500.00, 'เก็บเกี่ยวครั้งสุดท้าย 15 กก.');

-- ====================================
-- 9. DEMO ACTIVITY IMAGES
-- ====================================

INSERT INTO activity_images (activity_log_id, image_url, caption) VALUES
(1, 'https://storage.example.com/activities/plot1_prepare.jpg', 'สภาพดินหลังไถและใส่ปุ๋ย'),
(2, 'https://storage.example.com/activities/plot1_planting.jpg', 'กล้ามะม่วงที่ปลูกใหม่'),
(5, 'https://storage.example.com/activities/plot2_harvest1.jpg', 'ผักบุ้งโตเต็มที่พร้อมเก็บ'),
(5, 'https://storage.example.com/activities/plot2_harvest2.jpg', 'ผักบุ้งที่เก็บเกี่ยวได้');

-- ====================================
-- END OF SEED DATA
-- ====================================

-- คำแนะนำการใช้งาน:
-- 1. รัน schema.sql ก่อน
-- 2. จากนั้นรัน seed_data.sql นี้
-- 3. ระบบจะมีข้อมูลตัวอย่างพร้อมใช้งาน
