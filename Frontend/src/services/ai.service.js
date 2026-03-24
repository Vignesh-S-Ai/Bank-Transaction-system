import api from './api';

export const sendAIChat = async (message, history, context) => {
    try {
        const response = await api.post('/ai/chat', {
            message,
            history,
            context
        });
        return response.data;
    } catch (error) {
        console.error("AI Chat Error:", error);
        throw error;
    }
};
