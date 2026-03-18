import api from './api';

export const login = async (email, password) => {
    // We map frontend "email" to backend "username" because the frontend might use email/username interchangeably
    const response = await api.post('/auth/login', { username: email, password });
    if (response.data.success && response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data));
    }
    return response;
};

export const register = async (userData) => {
    // Map email from frontend to username in backend
    const payload = {
        username: userData.email, // backend expects username
        password: userData.password,
        full_name: userData.name
    };
    const response = await api.post('/auth/register', payload);
    return response;
};

export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
};
