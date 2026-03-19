const UserService = require('../services/userService');

const getProfile = async (req, res, next) => {
    try {
        const profile = await UserService.getUserProfile(req.user.id);
        res.json({ success: true, data: profile });
    } catch (err) {
        next(err);
    }
};

const updateProfile = async (req, res, next) => {
    try {
        const profile = await UserService.updateUserProfile(req.user.id, req.body);
        res.json({ success: true, data: profile });
    } catch (err) {
        next(err);
    }
};

const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const result = await UserService.changePassword(req.user.id, currentPassword, newPassword);
        res.json({ success: true, data: result });
    } catch (err) {
        res.status(400);
        next(err);
    }
};

module.exports = { getProfile, updateProfile, changePassword };
