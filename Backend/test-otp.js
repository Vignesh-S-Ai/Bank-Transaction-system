const pool = require('./config/db');
pool.query('SELECT * FROM user_otps').then(res => {
    console.log(JSON.stringify(res[0], null, 2));
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
