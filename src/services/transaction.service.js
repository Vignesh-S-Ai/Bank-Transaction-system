
// Simple mock store
let balance = 12500.00;
let transactions = [
    { id: 1, type: 'DEPOSIT', amount: 3500, date: new Date().toISOString() },
    { id: 2, type: 'WITHDRAW', amount: 500, date: new Date(Date.now() - 86400000).toISOString() },
    { id: 3, type: 'DEPOSIT', amount: 1500, date: new Date(Date.now() - 86400000 * 2).toISOString() }
];

export const getBalance = async () => {
    return { data: { balance } };
};

export const getHistory = async () => {
    return { data: { transactions } };
};

export const deposit = async (amount) => {
    balance += parseFloat(amount);
    const newTx = { id: Date.now(), type: 'DEPOSIT', amount: parseFloat(amount), date: new Date().toISOString() };
    transactions = [newTx, ...transactions];
    return { data: { message: 'Deposit successful', balance, transaction: newTx } };
};

export const withdraw = async (amount) => {
    if (balance >= parseFloat(amount)) {
        balance -= parseFloat(amount);
        const newTx = { id: Date.now(), type: 'WITHDRAW', amount: parseFloat(amount), date: new Date().toISOString() };
        transactions = [newTx, ...transactions];
        return { data: { message: 'Withdrawal successful', balance, transaction: newTx } };
    } else {
        throw new Error('Insufficient funds');
    }
};
