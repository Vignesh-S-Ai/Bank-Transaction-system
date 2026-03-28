const pool = require('../config/db');

class OTPService {
    async generateAndSendOTP(userId, email) {
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

        try {
            // 🔥 STEP 1: Invalidate old OTPs
            await pool.query(
                `UPDATE user_otps SET is_used = 1 WHERE user_id = ?`,
                [userId]
            );

            // 🔥 STEP 2: Insert new OTP
            await pool.query(
                `INSERT INTO user_otps (user_id, otp_code, expires_at, is_used)
             VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE), 0)`,
                [userId, otpCode]
            );

            console.log(`🔑 OTP: ${otpCode}`);

            return true;
        } catch (err) {
            console.error('OTP Error:', err);
            return false;
        }
    }

    async verifyOTP(userId, code) {
        console.log(`--- VERIFYING OTP FOR USER ${userId} ---`);

        try {
            const [rows] = await pool.query(
                `SELECT * FROM user_otps 
                WHERE user_id = ? 
                AND is_used = 0
                ORDER BY id DESC 
                LIMIT 1`,
                [userId]
            );

            if (rows.length === 0) {
                console.log('❌ No active OTP found');
                return false;
            }

            const row = rows[0];

            console.log(`📌 DB OTP Record:`, row);

            // ✅ Expiry check FIRST (important order)
            const now = new Date();
            const expiry = new Date(row.expires_at);

            if (now > expiry) {
                console.log('❌ OTP expired');

                // 🔥 Auto-burn expired OTP
                await pool.query(
                    `UPDATE user_otps SET is_used = 1 WHERE id = ?`,
                    [row.id]
                );

                return false;
            }

            // ✅ Normalize values safely
            const provided = String(code).trim();
            const actual = String(row.otp_code).trim();

            console.log(`🔍 Comparing → User: [${provided}] vs DB: [${actual}]`);

            // 🔥 STRICT MATCH
            if (provided !== actual) {
                console.log('❌ OTP mismatch');
                return false;
            }

            // ✅ SUCCESS → burn OTP
            await pool.query(
                `UPDATE user_otps SET is_used = 1 WHERE id = ?`,
                [row.id]
            );

            console.log('✅ OTP VERIFIED SUCCESSFULLY');

            return true;

        } catch (err) {
            console.error('🔴 OTP Verify Error:', err.message);
            return false;
        }
    }
}

module.exports = new OTPService();