const pool = require('./config/db');

async function upgrade() {
    try {
        console.log("Checking schema...");
        const [rows] = await pool.query('DESCRIBE users');
        console.log("Current schema:");
        console.log(rows);

        let hasEmail = rows.some(r => r.Field === 'email');
        if (!hasEmail) {
            console.log("Adding email column...");
            await pool.query('ALTER TABLE users ADD COLUMN email VARCHAR(255) UNIQUE');
            console.log("Email column added.");
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

upgrade();
