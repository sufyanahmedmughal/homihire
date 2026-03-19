import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { getAllWorkers, blockWorker } from '../services/adminService';
import WorkerDetailModal from '../components/WorkerDetailModal';
import ConfirmActionModal from '../components/ConfirmActionModal';
import toast from 'react-hot-toast';
import './TableStyles.css';

export default function WorkersListPage() {
    const [workers, setWorkers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hasMore, setHasMore] = useState(false);
    const [nextCursor, setNextCursor] = useState(null);

    // Filters
    const [statusFilter, setStatusFilter] = useState('');
    const [skillFilter, setSkillFilter] = useState('');

    // Modals
    const [selectedWorker, setSelectedWorker] = useState(null);
    const [blockModal, setBlockModal] = useState({ isOpen: false, worker: null });
    const [actionLoading, setActionLoading] = useState(false);

    const loadWorkers = async (cursor = null, append = false) => {
        try {
            if (!cursor) setLoading(true);
            const res = await getAllWorkers({ cursor, limit: 15, status: statusFilter, skill: skillFilter });
            setWorkers(prev => append ? [...prev, ...res.workers] : res.workers);
            setHasMore(res.pagination.has_more);
            setNextCursor(res.pagination.next_cursor);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to load workers');
        } finally {
            setLoading(false);
        }
    };

    // Reload when filters change
    useEffect(() => { loadWorkers(); }, [statusFilter, skillFilter]);

    const openBlock = (worker) => setBlockModal({ isOpen: true, worker });

    const handleBlock = async () => {
        const { worker } = blockModal;
        setActionLoading(true);
        try {
            const res = await blockWorker(worker._id);
            toast.success(`Worker blocked. ${res.affected_jobs} active job(s) removed.`);
            
            // Update UI list without reload
            setWorkers(prev => prev.map(w => w._id === worker._id ? { ...w, status: 'blocked' } : w));
            if (selectedWorker?._id === worker._id) {
                setSelectedWorker({ ...worker, status: 'blocked' });
            }
            setBlockModal({ isOpen: false, worker: null });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to block worker');
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <AdminLayout title="Worker Management">
            <div className="table-container">
                <div className="table-header">
                    <h2>All Workers</h2>
                    <p>Manage all registered workers, view profiles, and block accounts if necessary.</p>
                </div>

                <div className="table-filters">
                    <select
                        className="table-filter-select"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="">All Statuses</option>
                        <option value="approved">Approved</option>
                        <option value="pending">Pending</option>
                        <option value="rejected">Rejected</option>
                        <option value="blocked">Blocked</option>
                    </select>

                    <select
                        className="table-filter-select"
                        value={skillFilter}
                        onChange={(e) => setSkillFilter(e.target.value)}
                    >
                        <option value="">All Skills</option>
                        <option value="Cleaning">Cleaning</option>
                        <option value="Plumbing">Plumbing</option>
                        <option value="Electrical">Electrical</option>
                        <option value="Carpentry">Carpentry</option>
                        <option value="Building / Construction">Construction</option>
                        <option value="Repairing / Maintenance">Maintenance</option>
                    </select>
                </div>

                {loading && !workers.length ? (
                    <div className="table-empty">
                        <span className="spinner" style={{ width: 32, height: 32 }} />
                        <p>Loading workers...</p>
                    </div>
                ) : workers.length === 0 ? (
                    <div className="table-empty">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                        <p>No workers match the current filters.</p>
                    </div>
                ) : (
                    <>
                        <div className="table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Worker</th>
                                        <th>Status</th>
                                        <th>Skills</th>
                                        <th className="align-center">Rating</th>
                                        <th className="align-center">Jobs</th>
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
                                                        <span className="td-cnic">{worker.phone}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`wdm-status-badge wdm-status-${worker.status}`} style={{display:'inline-block'}}>
                                                    ● {worker.status.charAt(0).toUpperCase() + worker.status.slice(1)}
                                                </span>
                                            </td>
                                            <td>{worker.skills?.slice(0, 1).join(',')} {worker.skills?.length>1 && '...'}</td>
                                            <td className="align-center">{worker.rating > 0 ? worker.rating.toFixed(1) : '—'}</td>
                                            <td className="align-center">{worker.total_jobs || 0}</td>
                                            <td className="align-right">
                                                <div className="td-actions">
                                                    <button className="btn-icon" onClick={() => setSelectedWorker(worker)} title="View Profile">
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                            <circle cx="12" cy="12" r="3" />
                                                        </svg>
                                                    </button>
                                                    {worker.status !== 'blocked' && worker.status !== 'pending' && (
                                                        <button className="btn-icon btn-icon-block" onClick={() => openBlock(worker)} title="Block Worker">
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
                                <button className="btn-load-more" onClick={() => loadWorkers(nextCursor, true)} disabled={loading}>
                                    {loading ? 'Loading...' : 'Load More Results'}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            <WorkerDetailModal
                worker={selectedWorker}
                onClose={() => setSelectedWorker(null)}
                onApprove={() => {}} // Not approving from here
                onReject={() => {}}  // Not rejecting from here
                onBlock={openBlock}
                loading={actionLoading}
            />

            <ConfirmActionModal
                isOpen={blockModal.isOpen}
                title="Block Worker"
                description={`Are you sure you want to block ${blockModal.worker?.name}? Any active jobs will be immediately marked as 'worker_removed' and the worker will lose access to the platform.`}
                variant="block"
                requireText={false}
                onConfirm={handleBlock}
                onCancel={() => !actionLoading && setBlockModal({ isOpen: false, worker: null })}
                loading={actionLoading}
            />
        </AdminLayout>
    );
}
