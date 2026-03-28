const otpService = require('./services/otpService');
const pool = require('./config/db');

async function testV() {
    try {
        console.log('Testing generateAndSendOTP...');
        await otpService.generateAndSendOTP(2, 'test@example.com');

        // Fetch the code
        const [rows] = await pool.query('SELECT * FROM user_otps WHERE user_id = 2 ORDER BY created_at DESC LIMIT 1');
        const code = rows[0].otp_code;
        console.log('Got code from DB:', code);

        console.log('Testing verifyOTP...');
        const isValid = await otpService.verifyOTP(2, code);

        console.log('Verification Result:', isValid);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
testV();
