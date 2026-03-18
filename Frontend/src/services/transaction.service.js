import api from './api';

export const getBalance = async () => {
    const response = await api.get('/accounts/me');
    return { data: { balance: parseFloat(response.data.data.balance || 0) } };
};

export const getHistory = async () => {
    const response = await api.get('/transactions/history');
    // Map data to match frontend expectations (id, type, amount, date)
    const transactions = response.data.data.map(tx => ({
        id: tx.id,
        type: tx.type,
        amount: parseFloat(tx.amount),
        date: tx.created_at
    }));
    return { data: { transactions } };
};

export const deposit = async (amount) => {
    const response = await api.post('/transactions/deposit', { amount: parseFloat(amount) });
    return {
        data: {
            message: 'Deposit successful',
            balance: response.data.data.newBalance,
            transaction: {
                id: response.data.data.transactionId,
                type: response.data.data.type,
                amount: parseFloat(response.data.data.amount),
                date: new Date().toISOString()
            }
        }
    };
};

export const withdraw = async (amount) => {
    const response = await api.post('/transactions/withdraw', { amount: parseFloat(amount) });
    return {
        data: {
            message: 'Withdrawal successful',
            balance: response.data.data.newBalance,
            transaction: {
                id: response.data.data.transactionId,
                type: response.data.data.type,
                amount: parseFloat(response.data.data.amount),
                date: new Date().toISOString()
            }
        }
    };
};
