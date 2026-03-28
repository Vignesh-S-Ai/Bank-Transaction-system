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

        // Fetch the absolute newest OTP for this user
        const [rows] = await pool.query(
            `SELECT * FROM user_otps 
            WHERE user_id = ? 
            AND is_used = 0
            ORDER BY id DESC 
            LIMIT 1`,
            [userId]
        );
        if (rows.length === 0) {
            console.log('❌ OTP does not exist at all for this user in the table.');
            return false;
        }

        const row = rows[0];
        console.log(`📌 Found Latest Record in DB: ${JSON.stringify(row)}`);

        // 1. Check if used
        if (row.is_used !== 0 && row.is_used !== false) {
            console.log('❌ Code was already used!');
            return false;
        }

        // 2. Check Javascript Math Expiry (Guaranteed no MySQL timezone mismatches)
        const now = new Date();
        const expiry = new Date(row.expires_at);
        console.log(`⏳ Node.js Clock: ${now.toISOString()} | Expiry Boundary: ${expiry.toISOString()}`);

        if (now > expiry) {
            console.log('❌ Code EXPIRED according to Node.js time comparison.');
            return false;
        }

        // 3. String comparison
        const providedCode = String(code).trim();
        const dbCode = String(row.otp_code).trim();

        if (Number(providedCode) !== Number(dbCode)) {
            console.log(`❌ Mismatch → User: ${providedCode} | DB: ${dbCode}`);
            return false;
        }

        // Final step: Burn the code so it can't be reused
        await pool.query(`UPDATE user_otps SET is_used = 1 WHERE id = ?`, [row.id]);
        console.log('✅ OTP Verified Successfully');
        return true;
    }
}

module.exports = new OTPService();