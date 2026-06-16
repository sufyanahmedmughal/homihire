import { useState } from 'react';
import './WorkerDetailModal.css';

const STATUS_LABELS = {
    pending:  'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    blocked:  'Blocked',
};

export default function WorkerDetailModal({ worker, onClose, onApprove, onReject, onBlock }) {
    const [zoomedImg, setZoomedImg] = useState(null);

    if (!worker) return null;

    const initials = worker.name
        ? worker.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
        : 'W';

    const fmt = (date) =>
        date ? new Date(date).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

    return (
        <div className="wdm-overlay" role="dialog" aria-modal="true" aria-label="Worker Detail">
            <div className="wdm-panel">
                {/* Header */}
                <div className="wdm-header">
                    <div className="wdm-header-info">
                        <div className="wdm-avatar-wrap">
                            {worker.selfie_url ? (
                                <img className="wdm-avatar" src={worker.selfie_url} alt={worker.name} />
                            ) : (
                                <div className="wdm-avatar-fallback">{initials}</div>
                            )}
                            <span className={`wdm-status-dot ${worker.status}`} />
                        </div>
                        <div>
                            <div className="wdm-name">{worker.name}</div>
                            <div className="wdm-phone">📞 {worker.phone}</div>
                            <span className={`wdm-status-badge ${worker.status}`}>
                                ● {STATUS_LABELS[worker.status] || worker.status}
                            </span>
                        </div>
                    </div>
                    <button id="wdm-close-x" className="wdm-close-btn" onClick={onClose} aria-label="Close">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="wdm-body">
                    {/* Info Grid */}
                    <div className="wdm-grid">
                        <div className="wdm-field">
                            <span className="wdm-field-label">CNIC</span>
                            <span className="wdm-field-value">{worker.cnic || '—'}</span>
                        </div>
                        <div className="wdm-field">
                            <span className="wdm-field-label">Fee (PKR)</span>
                            <span className="wdm-field-value">
                                {worker.fee ? `PKR ${worker.fee.toLocaleString()}` : '—'}
                            </span>
                        </div>
                        <div className="wdm-field">
                            <span className="wdm-field-label">Rating</span>
                            <span className="wdm-field-value">
                                {worker.rating > 0 ? `⭐ ${worker.rating.toFixed(1)}` : 'No ratings yet'}
                            </span>
                        </div>
                        <div className="wdm-field">
                            <span className="wdm-field-label">Total Jobs</span>
                            <span className="wdm-field-value">{worker.total_jobs ?? 0}</span>
                        </div>
                        <div className="wdm-field">
                            <span className="wdm-field-label">Registered</span>
                            <span className="wdm-field-value">{fmt(worker.created_at)}</span>
                        </div>
                        <div className="wdm-field">
                            <span className="wdm-field-label">Available</span>
                            <span className="wdm-field-value">
                                {worker.is_available ? '🟢 Online' : '⚫ Offline'}
                            </span>
                        </div>
                    </div>

                    {/* Skills */}
                    {worker.skills?.length > 0 && (
                        <div className="wdm-field">
                            <span className="wdm-field-label">Skills / Categories</span>
                            <div className="wdm-skills-wrap" style={{ marginTop: '6px' }}>
                                {worker.skills.map(s => (
                                    <span key={s} className="wdm-skill-chip">{s}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Selfie and Documents */}
                    <div className="wdm-media-wrap">
                        {/* Selfie */}
                        <div className="wdm-media-section">
                            <span className="wdm-media-label">Identity Selfie</span>
                            {worker.selfie_url ? (
                                <img
                                    className="wdm-media-img wdm-zoomable"
                                    src={worker.selfie_url}
                                    alt="Worker selfie"
                                    loading="lazy"
                                    onClick={() => setZoomedImg(worker.selfie_url)}
                                />
                            ) : (
                                <div className="wdm-media-placeholder">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                    No selfie uploaded
                                </div>
                            )}
                        </div>

                        {/* CNIC Images */}
                        <div className="wdm-cnic-grid">
                            <div className="wdm-media-section">
                                <span className="wdm-media-label">CNIC Front</span>
                                {worker.cnic_front_url ? (
                                    <img
                                        className="wdm-media-img wdm-zoomable"
                                        src={worker.cnic_front_url}
                                        alt="CNIC Front"
                                        loading="lazy"
                                        onClick={() => setZoomedImg(worker.cnic_front_url)}
                                    />
                                ) : (
                                    <div className="wdm-media-placeholder">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="4" width="18" height="16" rx="2" ry="2" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                                        No front image
                                    </div>
                                )}
                            </div>
                            <div className="wdm-media-section">
                                <span className="wdm-media-label">CNIC Back</span>
                                {worker.cnic_back_url ? (
                                    <img
                                        className="wdm-media-img wdm-zoomable"
                                        src={worker.cnic_back_url}
                                        alt="CNIC Back"
                                        loading="lazy"
                                        onClick={() => setZoomedImg(worker.cnic_back_url)}
                                    />
                                ) : (
                                    <div className="wdm-media-placeholder">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="4" width="18" height="16" rx="2" ry="2" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                                        No back image
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Rejection reason (if rejected) */}
                    {worker.status === 'rejected' && worker.rejection_reason && (
                        <div className="wdm-rejection-box">
                            <div className="wdm-rejection-label">Rejection Reason</div>
                            <div className="wdm-rejection-text">{worker.rejection_reason}</div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="wdm-footer">
                    {worker.status === 'pending' && (
                        <>
                            <button id="wdm-btn-approve" className="wdm-btn wdm-btn-approve" onClick={() => onApprove(worker)}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>
                                Approve
                            </button>
                            <button id="wdm-btn-reject" className="wdm-btn wdm-btn-reject" onClick={() => onReject(worker)}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                                Reject
                            </button>
                        </>
                    )}
                    {worker.status === 'approved' && (
                        <button id="wdm-btn-block" className="wdm-btn wdm-btn-block" onClick={() => onBlock(worker)}>
                            🚫 Block Worker
                        </button>
                    )}
                    <button id="wdm-btn-close" className="wdm-btn wdm-btn-close" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>

            {/* Zoomed Image Overlay */}
            {zoomedImg && (
                <div className="wdm-zoom-overlay" onClick={() => setZoomedImg(null)}>
                    <div className="wdm-zoom-close" title="Close">×</div>
                    <img src={zoomedImg} alt="Zoomed view" className="wdm-zoomed-img" onClick={(e) => e.stopPropagation()} />
                </div>
            )}
        </div>
    );
}
