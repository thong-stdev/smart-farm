-- ====================================
-- Smart Farm Database Schema (MySQL)
-- Version: 1.0
-- Created: 2025-11-21
-- ====================================

-- Set charset and collation
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- ====================================
-- 1. USERS TABLE
-- ====================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE,
    email VARCHAR(255) UNIQUE,
    full_name VARCHAR(255),
    phone VARCHAR(20),
    role ENUM('user', 'admin') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='ตารางผู้ใช้งานหลัก (เกษตรกรและแอดมิน)';

-- ====================================
-- 2. USER OAUTH PROVIDERS TABLE
-- ====================================
CREATE TABLE user_oauth_providers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    provider ENUM('line', 'google', 'facebook') NOT NULL,
    provider_user_id VARCHAR(255) NOT NULL COMMENT 'User ID จาก OAuth Provider',
    provider_data JSON COMMENT 'ข้อมูลเพิ่มเติมจาก Provider (profile, email, picture)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_provider_user (provider, provider_user_id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='ตารางเชื่อมโยง OAuth Providers (รองรับหลาย Provider ต่อ 1 User)';

-- ====================================
-- 3. CROP TYPES TABLE (Master Data)
-- ====================================
CREATE TABLE crop_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_crop_type_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='ตารางประเภทพืช (ผลไม้, ผัก, ไม้ดอก, พืชไร่)';

-- ====================================
-- 4. CROP VARIETIES TABLE (Master Data)
-- ====================================
CREATE TABLE crop_varieties (
    id INT AUTO_INCREMENT PRIMARY KEY,
    crop_type_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    additional_info JSON COMMENT 'ข้อมูลเพิ่มเติม (ระยะเวลาเฉลี่ย, อุณหภูมิเหมาะสม)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (crop_type_id) REFERENCES crop_types(id) ON DELETE CASCADE,
    INDEX idx_crop_type_id (crop_type_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='ตารางสายพันธุ์พืช (มะม่วงน้ำดอกไม้, ข้าวหอมมะลิ)';

-- ====================================
-- 5. STANDARD PLANS TABLE (Master Data)
-- ====================================
CREATE TABLE standard_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    crop_variety_id INT NOT NULL,
    plan_name VARCHAR(255) NOT NULL,
    total_days INT NOT NULL COMMENT 'จำนวนวันโดยประมาณ',
    plan_details JSON NOT NULL COMMENT 'รายละเอียดแผน (milestones, activities)',
    cost_estimate DECIMAL(10, 2) COMMENT 'ต้นทุนโดยประมาณ',
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (crop_variety_id) REFERENCES crop_varieties(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_crop_variety_id (crop_variety_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='ตารางแผนการปลูกมาตรฐาน (Template สำหรับแต่ละพันธุ์พืช)';

-- ====================================
-- 6. PLOTS TABLE
-- ====================================
CREATE TABLE plots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    plot_name VARCHAR(255) NOT NULL,
    area_sqm DECIMAL(10, 2) NOT NULL COMMENT 'พื้นที่เป็นตารางเมตร (1 ไร่ = 1600 ตร.ม.)',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    soil_info JSON COMMENT 'ข้อมูลดิน (pH, type, drainage, notes)',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_location (latitude, longitude)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='ตารางแปลงเกษตร';

-- ====================================
-- 7. PLANTING CYCLES TABLE
-- ====================================
CREATE TABLE planting_cycles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    plot_id INT NOT NULL,
    crop_variety_id INT NOT NULL,
    standard_plan_id INT COMMENT 'อ้างอิงจาก template (ถ้าใช้)',
    cycle_name VARCHAR(255),
    start_date DATE NOT NULL,
    end_date DATE COMMENT 'วันที่เก็บเกี่ยว/สิ้นสุด',
    status ENUM('active', 'completed', 'abandoned') DEFAULT 'active',
    expected_harvest_date DATE,
    actual_cost DECIMAL(10, 2) DEFAULT 0,
    actual_revenue DECIMAL(10, 2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (plot_id) REFERENCES plots(id) ON DELETE CASCADE,
    FOREIGN KEY (crop_variety_id) REFERENCES crop_varieties(id),
    FOREIGN KEY (standard_plan_id) REFERENCES standard_plans(id) ON DELETE SET NULL,
    INDEX idx_plot_id (plot_id),
    INDEX idx_status (status),
    INDEX idx_dates (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='ตารางรอบการเพาะปลูก';

-- ====================================
-- 8. ACTIVITY TYPES TABLE (Master Data)
-- ====================================
CREATE TABLE activity_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50),
    color VARCHAR(7) COMMENT 'Hex color code',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_activity_type (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='ตารางประเภทกิจกรรม (รดน้ำ, ใส่ปุ๋ย, ฉีดยา, เก็บเกี่ยว)';

-- ====================================
-- 9. ACTIVITY LOGS TABLE
-- ====================================
CREATE TABLE activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cycle_id INT NOT NULL,
    activity_type_id INT NOT NULL,
    activity_date DATE NOT NULL,
    cost DECIMAL(10, 2) DEFAULT 0,
    revenue DECIMAL(10, 2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cycle_id) REFERENCES planting_cycles(id) ON DELETE CASCADE,
    FOREIGN KEY (activity_type_id) REFERENCES activity_types(id),
    INDEX idx_cycle_id (cycle_id),
    INDEX idx_activity_date (activity_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='ตารางบันทึกกิจกรรมรายวัน';

-- ====================================
-- 10. ACTIVITY IMAGES TABLE
-- ====================================
CREATE TABLE activity_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    activity_log_id INT NOT NULL,
    image_url VARCHAR(500) NOT NULL COMMENT 'URL ชี้ไปยัง Cloud Storage',
    caption TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (activity_log_id) REFERENCES activity_logs(id) ON DELETE CASCADE,
    INDEX idx_activity_log_id (activity_log_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='ตารางรูปภาพกิจกรรม (รองรับหลายรูปต่อ 1 กิจกรรม)';

-- ====================================
-- 11. USER SESSIONS TABLE (สำหรับ Refresh Token)
-- ====================================
CREATE TABLE user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    refresh_token VARCHAR(500) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_refresh_token (refresh_token(255))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='ตารางเก็บ Refresh Token สำหรับ JWT Authentication';

-- ====================================
-- TRIGGERS
-- ====================================

-- Trigger: อัปเดต actual_cost และ actual_revenue ใน planting_cycles เมื่อมีการเพิ่ม/แก้ไข activity_logs
DELIMITER $$

CREATE TRIGGER update_cycle_financials_after_insert
AFTER INSERT ON activity_logs
FOR EACH ROW
BEGIN
    UPDATE planting_cycles
    SET 
        actual_cost = (
            SELECT COALESCE(SUM(cost), 0)
            FROM activity_logs
            WHERE cycle_id = NEW.cycle_id
        ),
        actual_revenue = (
            SELECT COALESCE(SUM(revenue), 0)
            FROM activity_logs
            WHERE cycle_id = NEW.cycle_id
        )
    WHERE id = NEW.cycle_id;
END$$

CREATE TRIGGER update_cycle_financials_after_update
AFTER UPDATE ON activity_logs
FOR EACH ROW
BEGIN
    UPDATE planting_cycles
    SET 
        actual_cost = (
            SELECT COALESCE(SUM(cost), 0)
            FROM activity_logs
            WHERE cycle_id = NEW.cycle_id
        ),
        actual_revenue = (
            SELECT COALESCE(SUM(revenue), 0)
            FROM activity_logs
            WHERE cycle_id = NEW.cycle_id
        )
    WHERE id = NEW.cycle_id;
END$$

CREATE TRIGGER update_cycle_financials_after_delete
AFTER DELETE ON activity_logs
FOR EACH ROW
BEGIN
    UPDATE planting_cycles
    SET 
        actual_cost = (
            SELECT COALESCE(SUM(cost), 0)
            FROM activity_logs
            WHERE cycle_id = OLD.cycle_id
        ),
        actual_revenue = (
            SELECT COALESCE(SUM(revenue), 0)
            FROM activity_logs
            WHERE cycle_id = OLD.cycle_id
        )
    WHERE id = OLD.cycle_id;
END$$

DELIMITER ;

-- ====================================
-- END OF SCHEMA
-- ====================================
