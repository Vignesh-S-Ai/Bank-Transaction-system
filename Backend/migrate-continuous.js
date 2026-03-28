const pool = require('./config/db');

async function runMigration() {
    try {
        console.log('🔄 Running Continuous Auth Migration...');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS session_risk_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                session_id VARCHAR(255) NULL,
                risk_score INT DEFAULT 0,
                mouse_velocity DECIMAL(10, 2) DEFAULT 0,
                click_cadence DECIMAL(10, 2) DEFAULT 0,
                scroll_velocity DECIMAL(10, 2) DEFAULT 0,
                is_anomaly BOOLEAN DEFAULT FALSE,
                action_taken ENUM('NONE', 'WARNED', 'SESSION_KILLED') DEFAULT 'NONE',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        `);
        console.log('✅ Created session_risk_logs table.');

        await pool.query(`
            ALTER TABLE user_behavioral_profiles
            ADD COLUMN IF NOT EXISTS active_session_compromised BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS current_risk_score INT DEFAULT 0;
        `);
        console.log('✅ Updated user_behavioral_profiles schema.');

        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    }
}

runMigration();
