import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import WorkerDetailModal from '../components/WorkerDetailModal';
import ApproveRejectModal from '../components/ApproveRejectModal';
import { getStats, getPendingWorkers, approveWorker, rejectWorker } from '../services/adminService';
import { showToast } from '../components/Toast';
import './DashboardPage.css';

export default function DashboardPage() {
    const [stats,          setStats]          = useState(null);
    const [pendingWorkers, setPendingWorkers]  = useState([]);
    const [statsLoading,   setStatsLoading]   = useState(true);
    const [tableLoading,   setTableLoading]   = useState(true);
    const [viewWorker,     setViewWorker]      = useState(null);
    const [actionModal,    setActionModal]     = useState(null); // { mode, worker }
    const navigate = useNavigate();

    /* ── Load data ── */
    useEffect(() => {
        loadStats();
        loadPending();
    }, []);

    const loadStats = async () => {
        setStatsLoading(true);
        try {
            const data = await getStats();
            setStats(data);
        } catch {
            // silently fail — show placeholders
        } finally {
            setStatsLoading(false);
        }
    };

    const loadPending = async () => {
        setTableLoading(true);
        try {
            const data = await getPendingWorkers({ limit: 5 });
            setPendingWorkers(data.workers || []);
        } catch {
            setPendingWorkers([]);
        } finally {
            setTableLoading(false);
        }
    };

    /* ── Actions ── */
    const handleApproveConfirm = async (note) => {
        await approveWorker(actionModal.worker._id, note);
        showToast(`${actionModal.worker.name} approved successfully.`, 'success');
        setActionModal(null);
        setViewWorker(null);
        loadPending();
        loadStats();
    };

    const handleRejectConfirm = async (reason) => {
        await rejectWorker(actionModal.worker._id, reason);
        showToast(`${actionModal.worker.name} rejected.`, 'warning');
        setActionModal(null);
        setViewWorker(null);
        loadPending();
        loadStats();
    };

    /* ── Helpers ── */
    const pendingCount = stats?.total_workers?.pending ?? pendingWorkers.length;

    const initials = (name) =>
        name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : 'W';

    const fmt = (date) =>
        date ? new Date(date).toLocaleDateString('en-PK', { day: '2-digit', month: 'short' }) : '—';

    return (
        <Layout pendingCount={pendingCount}>
            <div className="dash-page">
                {/* Page Header */}
                <div className="dash-page-header">
                    <h1 className="dash-page-title">Dashboard</h1>
                    <p className="dash-page-sub">Platform overview — stats update every 5 minutes.</p>
                    {stats?.cached_at && (
                        <p className="dash-cache-note">
                            🕐 Stats cached at {new Date(stats.cached_at).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    )}
                </div>

                {/* ── Stats Cards ── */}
                <div className="dash-stats-grid">
                    {/* Total Users */}
                    <div className="dash-stat-card users">
                        <div className="dash-stat-card-header">
                            <span className="dash-stat-label">Total Users</span>
                            <div className="dash-stat-icon users">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>
                            </div>
                        </div>
                        <div className="dash-stat-value">
                            {statsLoading ? '—' : (stats?.total_users ?? 0).toLocaleString()}
                        </div>
                        <div className="dash-stat-breakdown">
                            <span className="dash-stat-pill dash-pill-approved">Active</span>
                        </div>
                    </div>

                    {/* Workers */}
                    <div className="dash-stat-card workers">
                        <div className="dash-stat-card-header">
                            <span className="dash-stat-label">Workers</span>
                            <div className="dash-stat-icon workers">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                            </div>
                        </div>
                        <div className="dash-stat-value">
                            {statsLoading ? '—' : (
                                (stats?.total_workers?.approved ?? 0) +
                                (stats?.total_workers?.pending  ?? 0) +
                                (stats?.total_workers?.rejected ?? 0) +
                                (stats?.total_workers?.blocked  ?? 0)
                            ).toLocaleString()}
                        </div>
                        <div className="dash-stat-breakdown">
                            <span className="dash-stat-pill dash-pill-approved">✓ {stats?.total_workers?.approved ?? 0} Approved</span>
                            <span className="dash-stat-pill dash-pill-pending">⏳ {stats?.total_workers?.pending  ?? 0} Pending</span>
                            <span className="dash-stat-pill dash-pill-rejected">✕ {stats?.total_workers?.rejected ?? 0} Rejected</span>
                        </div>
                    </div>

                    {/* Jobs */}
                    <div className="dash-stat-card jobs">
                        <div className="dash-stat-card-header">
                            <span className="dash-stat-label">Total Jobs</span>
                            <div className="dash-stat-icon jobs">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></svg>
                            </div>
                        </div>
                        <div className="dash-stat-value">
                            {statsLoading ? '—' : (
                                (stats?.total_jobs?.pending     ?? 0) +
                                (stats?.total_jobs?.in_progress ?? 0) +
                                (stats?.total_jobs?.completed   ?? 0) +
                                (stats?.total_jobs?.cancelled   ?? 0)
                            ).toLocaleString()}
                        </div>
                        <div className="dash-stat-breakdown">
                            <span className="dash-stat-pill dash-pill-completed">✓ {stats?.total_jobs?.completed   ?? 0} Done</span>
                            <span className="dash-stat-pill dash-pill-in-progress">● {stats?.total_jobs?.in_progress ?? 0} Active</span>
                        </div>
                    </div>

                    {/* Pending Approval */}
                    <div className="dash-stat-card pending">
                        <div className="dash-stat-card-header">
                            <span className="dash-stat-label">Awaiting Approval</span>
                            <div className="dash-stat-icon pending">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>
                            </div>
                        </div>
                        <div className="dash-stat-value">
                            {statsLoading ? '—' : (stats?.total_workers?.pending ?? 0)}
                        </div>
                        <div className="dash-stat-breakdown">
                            <button className="dash-view-all-btn" onClick={() => navigate('/pending-workers')}>
                                Review Now →
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Pending Workers Table ── */}
                <div className="dash-section">
                    <div className="dash-section-header">
                        <h2 className="dash-section-title">Pending Worker Approvals</h2>
                        <button className="dash-view-all-btn" id="dash-view-pending-all" onClick={() => navigate('/pending-workers')}>
                            View All →
                        </button>
                    </div>
                    <div className="dash-mini-table-wrap">
                        {tableLoading ? (
                            <div className="dash-skeleton" style={{ padding: '16px' }}>
                                {[1,2,3].map(i => <div key={i} className="dash-skeleton-row" />)}
                            </div>
                        ) : pendingWorkers.length === 0 ? (
                            <div className="dash-empty">🎉 No pending workers — all caught up!</div>
                        ) : (
                            <table className="dash-mini-table">
                                <thead>
                                    <tr>
                                        <th>Worker</th>
                                        <th>CNIC</th>
                                        <th>Skills</th>
                                        <th>Fee</th>
                                        <th>Registered</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pendingWorkers.map(w => (
                                        <tr key={w._id}>
                                            <td>
                                                <div className="dash-worker-cell">
                                                    <div className="dash-worker-avatar">{initials(w.name)}</div>
                                                    <div>
                                                        <div className="dash-worker-name">{w.name}</div>
                                                        <div className="dash-worker-phone">{w.phone}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: '12px' }}>
                                                {w.cnic}
                                            </td>
                                            <td>
                                                {(w.skills || []).slice(0, 2).map(s => (
                                                    <span key={s} className="dash-badge" style={{ marginRight: '4px', background: 'rgba(99,102,241,0.1)', color: 'var(--color-primary-light)', border: '1px solid rgba(99,102,241,0.2)' }}>{s}</span>
                                                ))}
                                                {(w.skills?.length ?? 0) > 2 && (
                                                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>+{w.skills.length - 2}</span>
                                                )}
                                            </td>
                                            <td style={{ color: 'var(--text-secondary)' }}>
                                                PKR {(w.fee || 0).toLocaleString()}
                                            </td>
                                            <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{fmt(w.created_at)}</td>
                                            <td>
                                                <button
                                                    id={`dash-view-worker-${w._id}`}
                                                    className="dash-table-action-btn"
                                                    onClick={() => setViewWorker(w)}
                                                >
                                                    View →
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>

            {/* Worker Detail Modal */}
            {viewWorker && (
                <WorkerDetailModal
                    worker={viewWorker}
                    onClose={() => setViewWorker(null)}
                    onApprove={(w) => setActionModal({ mode: 'approve', worker: w })}
                    onReject={(w)  => setActionModal({ mode: 'reject',  worker: w })}
                    onBlock={() => {}} // Block handled in WorkersListPage
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
