import api from './api';

export const getUserProfile = () => {
    return api.get('/user/profile');
};

export const updateUserProfile = (profileData) => {
    return api.put('/user/profile', profileData);
};

export const changePassword = (passwordData) => {
    return api.put('/user/change-password', passwordData);
};
