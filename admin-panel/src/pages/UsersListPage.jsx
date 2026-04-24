import { useState, useEffect, useCallback, useRef } from 'react';
import Layout from '../components/Layout';
import ApproveRejectModal from '../components/ApproveRejectModal';
import { getUsers, blockUser } from '../services/adminService';
import { showToast } from '../components/Toast';
import './ListPage.css';

export default function UsersListPage() {
    const [users,       setUsers]       = useState([]);
    const [loading,     setLoading]     = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore,     setHasMore]     = useState(false);
    const [nextCursor,  setNextCursor]  = useState(null);
    const [statusFilter, setStatusFilter] = useState('');
    const [search,      setSearch]      = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [blockTarget, setBlockTarget] = useState(null);
    const searchTimer = useRef(null);

    /* ── Load ── */
    const load = useCallback(async (cursor = null, s = search, st = statusFilter) => {
        cursor ? setLoadingMore(true) : setLoading(true);
        try {
            const data = await getUsers({ limit: 20, cursor, status: st || undefined, search: s || undefined });
            const list = data.users || [];
            setUsers(prev => cursor ? [...prev, ...list] : list);
            setHasMore(data.pagination?.has_more ?? false);
            setNextCursor(data.pagination?.next_cursor ?? null);
        } catch (err) {
            showToast(err?.response?.data?.error || 'Failed to load users.', 'error');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [search, statusFilter]);

    useEffect(() => { load(null, search, statusFilter); }, [statusFilter]);

    /* Debounced search */
    const handleSearchChange = (val) => {
        setSearchInput(val);
        clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => {
            setSearch(val);
            load(null, val, statusFilter);
        }, 400);
    };

    /* ── Block user ── */
    const handleBlockConfirm = async () => {
        await blockUser(blockTarget._id);
        showToast(`${blockTarget.name} has been blocked.`, 'warning');
        setUsers(prev => prev.map(u => u._id === blockTarget._id ? { ...u, status: 'blocked' } : u));
        setBlockTarget(null);
    };

    /* ── Helpers ── */
    const initials = (name) =>
        name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : 'U';

    const fmt = (date) =>
        date ? new Date(date).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

    return (
        <Layout>
            <div className="list-page">
                {/* Header */}
                <div className="list-page-header">
                    <div>
                        <h1 className="list-page-title">All Users</h1>
                        <p className="list-page-sub">View, search and manage platform users. Block accounts if needed.</p>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="list-toolbar">
                    <div className="list-search-wrap">
                        <span className="list-search-icon">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                        </span>
                        <input
                            id="users-search-input"
                            className="list-search-input"
                            type="text"
                            placeholder="Search by name or phone…"
                            value={searchInput}
                            onChange={e => handleSearchChange(e.target.value)}
                        />
                    </div>
                    <select
                        id="users-status-filter"
                        className="list-filter-select"
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                    >
                        <option value="">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="blocked">Blocked</option>
                    </select>
                </div>

                {/* Table */}
                <div className="list-table-wrap">
                    {loading ? (
                        <div className="list-loading-rows">
                            {[1,2,3,4,5,6,7].map(i => <div key={i} className="list-skeleton-row" />)}
                        </div>
                    ) : users.length === 0 ? (
                        <div className="list-empty">No users found matching your filters.</div>
                    ) : (
                        <table className="list-table">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Status</th>
                                    <th>Firebase Verified</th>
                                    <th>Registered</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u._id}>
                                        <td>
                                            <div className="list-person-cell">
                                                <div className="list-avatar">
                                                    {u.profile_picture
                                                        ? <img src={u.profile_picture} alt={u.name} />
                                                        : initials(u.name)
                                                    }
                                                </div>
                                                <div>
                                                    <div className="list-person-name">{u.name}</div>
                                                    <div className="list-person-phone">{u.phone}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`list-badge ${u.status}`}>
                                                {u.status === 'active' ? '● Active' : '■ Blocked'}
                                            </span>
                                        </td>
                                        <td style={{ color: u.firebase_phone_verified ? '#6ee7b7' : 'var(--text-muted)', fontSize: '12px' }}>
                                            {u.firebase_phone_verified ? '✓ Verified' : '— Not verified'}
                                        </td>
                                        <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{fmt(u.registered_at)}</td>
                                        <td>
                                            <div className="list-action-cell">
                                                {u.status === 'blocked' ? (
                                                    <span className="list-btn list-btn-already-blocked">🚫 Blocked</span>
                                                ) : (
                                                    <button
                                                        id={`users-block-${u._id}`}
                                                        className="list-btn list-btn-block"
                                                        onClick={() => setBlockTarget(u)}
                                                    >
                                                        🚫 Block
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Load more */}
                {hasMore && !loading && (
                    <div className="list-pagination">
                        <button
                            id="users-load-more-btn"
                            className="list-load-more-btn"
                            onClick={() => load(nextCursor)}
                            disabled={loadingMore}
                        >
                            {loadingMore ? 'Loading…' : 'Load More'}
                        </button>
                    </div>
                )}
            </div>

            {/* Block confirm modal */}
            {blockTarget && (
                <ApproveRejectModal
                    mode="block-user"
                    target={blockTarget}
                    onConfirm={handleBlockConfirm}
                    onCancel={() => setBlockTarget(null)}
                />
            )}
        </Layout>
    );
}
