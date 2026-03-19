const pool = require('./config/db');

async function upgrade() {
    try {
        console.log("Updating enum for transactions table...");
        await pool.query("ALTER TABLE transactions MODIFY COLUMN type ENUM('DEPOSIT', 'WITHDRAWAL', 'TRANSFER') NOT NULL");
        console.log("Enum updated successfully.");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

upgrade();
