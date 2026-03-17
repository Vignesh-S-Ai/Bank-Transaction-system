
export const login = async (email, password) => {
    // Mock login for frontend demonstration
    if (email && password) {
        return { data: { token: 'mock-jwt-token', user: { id: 1, name: 'John Doe', email } } };
    }
    // Real implementation:
    // const response = await api.post('/auth/login', { email, password });
    // return response.data;
};

export const register = async (userData) => {
    // Mock registration
    return { data: { message: 'Registration successful' } };
    // Real implementation:
    // const response = await api.post('/auth/register', userData);
    // return response.data;
};
