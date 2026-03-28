const pool = require('./config/db');

async function runMigration() {
    try {
        console.log('🔄 Running Adaptive 2FA (OTP) Migration...');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS user_otps (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                otp_code VARCHAR(10) NOT NULL,
                expires_at DATETIME NOT NULL,
                is_used BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        `);
        console.log('✅ Created user_otps table.');

        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    }
}

runMigration();
