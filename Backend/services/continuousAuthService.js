const pool = require('../config/db');
const llmService = require('./llmService');

class ContinuousAuthService {
    /**
     * Process rolling telemetry data from active dashboard users
     * @param {number} userId 
     * @param {object} telemetry 
     */
    async analyzeTelemetry(userId, telemetry) {
        const { mouseVelocity = 0, clickCadence = 0, scrollVelocity = 0 } = telemetry;

        try {
            // Retrieve baseline profile
            const [profiles] = await pool.query('SELECT * FROM user_behavioral_profiles WHERE user_id = ?', [userId]);

            if (profiles.length === 0) return { riskScore: 0, status: 'safe' };
            const profile = profiles[0];

            let risk = 0;

            // 1. Mouse Velocity Validation (Rolling)
            const profileMouseAvg = Number(profile.avg_mouse_velocity);
            if (profileMouseAvg > 0) {
                const mouseDev = Math.abs(mouseVelocity - profileMouseAvg) / profileMouseAvg;
                // Made threshold lower for testing: if deviation > 40%, add massive risk
                if (mouseDev > 0.4) {
                    risk += 45;
                    console.log(`⚠️ [ContinuousAuth] Erratic Mouse Detected! Deviation: ${Math.round(mouseDev * 100)}%`);
                }
            }

            // 2. Click Cadence (Bot detection)
            // Lowered for testing: 80 clicks per minute is 20 clicks in 15 seconds.
            if (clickCadence > 80) {
                risk += 45;
                console.log(`⚠️ [ContinuousAuth] Erratic Clicking Detected! Cadence: ${Math.round(clickCadence)} CPM`);
            }

            // Normalize Risk
            risk = Math.round(Math.min(risk, 100));

            // Log Telemetry
            const isAnomaly = risk >= 45;
            const actionTaken = risk >= 80 ? 'SESSION_KILLED' : (risk >= 45 ? 'WARNED' : 'NONE');

            await pool.query(
                'INSERT INTO session_risk_logs (user_id, risk_score, mouse_velocity, click_cadence, scroll_velocity, is_anomaly, action_taken) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [userId, risk, mouseVelocity, clickCadence, scrollVelocity, isAnomaly, actionTaken]
            );

            // Update user profile status
            if (actionTaken === 'SESSION_KILLED') {
                await pool.query('UPDATE user_behavioral_profiles SET active_session_compromised = true, current_risk_score = ? WHERE user_id = ?', [risk, userId]);
                console.warn(`🛑 [ContinuousAuth] Session killed for User ${userId}. Risk Score: ${risk}`);
            }

            return {
                riskScore: risk,
                status: actionTaken === 'SESSION_KILLED' ? 'compromised' : 'safe',
                actionTaken
            };
        } catch (error) {
            console.error('🔴 [ContinuousAuth] analyzeTelemetry error:', error.message);
            return { riskScore: 0, status: 'safe' };
        }
    }
}

module.exports = new ContinuousAuthService();
