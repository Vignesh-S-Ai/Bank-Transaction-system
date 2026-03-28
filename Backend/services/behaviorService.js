const pool = require('../config/db');
const llmService = require('./llmService');

class BehaviorService {
    async updateProfile(userId, behavior) {
        const { typingSpeed, mouseVelocity, loginTime, deviceInfo } = behavior;
        const safeTyping = Math.min(Math.max(typingSpeed, 0), 2000);
        const safeMouse = Math.min(Math.max(mouseVelocity, 0), 50000);

        try {
            const [profiles] = await pool.query('SELECT * FROM user_behavioral_profiles WHERE user_id = ?', [userId]);

            if (profiles.length === 0) {
                await pool.query(
                    'INSERT INTO user_behavioral_profiles (user_id, avg_typing_speed, avg_mouse_velocity, preferred_login_hour, trusted_devices, sample_count) VALUES (?, ?, ?, ?, ?, ?)',
                    [userId, safeTyping, safeMouse, loginTime, JSON.stringify([deviceInfo]), 1]
                );
            } else {
                const profile = profiles[0];
                const newCount = profile.sample_count + 1;
                const newAvgTyping = ((Number(profile.avg_typing_speed) * profile.sample_count) + safeTyping) / newCount;
                const newAvgMouse = ((Number(profile.avg_mouse_velocity) * profile.sample_count) + safeMouse) / newCount;

                let devices = [];
                try {
                    devices = typeof profile.trusted_devices === 'string' ? JSON.parse(profile.trusted_devices) : profile.trusted_devices;
                } catch (e) { devices = [profile.trusted_devices]; }

                if (!Array.isArray(devices)) devices = [];
                if (!devices.includes(deviceInfo)) devices.push(deviceInfo);

                await pool.query(
                    'UPDATE user_behavioral_profiles SET avg_typing_speed = ?, avg_mouse_velocity = ?, preferred_login_hour = ?, trusted_devices = ?, sample_count = ? WHERE id = ?',
                    [newAvgTyping, newAvgMouse, loginTime, JSON.stringify(devices), newCount, profile.id]
                );
            }
        } catch (error) {
            console.error('🔴 [BehaviorService] updateProfile error:', error.message);
        }
    }

    async calculateRisk(userId, currentBehavior) {
        const { typingSpeed, mouseVelocity, loginTime, deviceInfo, sampleSize } = currentBehavior;
        try {
            const [profiles] = await pool.query('SELECT * FROM user_behavioral_profiles WHERE user_id = ?', [userId]);
            if (profiles.length === 0) return 0;

            const profile = profiles[0];
            let risk = 0;

            let trustedDevices = [];
            try {
                trustedDevices = typeof profile.trusted_devices === 'string' ? JSON.parse(profile.trusted_devices) : profile.trusted_devices;
            } catch (e) { trustedDevices = [profile.trusted_devices]; }

            if (!Array.isArray(trustedDevices)) trustedDevices = [];
            if (!trustedDevices.includes(deviceInfo)) risk += 40;

            if (sampleSize >= 3) {
                const profileAvg = Number(profile.avg_typing_speed);
                if (profileAvg > 0) {
                    const typingDeviation = Math.abs(typingSpeed - profileAvg) / profileAvg;
                    if (typingDeviation > 0.35) risk += Math.min(30, typingDeviation * 100 * 0.5);
                }
            }

            // Mouse Movement Velocity
            const profileMouseAvg = Number(profile.avg_mouse_velocity);
            if (profileMouseAvg > 0) {
                const mouseDeviation = Math.abs(mouseVelocity - profileMouseAvg) / profileMouseAvg;
                if (mouseDeviation > 0.45) risk += Math.min(50, mouseDeviation * 100 * 0.5);
            }

            return Math.round(Math.min(risk, 100));
        } catch (error) {
            console.error('🔴 [BehaviorService] calculateRisk error:', error.message);
            return 0;
        }
    }

    async analyzeWithAi(userId, behavior, baseRiskScore) {
        try {
            const [profiles] = await pool.query('SELECT * FROM user_behavioral_profiles WHERE user_id = ?', [userId]);
            if (profiles.length === 0) return baseRiskScore;

            const systemPrompt = `Analyze risk for User ${userId}. Base Risk: ${baseRiskScore}. Respond ONLY with JSON: {"adjusted_risk": number}`;
            const aiResponse = await llmService.generateResponse(systemPrompt, [], {}, 1);

            // Extracts JSON from Gemini's response string
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error("No JSON found");

            const result = JSON.parse(jsonMatch[0]);
            return Number(result.adjusted_risk) || baseRiskScore;
        } catch (error) {
            console.warn(`⚠️ [AI Analysis] Falling back to base: ${error.message}`);
            return baseRiskScore;
        }
    }
}

module.exports = new BehaviorService();