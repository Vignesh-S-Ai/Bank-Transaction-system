const mysql = require('mysql2/promise');
require('dotenv').config();

const run = async () => {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'Rootvi',
        password: process.env.DB_PASSWORD || 'Rootvi@123',
        database: process.env.DB_NAME || 'banking_system'
    });
    console.log('Connected');
    await connection.query('ALTER TABLE users ADD COLUMN full_name VARCHAR(100);');
    console.log('Column added');
    connection.end();
};
run();
