-- Migration to add behavioral authentication support
USE banking_system;

CREATE TABLE IF NOT EXISTS user_behavioral_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    avg_typing_speed DECIMAL(10, 2) DEFAULT 0,
    avg_mouse_velocity DECIMAL(10, 2) DEFAULT 0,
    preferred_login_hour INT DEFAULT -1,
    trusted_devices JSON NULL,
    sample_count INT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Add column for additional verification status if needed, 
-- or use a separate table for login attempts. 
-- For this task, we'll store the profile here.
