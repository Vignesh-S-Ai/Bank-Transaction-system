import { motion } from 'framer-motion';
import { Key, ShieldCheck, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { changePassword, getUserProfile, updateUserProfile } from '../services/user.service';
import { cardSlideUp, pageTransition } from '../utils/animations';

const Profile = () => {
    const [profile, setProfile] = useState({ username: '', full_name: '', email: '', created_at: '' });
    const [loading, setLoading] = useState(true);

    // Edit state
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({ full_name: '', email: '' });
    const [editLoading, setEditLoading] = useState(false);

    // Password state
    const [passData, setPassData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [passLoading, setPassLoading] = useState(false);
    const [isShaking, setIsShaking] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const { data } = await getUserProfile();
            setProfile(data.data);
            setEditData({ full_name: data.data.full_name || '', email: data.data.email || '' });
        } catch (err) {
            toast.error('Failed to load profile.');
        } finally {
            setLoading(false);
        }
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setEditLoading(true);
        try {
            const { data } = await updateUserProfile(editData);
            setProfile(data.data);
            setIsEditing(false);
            // Updating local storage user name representation quickly
            const userStore = JSON.parse(localStorage.getItem('user'));
            if (userStore) {
                userStore.full_name = data.data.full_name;
                localStorage.setItem('user', JSON.stringify(userStore));
            }
            toast.success('Profile metrics updated securely.', { theme: 'dark' });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setEditLoading(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (passData.newPassword !== passData.confirmPassword) {
            toast.warning('Cryptographic passkeys do not match.');
            triggerShake();
            return;
        }

        setPassLoading(true);
        try {
            await changePassword({ currentPassword: passData.currentPassword, newPassword: passData.newPassword });
            toast.success('Security matrix updated. Password changed.', { theme: 'dark' });
            setPassData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Authentication error.');
            triggerShake();
        } finally {
            setPassLoading(false);
        }
    };

    const triggerShake = () => {
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 400);
    };

    if (loading) return <div className="loader mt-4">Syncing Profile Metrics...</div>;

    return (
        <motion.div className="dashboard-page" initial="initial" animate="animate" exit="exit" variants={pageTransition}>
            <motion.header className="page-header" variants={cardSlideUp}>
                <h1>Identity Matrix</h1>
                <p>Manage your central cryptographic identity and NovaBank clearance.</p>
            </motion.header>

            <div className="transactions-grid">
                {/* Profile Overview */}
                <motion.div className="card" variants={cardSlideUp}>
                    <div className="card-header border-bottom">
                        <h3>Personnel Interface</h3>
                        <User className="text-primary" />
                    </div>
                    <div className="card-body">
                        {!isEditing ? (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <div className="mb-4">
                                    <label className="text-muted text-sm">Account Node ID</label>
                                    <div className="text-lg text-primary" style={{ letterSpacing: '1px' }}>@{profile.username}</div>
                                </div>
                                <div className="mb-4">
                                    <label className="text-muted text-sm">Designation</label>
                                    <div className="text-lg">{profile.full_name || 'Unassigned'}</div>
                                </div>
                                <div className="mb-4">
                                    <label className="text-muted text-sm">Comms Channel (Email)</label>
                                    <div className="text-lg">{profile.email || 'None registered'}</div>
                                </div>
                                <div className="mb-4">
                                    <label className="text-muted text-sm">Creation Timestamp</label>
                                    <div className="text-md opacity-80">{new Date(profile.created_at).toLocaleString()}</div>
                                </div>
                                <motion.button whileTap={{ scale: 0.95 }} className="btn btn-outline w-full mt-4" onClick={() => setIsEditing(true)}>
                                    Configure Identity
                                </motion.button>
                            </motion.div>
                        ) : (
                            <motion.form onSubmit={handleProfileSubmit} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <div className="form-group">
                                    <label>Designation (Full Name)</label>
                                    <input type="text" value={editData.full_name} onChange={e => setEditData({ ...editData, full_name: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Comms Channel (Email)</label>
                                    <input type="email" value={editData.email} onChange={e => setEditData({ ...editData, email: e.target.value })} required />
                                </div>
                                <div className="flex-row mt-4">
                                    <button type="button" className="btn btn-ghost" onClick={() => setIsEditing(false)}>Cancel</button>
                                    <motion.button whileTap={{ scale: 0.95 }} type="submit" className="btn btn-glow flex-1" disabled={editLoading}>
                                        {editLoading ? 'Syncing...' : 'Save Configuration'}
                                    </motion.button>
                                </div>
                            </motion.form>
                        )}
                    </div>
                </motion.div>

                {/* Password Change */}
                <motion.div
                    className="card"
                    variants={cardSlideUp}
                    animate={isShaking ? { x: [-10, 10, -10, 10, 0] } : {}}
                >
                    <div className="card-header border-bottom">
                        <h3>Security Protocol</h3>
                        <ShieldCheck className="text-success" />
                    </div>
                    <div className="card-body">
                        <form onSubmit={handlePasswordSubmit}>
                            <div className="form-group">
                                <label>Current Cryptographic Key</label>
                                <div className="input-group mt-2">
                                    <span className="input-prefix"><Key size={16} /></span>
                                    <input type="password" value={passData.currentPassword} onChange={e => setPassData({ ...passData, currentPassword: e.target.value })} required />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>New Cryptographic Key</label>
                                <div className="input-group mt-2">
                                    <span className="input-prefix"><Key size={16} className="text-primary" /></span>
                                    <input type="password" value={passData.newPassword} onChange={e => setPassData({ ...passData, newPassword: e.target.value })} minLength="6" required />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Confirm New Key</label>
                                <div className="input-group mt-2">
                                    <span className="input-prefix"><ShieldCheck size={16} className="text-success" /></span>
                                    <input type="password" value={passData.confirmPassword} onChange={e => setPassData({ ...passData, confirmPassword: e.target.value })} minLength="6" required />
                                </div>
                            </div>
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                type="submit"
                                className="btn w-full mt-4"
                                style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.5)', color: '#ef4444' }}
                                disabled={passLoading}
                            >
                                {passLoading ? 'Engaging...' : 'Rotate Security Keys'}
                            </motion.button>
                        </form>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default Profile;
