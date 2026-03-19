import { AnimatePresence, motion } from 'framer-motion';

/**
 * Confirmation Modal
 * Props: isOpen, title, message, onConfirm, onCancel, confirmLabel, confirmClass, icon
 */
const ConfirmModal = ({
    isOpen,
    title = 'Are you sure?',
    message,
    onConfirm,
    onCancel,
    confirmLabel = 'Confirm',
    confirmClass = 'btn-danger',
    icon,
    loading = false,
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="modal-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onCancel}
                >
                    <motion.div
                        className="modal-card"
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                        onClick={e => e.stopPropagation()}
                    >
                        {icon && (
                            <div className="modal-icon flex-center" style={{ marginBottom: '1rem' }}>
                                <div style={{
                                    width: 60, height: 60, borderRadius: '50%',
                                    background: 'rgba(248,113,113,0.12)',
                                    border: '1px solid rgba(248,113,113,0.25)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: 'var(--danger)'
                                }}>
                                    {icon}
                                </div>
                            </div>
                        )}
                        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', textAlign: 'center' }}>
                            {title}
                        </h3>
                        {message && (
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', marginBottom: '0.25rem', lineHeight: 1.6 }}>
                                {message}
                            </p>
                        )}
                        <div className="modal-actions">
                            <button className="btn btn-ghost flex-1" onClick={onCancel} disabled={loading}>
                                Cancel
                            </button>
                            <motion.button
                                className={`btn ${confirmClass} flex-1`}
                                onClick={onConfirm}
                                disabled={loading}
                                whileTap={{ scale: 0.96 }}
                                whileHover={{ scale: 1.02 }}
                            >
                                {loading ? (
                                    <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                                ) : confirmLabel}
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ConfirmModal;
