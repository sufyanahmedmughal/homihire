import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { getAllUsers, blockUser } from '../services/adminService';
import ConfirmActionModal from '../components/ConfirmActionModal';
import toast from 'react-hot-toast';
import './TableStyles.css';

export default function UsersListPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hasMore, setHasMore] = useState(false);
    const [nextCursor, setNextCursor] = useState(null);

    // Filters
    const [statusFilter, setStatusFilter] = useState('');

    // Modals
    const [blockModal, setBlockModal] = useState({ isOpen: false, user: null });
    const [actionLoading, setActionLoading] = useState(false);

    const loadUsers = async (cursor = null, append = false) => {
        try {
            if (!cursor) setLoading(true);
            const res = await getAllUsers({ cursor, limit: 15, status: statusFilter });
            setUsers(prev => append ? [...prev, ...res.users] : res.users);
            setHasMore(res.pagination.has_more);
            setNextCursor(res.pagination.next_cursor);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    // Reload when filters change
    useEffect(() => { loadUsers(); }, [statusFilter]);

    const openBlock = (user) => setBlockModal({ isOpen: true, user });

    const handleBlock = async () => {
        const { user } = blockModal;
        setActionLoading(true);
        try {
            await blockUser(user._id);
            toast.success(`User ${user.name} blocked.`);
            // Update UI list
            setUsers(prev => prev.map(u => u._id === user._id ? { ...u, status: 'blocked' } : u));
            setBlockModal({ isOpen: false, user: null });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to block user');
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <AdminLayout title="User Management">
            <div className="table-container">
                <div className="table-header">
                    <h2>All Users</h2>
                    <p>Manage all registered customers on the platform.</p>
                </div>

                <div className="table-filters">
                    <select
                        className="table-filter-select"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="blocked">Blocked</option>
                    </select>
                </div>

                {loading && !users.length ? (
                    <div className="table-empty">
                        <span className="spinner" style={{ width: 32, height: 32 }} />
                        <p>Loading users...</p>
                    </div>
                ) : users.length === 0 ? (
                    <div className="table-empty">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <line x1="23" y1="11" x2="17" y2="11" />
                            <line x1="23" y1="7" x2="23" y2="15" />
                        </svg>
                        <p>No users match the current filters.</p>
                    </div>
                ) : (
                    <>
                        <div className="table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>User</th>
                                        <th>Contact</th>
                                        <th>Location</th>
                                        <th>Status</th>
                                        <th>Registered</th>
                                        <th className="align-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(user => (
                                        <tr key={user._id}>
                                            <td>
                                                <div className="td-user">
                                                    <div className="td-avatar">
                                                        {user.profile_picture ? (
                                                            <img src={user.profile_picture} alt="" />
                                                        ) : (<span>{user.name[0]}</span>)}
                                                    </div>
                                                    <div className="td-user-info">
                                                        <span className="td-name">{user.name}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{user.phone}</td>
                                            <td>
                                                {user.location?.coordinates
                                                    ? `${user.location.coordinates[1].toFixed(2)}°N, ${user.location.coordinates[0].toFixed(2)}°E`
                                                    : 'Not Set'}
                                            </td>
                                            <td>
                                                <span className={`wdm-status-badge wdm-status-${user.status === 'active' ? 'approved' : user.status}`} style={{display:'inline-block'}}>
                                                    ● {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                                                </span>
                                            </td>
                                            <td>{new Date(user.createdAt).toLocaleDateString('en-PK')}</td>
                                            <td className="align-right">
                                                <div className="td-actions">
                                                    {user.status !== 'blocked' && (
                                                        <button className="btn-icon btn-icon-block" onClick={() => openBlock(user)} title="Block User">
                                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <circle cx="12" cy="12" r="10" />
                                                                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {hasMore && (
                            <div className="table-pagination">
                                <button className="btn-load-more" onClick={() => loadUsers(nextCursor, true)} disabled={loading}>
                                    {loading ? 'Loading...' : 'Load More Results'}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            <ConfirmActionModal
                isOpen={blockModal.isOpen}
                title="Block User"
                description={`Are you sure you want to block ${blockModal.user?.name}? They will lose access to the platform immediately.`}
                variant="block"
                requireText={false}
                onConfirm={handleBlock}
                onCancel={() => !actionLoading && setBlockModal({ isOpen: false, user: null })}
                loading={actionLoading}
            />
        </AdminLayout>
    );
}
