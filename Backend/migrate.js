const mysql = require('mysql2/promise');
require('dotenv').config();

const run = async () => {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'Rootvi',
        password: process.env.DB_PASSWORD || 'Rootvi@123',
        database: process.env.DB_NAME || 'banking_system',
    });
    console.log('Connected to run advanced schema migration');

    try {
        await connection.query("ALTER TABLE transactions ADD COLUMN status ENUM('PENDING', 'SUCCESS', 'FAILED') DEFAULT 'PENDING' AFTER amount;");
        console.log('Added status column');
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') console.log('status column already exists');
        else console.error('Error adding status', e);
    }

    try {
        await connection.query("ALTER TABLE transactions ADD COLUMN idempotency_key VARCHAR(255) AFTER status;");
        console.log('Added idempotency_key column');
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') console.log('idempotency_key column already exists');
        else console.error('Error adding idempotency_key', e);
    }

    const auditLogTable = `
        CREATE TABLE IF NOT EXISTS audit_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            action VARCHAR(255) NOT NULL,
            ip_address VARCHAR(45),
            details JSON,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
    `;
    try {
        await connection.query(auditLogTable);
        console.log('Audit log table created or verified');
    } catch (e) {
        console.error('Error creating audit logs', e);
    }

    await connection.end();
};
run();
