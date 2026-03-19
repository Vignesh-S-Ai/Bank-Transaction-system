const pool = require('../config/db');

class TransactionService {
    static async depositMoney(userId, amount, idempotencyKey) {
        if (!idempotencyKey) throw new Error('HEADER_MISSING_IDEMPOTENCY');

        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            // 1. Idempotency Check
            const [existingTx] = await connection.query(
                'SELECT idempotency_key, status, amount FROM transactions WHERE idempotency_key = ?',
                [idempotencyKey]
            );
            if (existingTx.length > 0) {
                await connection.rollback();
                return { status: existingTx[0].status, cached: true, amount: existingTx[0].amount };
            }

            // 2. Lock Row for Update
            const [accounts] = await connection.query(
                'SELECT id, balance FROM accounts WHERE user_id = ? FOR UPDATE',
                [userId]
            );

            if (accounts.length === 0) {
                throw new Error('Account not found');
            }

            const account = accounts[0];
            const newBalance = parseFloat(account.balance) + parseFloat(amount);

            // 3. Update Balance
            await connection.query('UPDATE accounts SET balance = ? WHERE id = ?', [newBalance, account.id]);

            // 4. Record new transaction with state
            const [transaction] = await connection.query(
                `INSERT INTO transactions (account_id, type, amount, status, idempotency_key) 
                 VALUES (?, 'DEPOSIT', ?, 'SUCCESS', ?)`,
                [account.id, amount, idempotencyKey]
            );

            // 5. Audit Log (JPMC Standard)
            await connection.query(
                'INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)',
                [userId, 'DEPOSIT', JSON.stringify({ amount, transactionId: transaction.insertId, method: 'API' })]
            );

            await connection.commit();

            return {
                transactionId: transaction.insertId,
                status: 'SUCCESS',
                newBalance,
                amount
            };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async withdrawMoney(userId, amount, idempotencyKey) {
        if (!idempotencyKey) throw new Error('HEADER_MISSING_IDEMPOTENCY');

        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            // 1. Idempotency Check
            const [existingTx] = await connection.query(
                'SELECT idempotency_key, status, amount FROM transactions WHERE idempotency_key = ?',
                [idempotencyKey]
            );
            if (existingTx.length > 0) {
                await connection.rollback();
                return { status: existingTx[0].status, cached: true, amount: existingTx[0].amount };
            }

            // 2. Lock Row (Critical for preventing dirty reads / negative balance races)
            const [accounts] = await connection.query(
                'SELECT id, balance FROM accounts WHERE user_id = ? FOR UPDATE',
                [userId]
            );

            if (accounts.length === 0) {
                throw new Error('Account not found');
            }

            const account = accounts[0];
            const currentBalance = parseFloat(account.balance);
            const withdrawalAmount = parseFloat(amount);

            if (currentBalance < withdrawalAmount) {
                // Keep record of FAILED attempt
                await connection.query(
                    `INSERT INTO transactions (account_id, type, amount, status, idempotency_key) 
                     VALUES (?, 'WITHDRAWAL', ?, 'FAILED', ?)`,
                    [account.id, amount, idempotencyKey]
                );

                await connection.query(
                    'INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)',
                    [userId, 'WITHDRAWAL_FAILED_NSF', JSON.stringify({ attemptedAmount: amount, available: currentBalance })]
                );

                await connection.commit();
                throw new Error('Insufficient funds');
            }

            const newBalance = currentBalance - withdrawalAmount;

            // 3. Save Execution
            await connection.query('UPDATE accounts SET balance = ? WHERE id = ?', [newBalance, account.id]);

            const [transaction] = await connection.query(
                `INSERT INTO transactions (account_id, type, amount, status, idempotency_key) 
                 VALUES (?, 'WITHDRAWAL', ?, 'SUCCESS', ?)`,
                [account.id, amount, idempotencyKey]
            );

            await connection.query(
                'INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)',
                [userId, 'WITHDRAWAL', JSON.stringify({ amount, transactionId: transaction.insertId })]
            );

            await connection.commit();

            return {
                transactionId: transaction.insertId,
                status: 'SUCCESS',
                newBalance,
                amount
            };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async transferMoney(senderUserId, receiverAccountId, amount, idempotencyKey) {
        if (!idempotencyKey) throw new Error('HEADER_MISSING_IDEMPOTENCY');
        if (parseFloat(amount) <= 0) throw new Error('Invalid transfer amount');

        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            const [existingTx] = await connection.query(
                'SELECT status FROM transactions WHERE idempotency_key = ?',
                [idempotencyKey]
            );
            if (existingTx.length > 0) {
                await connection.rollback();
                return { status: existingTx[0].status, cached: true };
            }

            const [senderRows] = await connection.query('SELECT id FROM accounts WHERE user_id = ?', [senderUserId]);
            if (!senderRows.length) throw new Error('Sender account not found');
            const senderId = senderRows[0].id;

            if (senderId === parseInt(receiverAccountId)) throw new Error('Cannot transfer to same account');

            const firstLockId = senderId < receiverAccountId ? senderId : receiverAccountId;
            const secondLockId = senderId > receiverAccountId ? senderId : receiverAccountId;

            const [lockedAccounts] = await connection.query(
                'SELECT id, balance FROM accounts WHERE id IN (?, ?) FOR UPDATE',
                [firstLockId, secondLockId]
            );

            if (lockedAccounts.length !== 2) throw new Error('Receiver account invalid');

            const senderAcc = lockedAccounts.find(a => a.id === senderId);
            const receiverAcc = lockedAccounts.find(a => a.id === parseInt(receiverAccountId));

            if (parseFloat(senderAcc.balance) < parseFloat(amount)) {
                await connection.rollback();
                throw new Error('Insufficient funds');
            }

            const senderNewBalance = parseFloat(senderAcc.balance) - parseFloat(amount);
            const receiverNewBalance = parseFloat(receiverAcc.balance) + parseFloat(amount);

            await connection.query('UPDATE accounts SET balance = ? WHERE id = ?', [senderNewBalance, senderId]);
            await connection.query('UPDATE accounts SET balance = ? WHERE id = ?', [receiverNewBalance, receiverAccountId]);

            const [txSender] = await connection.query(
                `INSERT INTO transactions (account_id, type, amount, status, idempotency_key) VALUES (?, 'TRANSFER', ?, 'SUCCESS', ?)`,
                [senderId, amount, idempotencyKey]
            );
            await connection.query(
                `INSERT INTO transactions (account_id, type, amount, status, idempotency_key) VALUES (?, 'TRANSFER', ?, 'SUCCESS', ?)`,
                [receiverAccountId, amount, `${idempotencyKey}-rx`]
            );

            await connection.query(
                'INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)',
                [senderUserId, 'TRANSFER_SUCCESS', JSON.stringify({ amount, to: receiverAccountId, txId: txSender.insertId })]
            );

            await connection.commit();
            return { transactionId: txSender.insertId, newBalance: senderNewBalance, amount };

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async getHistory(userId) {
        // Just fetching via pool
        const [accounts] = await pool.query('SELECT id FROM accounts WHERE user_id = ?', [userId]);
        if (accounts.length === 0) throw new Error('Account not found');

        const [transactions] = await pool.query(
            'SELECT * FROM transactions WHERE account_id = ? ORDER BY created_at DESC LIMIT 100', // Basic pagination concept
            [accounts[0].id]
        );
        return transactions;
    }
}

module.exports = TransactionService;
