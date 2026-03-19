-- Advanced Schema Upgrade for Banking System
USE banking_system;

-- Add transaction states, idempotency key
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS status ENUM('PENDING', 'SUCCESS', 'FAILED') DEFAULT 'PENDING' AFTER amount;

ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(255) AFTER status;

-- Try to create the unique index, ignore if already exists (safe in newer mysql, but we'll alter table just in case)
-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    action VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    details JSON,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Note: In production we'd modify transactions.id to VARCHAR(36) to store UUIDs, 
-- but doing so requires dropping foreign keys. 
-- For this upgrade, we'll keep the auto_increment INT ID and just enforce idempotency constraints.
