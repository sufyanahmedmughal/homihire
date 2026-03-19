import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import WorkerDetailModal from '../components/WorkerDetailModal';
import ApproveRejectModal from '../components/ApproveRejectModal';
import { getPendingWorkers, approveWorker, rejectWorker } from '../services/adminService';
import { showToast } from '../components/Toast';
import './PendingWorkersPage.css';

export default function PendingWorkersPage() {
    const [workers,     setWorkers]     = useState([]);
    const [loading,     setLoading]     = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore,     setHasMore]     = useState(false);
    const [nextCursor,  setNextCursor]  = useState(null);
    const [viewWorker,  setViewWorker]  = useState(null);
    const [actionModal, setActionModal] = useState(null); // { mode, worker }

    /* ── Load ── */
    const load = useCallback(async (cursor = null) => {
        cursor ? setLoadingMore(true) : setLoading(true);
        try {
            const data = await getPendingWorkers({ limit: 12, cursor });
            const list = data.workers || [];
            setWorkers(prev => cursor ? [...prev, ...list] : list);
            setHasMore(data.pagination?.has_more ?? false);
            setNextCursor(data.pagination?.next_cursor ?? null);
        } catch (err) {
            showToast(err?.response?.data?.error || 'Failed to load pending workers.', 'error');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    /* ── Actions ── */
    const handleApproveConfirm = async (note) => {
        await approveWorker(actionModal.worker._id, note);
        showToast(`${actionModal.worker.name} approved successfully.`, 'success');
        setWorkers(prev => prev.filter(w => w._id !== actionModal.worker._id));
        setActionModal(null);
        setViewWorker(null);
    };

    const handleRejectConfirm = async (reason) => {
        await rejectWorker(actionModal.worker._id, reason);
        showToast(`${actionModal.worker.name} rejected.`, 'warning');
        setWorkers(prev => prev.filter(w => w._id !== actionModal.worker._id));
        setActionModal(null);
        setViewWorker(null);
    };

    const initials = (name) =>
        name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : 'W';

    const fmt = (date) =>
        date ? new Date(date).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

    return (
        <Layout pendingCount={workers.length}>
            <div className="pw-page">
                {/* Header */}
                <div className="pw-header">
                    <div className="pw-header-left">
                        <h1 className="pw-page-title">Pending Approval</h1>
                        <p className="pw-page-sub">Review worker registrations — approve or reject with a reason.</p>
                    </div>
                    {!loading && (
                        <div className="pw-count-badge">
                            ⏳ {workers.length} Pending{hasMore ? '+' : ''}
                        </div>
                    )}
                </div>

                {/* Loading skeleton */}
                {loading && (
                    <div className="pw-skeleton-grid">
                        {[1,2,3,4,5,6].map(i => (
                            <div key={i} className="pw-skeleton-card" />
                        ))}
                    </div>
                )}

                {/* Empty state */}
                {!loading && workers.length === 0 && (
                    <div className="pw-empty">
                        <div className="pw-empty-icon">🎉</div>
                        <div className="pw-empty-title">All caught up!</div>
                        <div className="pw-empty-sub">No pending worker registrations at this time.</div>
                    </div>
                )}

                {/* Cards grid */}
                {!loading && workers.length > 0 && (
                    <div className="pw-grid">
                        {workers.map(w => (
                            <div key={w._id} className="pw-card" onClick={() => setViewWorker(w)}>
                                <div className="pw-card-top">
                                    <div className="pw-card-avatar">
                                        {w.selfie_url
                                            ? <img src={w.selfie_url} alt={w.name} />
                                            : initials(w.name)
                                        }
                                    </div>
                                    <div className="pw-card-info">
                                        <div className="pw-card-name">{w.name}</div>
                                        <div className="pw-card-phone">📞 {w.phone}</div>
                                        <div className="pw-card-meta">
                                            {(w.skills || []).slice(0, 3).map(s => (
                                                <span key={s} className="pw-card-skill">{s}</span>
                                            ))}
                                            {(w.skills?.length ?? 0) > 3 && (
                                                <span className="pw-card-skill">+{w.skills.length - 3}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="pw-card-body">
                                    <div className="pw-card-row">
                                        <span className="pw-card-row-label">CNIC</span>
                                        <span className="pw-card-row-val" style={{ fontFamily: 'monospace', fontSize: '11px' }}>{w.cnic}</span>
                                    </div>
                                    <div className="pw-card-row">
                                        <span className="pw-card-row-label">Base Fee</span>
                                        <span className="pw-card-row-val">PKR {(w.fee || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="pw-card-row">
                                        <span className="pw-card-row-label">Registered</span>
                                        <span className="pw-card-row-val">{fmt(w.created_at)}</span>
                                    </div>
                                </div>
                                <div className="pw-card-footer" onClick={e => e.stopPropagation()}>
                                    <button
                                        id={`pw-view-${w._id}`}
                                        className="pw-btn pw-btn-view"
                                        onClick={() => setViewWorker(w)}
                                    >
                                        View
                                    </button>
                                    <button
                                        id={`pw-approve-${w._id}`}
                                        className="pw-btn pw-btn-approve"
                                        onClick={() => setActionModal({ mode: 'approve', worker: w })}
                                    >
                                        ✓ Approve
                                    </button>
                                    <button
                                        id={`pw-reject-${w._id}`}
                                        className="pw-btn pw-btn-reject"
                                        onClick={() => setActionModal({ mode: 'reject', worker: w })}
                                    >
                                        ✕ Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Load more */}
                {hasMore && !loading && (
                    <div className="pw-pagination">
                        <button
                            id="pw-load-more-btn"
                            className="pw-load-more-btn"
                            onClick={() => load(nextCursor)}
                            disabled={loadingMore}
                        >
                            {loadingMore
                                ? <><span className="arm-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Loading…</>
                                : 'Load More'}
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
                    onReject={(w)  => setActionModal({ mode: 'reject',  worker: w })}
                    onBlock={() => {}}
                />
            )}

            {/* Approve / Reject confirm */}
            {actionModal && (
                <ApproveRejectModal
                    mode={actionModal.mode}
                    target={actionModal.worker}
                    onConfirm={actionModal.mode === 'approve' ? handleApproveConfirm : handleRejectConfirm}
                    onCancel={() => setActionModal(null)}
                />
            )}
        </Layout>
    );
}
