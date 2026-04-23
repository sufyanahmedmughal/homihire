import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import WorkerDetailModal from '../components/WorkerDetailModal';
import ApproveRejectModal from '../components/ApproveRejectModal';
import { getWorkers, getWorkerById, blockWorker, approveWorker, rejectWorker } from '../services/adminService';
import { showToast } from '../components/Toast';
import './ListPage.css';

const SKILLS = ['Cleaning', 'Plumbing', 'Electrical', 'Carpentry', 'Building / Construction', 'Repairing / Maintenance'];

export default function WorkersListPage() {
    const [workers, setWorkers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [nextCursor, setNextCursor] = useState(null);
    const [statusFilter, setStatusFilter] = useState('');
    const [skillFilter, setSkillFilter] = useState('');
    const [viewWorker, setViewWorker] = useState(null);
    const [viewLoading, setViewLoading] = useState(false);
    const [actionModal, setActionModal] = useState(null); // { mode, worker }

    /* ── Load ── */
    const load = useCallback(async (cursor = null, st = statusFilter, sk = skillFilter) => {
        cursor ? setLoadingMore(true) : setLoading(true);
        try {
            const data = await getWorkers({ limit: 20, cursor, status: st || undefined, skill: sk || undefined });
            const list = data.workers || [];
            setWorkers(prev => cursor ? [...prev, ...list] : list);
            setHasMore(data.pagination?.has_more ?? false);
            setNextCursor(data.pagination?.next_cursor ?? null);
        } catch (err) {
            showToast(err?.response?.data?.error || 'Failed to load workers.', 'error');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [statusFilter, skillFilter]);

    /* ── View full worker details (fetches rejection_reason etc.) ── */
    const handleViewWorker = async (w) => {
        setViewLoading(true);
        try {
            const full = await getWorkerById(w._id);
            setViewWorker(full);
        } catch {
            // fallback to list data if individual fetch fails
            setViewWorker(w);
        } finally {
            setViewLoading(false);
        }
    };

    useEffect(() => { load(null, statusFilter, skillFilter); }, [statusFilter, skillFilter]);

    /* ── Actions ── */
    const handleApproveConfirm = async (note) => {
        await approveWorker(actionModal.worker._id, note);
        showToast(`${actionModal.worker.name} approved.`, 'success');
        setWorkers(prev => prev.map(w => w._id === actionModal.worker._id ? { ...w, status: 'approved' } : w));
        setActionModal(null);
        setViewWorker(null);
    };

    const handleRejectConfirm = async (reason) => {
        await rejectWorker(actionModal.worker._id, reason);
        showToast(`${actionModal.worker.name} rejected.`, 'warning');
        setWorkers(prev => prev.map(w => w._id === actionModal.worker._id ? { ...w, status: 'rejected', rejection_reason: reason } : w));
        setActionModal(null);
        setViewWorker(null);
    };

    const handleBlockConfirm = async () => {
        await blockWorker(actionModal.worker._id);
        showToast(`${actionModal.worker.name} has been blocked. Active jobs set to worker_removed.`, 'warning');
        setWorkers(prev => prev.map(w => w._id === actionModal.worker._id ? { ...w, status: 'blocked' } : w));
        setActionModal(null);
        setViewWorker(null);
    };

    /* ── Helpers ── */
    const initials = (name) =>
        name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : 'W';

    const fmt = (date) =>
        date ? new Date(date).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

    const getConfirmHandler = () => {
        if (actionModal?.mode === 'approve') return handleApproveConfirm;
        if (actionModal?.mode === 'reject') return handleRejectConfirm;
        if (actionModal?.mode === 'block-worker') return handleBlockConfirm;
        return () => { };
    };

    return (
        <Layout pendingCount={workers.filter(w => w.status === 'pending').length}>
            <div className="list-page">
                {/* Header */}
                <div className="list-page-header">
                    <div>
                        <h1 className="list-page-title">All Workers</h1>
                        <p className="list-page-sub">Filter by status or skill. Approve, reject, or block workers from here.</p>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="list-toolbar">
                    <select
                        id="workers-status-filter"
                        className="list-filter-select"
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                    >
                        <option value="">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="blocked">Blocked</option>
                    </select>
                    <select
                        id="workers-skill-filter"
                        className="list-filter-select"
                        value={skillFilter}
                        onChange={e => setSkillFilter(e.target.value)}
                    >
                        <option value="">All Skills</option>
                        {SKILLS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>

                {/* Table */}
                <div className="list-table-wrap">
                    {loading ? (
                        <div className="list-loading-rows">
                            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="list-skeleton-row" />)}
                        </div>
                    ) : workers.length === 0 ? (
                        <div className="list-empty">No workers found matching your filters.</div>
                    ) : (
                        <table className="list-table">
                            <thead>
                                <tr>
                                    <th>Worker</th>
                                    <th>CNIC</th>
                                    <th>Skills</th>
                                    <th>Fee</th>
                                    <th>Rating</th>
                                    <th>Status</th>
                                    <th>Registered</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {workers.map(w => (
                                    <tr key={w._id}>
                                        <td>
                                            <div className="list-person-cell">
                                                <div className="list-avatar">
                                                    {w.selfie_url
                                                        ? <img src={w.selfie_url} alt={w.name} />
                                                        : initials(w.name)
                                                    }
                                                </div>
                                                <div>
                                                    <div className="list-person-name">{w.name}</div>
                                                    <div className="list-person-phone">{w.phone}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td><span className="list-mono">{w.cnic}</span></td>
                                        <td>
                                            <div className="list-skills">
                                                {(w.skills || []).slice(0, 2).map(s => (
                                                    <span key={s} className="list-skill-chip">{s}</span>
                                                ))}
                                                {(w.skills?.length ?? 0) > 2 && (
                                                    <span className="list-skill-chip">+{w.skills.length - 2}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                                            PKR {(w.fee || 0).toLocaleString()}
                                        </td>
                                        <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                                            {w.rating > 0 ? `⭐ ${w.rating.toFixed(1)}` : '—'}
                                        </td>
                                        <td>
                                            <span className={`list-badge ${w.status}`}>
                                                {w.status}
                                            </span>
                                            {w.status === 'rejected' && w.rejection_reason && (
                                                <div style={{
                                                    marginTop: '4px',
                                                    fontSize: '11px',
                                                    color: 'var(--accent-red, #f87171)',
                                                    maxWidth: '160px',
                                                    lineHeight: '1.4',
                                                    opacity: 0.85,
                                                    wordBreak: 'break-word',
                                                }}>
                                                    ⚠ {w.rejection_reason}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{fmt(w.registered_at)}</td>
                                        <td>
                                            <div className="list-action-cell">
                                                <button
                                                    id={`workers-view-${w._id}`}
                                                    className="list-btn list-btn-view"
                                                    onClick={() => handleViewWorker(w)}
                                                    disabled={viewLoading}
                                                >
                                                    {viewLoading ? '…' : 'View'}
                                                </button>
                                                {w.status === 'pending' && (
                                                    <button
                                                        id={`workers-approve-${w._id}`}
                                                        className="list-btn"
                                                        style={{ background: 'rgba(16,185,129,0.1)', color: '#6ee7b7', borderColor: 'rgba(16,185,129,0.2)' }}
                                                        onClick={() => setActionModal({ mode: 'approve', worker: w })}
                                                    >
                                                        ✓
                                                    </button>
                                                )}
                                                {w.status === 'approved' && (
                                                    <button
                                                        id={`workers-block-${w._id}`}
                                                        className="list-btn list-btn-block"
                                                        onClick={() => setActionModal({ mode: 'block-worker', worker: w })}
                                                    >
                                                        🚫
                                                    </button>
                                                )}
                                                {w.status === 'blocked' && (
                                                    <span className="list-btn list-btn-already-blocked">Blocked</span>
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
                            id="workers-load-more-btn"
                            className="list-load-more-btn"
                            onClick={() => load(nextCursor)}
                            disabled={loadingMore}
                        >
                            {loadingMore ? 'Loading…' : 'Load More'}
                        </button>
                    </div>
                )}
            </div>

            {/* Worker Detail Modal */}
            {viewWorker && (
                <WorkerDetailModal
                    worker={viewWorker}
                    onClose={() => setViewWorker(null)}
                    onApprove={(w) => setActionModal({ mode: 'approve', worker: w })}
                    onReject={(w) => setActionModal({ mode: 'reject', worker: w })}
                    onBlock={(w) => setActionModal({ mode: 'block-worker', worker: w })}
                />
            )}

            {/* Action confirm modal */}
            {actionModal && (
                <ApproveRejectModal
                    mode={actionModal.mode}
                    target={actionModal.worker}
                    onConfirm={getConfirmHandler()}
                    onCancel={() => setActionModal(null)}
                />
            )}
        </Layout>
    );
}
