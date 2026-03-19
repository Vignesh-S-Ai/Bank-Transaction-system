const pool = require('../config/db');
const bcrypt = require('bcryptjs');

class UserService {
    static async getUserProfile(userId) {
        const [users] = await pool.query(
            'SELECT id, username, full_name, email, created_at FROM users WHERE id = ?',
            [userId]
        );
        if (users.length === 0) throw new Error('User not found');
        return users[0];
    }

    static async updateUserProfile(userId, { full_name, email }) {
        if (!full_name && !email) throw new Error('No data provided to update');

        let query = 'UPDATE users SET ';
        const params = [];
        if (full_name) {
            query += 'full_name = ?, ';
            params.push(full_name);
        }
        if (email) {
            query += 'email = ?, ';
            params.push(email);
        }
        query = query.slice(0, -2) + ' WHERE id = ?';
        params.push(userId);

        await pool.query(query, params);
        return await this.getUserProfile(userId);
    }

    static async changePassword(userId, currentPassword, newPassword) {
        if (!currentPassword || !newPassword) throw new Error('Current and new passwords required');

        const [users] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [userId]);
        if (users.length === 0) throw new Error('User not found');

        const isMatch = await bcrypt.compare(currentPassword, users[0].password_hash);
        if (!isMatch) throw new Error('Incorrect current password');

        const salt = await bcrypt.genSalt(10);
        const newHash = await bcrypt.hash(newPassword, salt);

        await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, userId]);
        return { message: 'Password updated successfully' };
    }
}

module.exports = UserService;
