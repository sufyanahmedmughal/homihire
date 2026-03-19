import { useEffect, useRef } from 'react';
import './WorkerDetailModal.css';

const SKILLS_COLOR = {
    'Cleaning': '#10b981',
    'Plumbing': '#0ea5e9',
    'Electrical': '#f59e0b',
    'Carpentry': '#8b5cf6',
    'Building / Construction': '#ef4444',
    'Repairing / Maintenance': '#6366f1',
};

export default function WorkerDetailModal({ worker, onClose, onApprove, onReject, onBlock, loading }) {
    const overlayRef = useRef(null);

    // Close on Escape
    useEffect(() => {
        const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [onClose]);

    // Close on overlay click
    const handleOverlayClick = (e) => {
        if (e.target === overlayRef.current) onClose();
    };

    if (!worker) return null;

    const isPending = worker.status === 'pending';
    const isBlocked = worker.status === 'blocked';
    const location = worker.location?.coordinates
        ? `${worker.location.coordinates[1].toFixed(4)}°N, ${worker.location.coordinates[0].toFixed(4)}°E`
        : '—';

    return (
        <div className="wdm-overlay" ref={overlayRef} onClick={handleOverlayClick} role="dialog" aria-modal="true" aria-label="Worker detail">
            <div className="wdm-modal">
                {/* Header */}
                <div className="wdm-header">
                    <div className="wdm-header-left">
                        <div className="wdm-avatar">
                            {worker.selfie_url ? (
                                <img src={worker.selfie_url} alt={worker.name} className="wdm-avatar-img" />
                            ) : (
                                <span>{worker.name?.[0]?.toUpperCase() || 'W'}</span>
                            )}
                        </div>
                        <div>
                            <h2 className="wdm-name">{worker.name}</h2>
                            <span className={`wdm-status-badge wdm-status-${worker.status}`}>
                                ● {worker.status.charAt(0).toUpperCase() + worker.status.slice(1)}
                            </span>
                        </div>
                    </div>
                    <button id="wdm-close-btn" className="wdm-close-btn" onClick={onClose} aria-label="Close">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="wdm-body">
                    <div className="wdm-grid">
                        {/* Info card */}
                        <div className="wdm-info-card">
                            <h3 className="wdm-section-title">Personal Information</h3>
                            <div className="wdm-info-list">
                                <div className="wdm-info-row">
                                    <span className="wdm-info-label">Phone</span>
                                    <span className="wdm-info-value">{worker.phone || '—'}</span>
                                </div>
                                <div className="wdm-info-row">
                                    <span className="wdm-info-label">CNIC</span>
                                    <span className="wdm-info-value wdm-mono">{worker.cnic || '—'}</span>
                                </div>
                                <div className="wdm-info-row">
                                    <span className="wdm-info-label">Fee</span>
                                    <span className="wdm-info-value wdm-highlight">
                                        PKR {worker.fee?.toLocaleString() || '—'}
                                    </span>
                                </div>
                                <div className="wdm-info-row">
                                    <span className="wdm-info-label">Location</span>
                                    <span className="wdm-info-value">{location}</span>
                                </div>
                                <div className="wdm-info-row">
                                    <span className="wdm-info-label">Rating</span>
                                    <span className="wdm-info-value">
                                        {worker.rating > 0 ? `⭐ ${Number(worker.rating).toFixed(1)}` : '—'}
                                    </span>
                                </div>
                                <div className="wdm-info-row">
                                    <span className="wdm-info-label">Total Jobs</span>
                                    <span className="wdm-info-value">{worker.total_jobs ?? 0}</span>
                                </div>
                                <div className="wdm-info-row">
                                    <span className="wdm-info-label">Registered</span>
                                    <span className="wdm-info-value">
                                        {worker.createdAt ? new Date(worker.createdAt).toLocaleDateString('en-PK') : '—'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Skills + selfie */}
                        <div className="wdm-right-col">
                            {/* Skills */}
                            <div className="wdm-skills-card">
                                <h3 className="wdm-section-title">Skills</h3>
                                <div className="wdm-skills-list">
                                    {(worker.skills || []).map((skill) => (
                                        <span
                                            key={skill}
                                            className="wdm-skill-tag"
                                            style={{ '--skill-color': SKILLS_COLOR[skill] || '#6366f1' }}
                                        >
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Selfie */}
                            {worker.selfie_url && (
                                <div className="wdm-selfie-card">
                                    <h3 className="wdm-section-title">Selfie</h3>
                                    <div className="wdm-selfie-wrap">
                                        <img
                                            src={worker.selfie_url}
                                            alt="Worker selfie"
                                            className="wdm-selfie-img"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Rejection reason if present */}
                            {worker.rejection_reason && (
                                <div className="wdm-rejection-card">
                                    <h3 className="wdm-section-title wdm-danger-text">Rejection Reason</h3>
                                    <p className="wdm-rejection-text">{worker.rejection_reason}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="wdm-footer">
                    {isPending && (
                        <>
                            <button
                                id="wdm-approve-btn"
                                className="wdm-btn wdm-btn-approve"
                                onClick={() => onApprove(worker)}
                                disabled={loading}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                                Approve
                            </button>
                            <button
                                id="wdm-reject-btn"
                                className="wdm-btn wdm-btn-reject"
                                onClick={() => onReject(worker)}
                                disabled={loading}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                                Reject
                            </button>
                        </>
                    )}
                    {!isBlocked && !isPending && (
                        <button
                            id="wdm-block-btn"
                            className="wdm-btn wdm-btn-block"
                            onClick={() => onBlock(worker)}
                            disabled={loading}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                            </svg>
                            Block Worker
                        </button>
                    )}
                    <button id="wdm-cancel-btn" className="wdm-btn wdm-btn-cancel" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
