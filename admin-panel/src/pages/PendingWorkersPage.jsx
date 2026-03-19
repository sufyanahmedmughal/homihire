import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { getPendingWorkers, approveWorker, rejectWorker } from '../services/adminService';
import WorkerDetailModal from '../components/WorkerDetailModal';
import ConfirmActionModal from '../components/ConfirmActionModal';
import toast from 'react-hot-toast';
import './TableStyles.css';

export default function PendingWorkersPage() {
    const [workers, setWorkers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hasMore, setHasMore] = useState(false);
    const [nextCursor, setNextCursor] = useState(null);

    // Modals state
    const [selectedWorker, setSelectedWorker] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: null, worker: null });
    const [actionLoading, setActionLoading] = useState(false);

    const loadWorkers = async (cursor = null, append = false) => {
        try {
            if (!cursor) setLoading(true);
            const res = await getPendingWorkers({ cursor, limit: 15 });
            setWorkers(prev => append ? [...prev, ...res.workers] : res.workers);
            setHasMore(res.pagination.has_more);
            setNextCursor(res.pagination.next_cursor);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to load workers');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadWorkers(); }, []);

    // Handlers
    const openApprove = (worker) => setConfirmModal({ isOpen: true, type: 'approve', worker });
    const openReject = (worker) => setConfirmModal({ isOpen: true, type: 'reject', worker });

    const closeConfirm = () => !actionLoading && setConfirmModal({ isOpen: false, type: null, worker: null });

    const handleConfirmAction = async (text) => {
        const { type, worker } = confirmModal;
        setActionLoading(true);

        try {
            if (type === 'approve') {
                await approveWorker(worker._id, text);
                toast.success('Worker approved successfully');
            } else if (type === 'reject') {
                await rejectWorker(worker._id, text);
                toast.success('Worker rejected');
            }
            // Remove worker from list
            setWorkers(prev => prev.filter(w => w._id !== worker._id));
            setSelectedWorker(null); // Close detail modal if open
            closeConfirm();
        } catch (err) {
            toast.error(err.response?.data?.message || `Failed to ${type} worker`);
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <AdminLayout title="Pending Workers">
            <div className="table-container">
                <div className="table-header">
                    <h2>Review Submissions</h2>
                    <p>Workers waiting for account approval before they can receive jobs.</p>
                </div>

                {loading && !workers.length ? (
                    <div className="table-empty">
                        <span className="spinner" style={{ width: 32, height: 32 }} />
                        <p>Loading pending workers...</p>
                    </div>
                ) : workers.length === 0 ? (
                    <div className="table-empty">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                        <p>No pending workers awaiting approval.</p>
                    </div>
                ) : (
                    <>
                        <div className="table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Worker</th>
                                        <th>Contact</th>
                                        <th>Primary Skills</th>
                                        <th>Fee (PKR)</th>
                                        <th>Date Applied</th>
                                        <th className="align-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {workers.map(worker => (
                                        <tr key={worker._id}>
                                            <td>
                                                <div className="td-user">
                                                    <div className="td-avatar">
                                                        {worker.selfie_url ? (
                                                            <img src={worker.selfie_url} alt="" />
                                                        ) : (<span>{worker.name[0]}</span>)}
                                                    </div>
                                                    <div className="td-user-info">
                                                        <span className="td-name">{worker.name}</span>
                                                        <span className="td-cnic">{worker.cnic}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{worker.phone}</td>
                                            <td>
                                                <div className="td-tags">
                                                    {worker.skills?.slice(0, 2).map(s => <span key={s} className="td-tag">{s}</span>)}
                                                    {worker.skills?.length > 2 && <span className="td-tag-more">+{worker.skills.length - 2}</span>}
                                                </div>
                                            </td>
                                            <td>{worker.fee?.toLocaleString() || '—'}</td>
                                            <td>{new Date(worker.createdAt).toLocaleDateString('en-PK')}</td>
                                            <td className="align-right">
                                                <div className="td-actions">
                                                    <button className="btn-icon" onClick={() => setSelectedWorker(worker)} title="View Details">
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                            <circle cx="12" cy="12" r="3" />
                                                        </svg>
                                                    </button>
                                                    <button className="btn-icon btn-icon-approve" onClick={() => openApprove(worker)} title="Approve">
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                            <polyline points="20 6 9 17 4 12" />
                                                        </svg>
                                                    </button>
                                                    <button className="btn-icon btn-icon-reject" onClick={() => openReject(worker)} title="Reject">
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {hasMore && (
                            <div className="table-pagination">
                                <button
                                    className="btn-load-more"
                                    onClick={() => loadWorkers(nextCursor, true)}
                                    disabled={loading}
                                >
                                    {loading ? 'Loading...' : 'Load More Results'}
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="6 9 12 15 18 9" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* View Full Profile Modal */}
            <WorkerDetailModal
                worker={selectedWorker}
                onClose={() => setSelectedWorker(null)}
                onApprove={(w) => { /* keep modal open underneath confirm */ openApprove(w); }}
                onReject={(w) => { openReject(w); }}
                onBlock={() => {}} // Not blockable if pending
                loading={actionLoading}
            />

            {/* Confirm Actions */}
            <ConfirmActionModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.type === 'approve' ? 'Approve Worker' : 'Reject Worker Application'}
                description={
                    confirmModal.type === 'approve'
                        ? `Are you sure you want to approve ${confirmModal.worker?.name}? They will be notified and can start accepting jobs.`
                        : `Please provide a reason for rejecting ${confirmModal.worker?.name}. This will be shown to the worker.`
                }
                variant={confirmModal.type || 'block'}
                requireText={confirmModal.type === 'reject'}
                textLabel={confirmModal.type === 'reject' ? 'Rejection Reason' : 'Internal Note'}
                textPlaceholder={confirmModal.type === 'reject' ? "e.g., CNIC image is too blurry..." : "Optional admin note..."}
                onConfirm={handleConfirmAction}
                onCancel={closeConfirm}
                loading={actionLoading}
            />
        </AdminLayout>
    );
}
