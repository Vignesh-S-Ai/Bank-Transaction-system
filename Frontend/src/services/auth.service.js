import api from './api';

export const login = async (email, password, behavioralData = {}) => {
    // We map frontend "email" to backend "username" because the frontend might use email/username interchangeably
    // Include behavioralData for Nova AI behavioral authentication
    const response = await api.post('/auth/login', {
        username: email,
        password,
        behavioralData
    });

    if (response.data.success && response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data));
    }
    return response.data;
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

export const sendTelemetry = async (payload) => {
    const response = await api.post('/auth/telemetry', payload);
    return response.data;
};

export const verifyOtp = async (tempToken, otp) => {
    try {
        console.log('Sending OTP Payload:', { tempToken, otp });
        const response = await api.post('/auth/verify-otp', { tempToken, otp });
        console.log('OTP Response:', response.data);
        if (response.data.success && response.data.token) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.data));
        }
        return response.data;
    } catch (error) {
        console.error('OTP API Call Failed:', error);
        console.error('Response Data:', error.response?.data);
        throw error;
    }
};
