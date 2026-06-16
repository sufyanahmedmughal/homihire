import { useState } from 'react';
import './ApproveRejectModal.css';

/**
 * ApproveRejectModal — unified modal for approve / reject / block actions.
 *
 * Props:
 *   mode: 'approve' | 'reject' | 'block-worker' | 'block-user'
 *   target: { _id, name }
 *   onConfirm(note): called with the text field value
 *   onCancel()
 */
export default function ApproveRejectModal({ mode, target, onConfirm, onCancel }) {
    const [note, setNote]     = useState('');
    const [error, setError]   = useState('');
    const [loading, setLoading] = useState(false);

    if (!target) return null;

    const config = {
        approve: {
            icon: (
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M20 6L9 17l-5-5" />
                </svg>
            ),
            iconClass:   'approve',
            title:       'Approve Worker',
            subtitle:    <>Approve <span className="arm-worker-name">{target.name}</span>? They will be notified and can start receiving jobs.</>,
            noteLabel:   'Approval Note (optional)',
            placeholder: 'e.g. CNIC and selfie verified successfully.',
            required:    false,
            btnClass:    'arm-btn-approve',
            btnLabel:    'Approve Worker',
        },
        reject: {
            icon: (
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                </svg>
            ),
            iconClass:   'reject',
            title:       'Reject Worker',
            subtitle:    <>Reject <span className="arm-worker-name">{target.name}</span>? A reason is required — it will be shown to the worker.</>,
            noteLabel:   'Rejection Reason',
            placeholder: 'e.g. CNIC image is blurry. Please re-register with a clearer image.',
            required:    true,
            btnClass:    'arm-btn-reject',
            btnLabel:    'Reject Worker',
        },
        'block-worker': {
            icon: <span>🚫</span>,
            iconClass:   'block',
            title:       'Block Worker',
            warning:     'This will set all active jobs to worker_removed. Users will be notified to hire a new worker. This action cannot be undone automatically.',
            required:    false,
            btnClass:    'arm-btn-block',
            btnLabel:    'Block Worker',
        },
        'block-user': {
            icon: <span>🚫</span>,
            iconClass:   'block',
            title:       'Block User',
            warning:     `Block ${target.name}? They will not be able to log in. Their token will be revoked on next request.`,
            required:    false,
            btnClass:    'arm-btn-block',
            btnLabel:    'Block User',
        },
    }[mode];

    const handleConfirm = async () => {
        if (config.required && !note.trim()) {
            setError('This field is required.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await onConfirm(note.trim());
        } catch (e) {
            setError(e?.response?.data?.error || e.message || 'Something went wrong.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="arm-overlay" role="dialog" aria-modal="true">
            <div className="arm-panel">
                <div className="arm-icon-wrap">
                    <div className={`arm-icon ${config.iconClass}`}>{config.icon}</div>
                </div>
                <div className="arm-body">
                    <div className="arm-title">{config.title}</div>
                    {config.subtitle && <div className="arm-subtitle">{config.subtitle}</div>}

                    {/* Warning box (block actions) */}
                    {config.warning && (
                        <div className="arm-warning-box">⚠ {config.warning}</div>
                    )}

                    {/* Note / reason textarea */}
                    {(mode === 'approve' || mode === 'reject') && (
                        <div className="arm-textarea-wrap">
                            <label className="arm-textarea-label" htmlFor="arm-note-field">
                                {config.noteLabel}
                                {config.required && <span className="arm-required">*</span>}
                            </label>
                            <textarea
                                id="arm-note-field"
                                className={`arm-textarea${error ? ' error' : ''}`}
                                placeholder={config.placeholder}
                                value={note}
                                onChange={e => { setNote(e.target.value); if (error) setError(''); }}
                                rows={3}
                            />
                            {error && <div className="arm-error-msg">{error}</div>}
                        </div>
                    )}

                    {error && (mode === 'block-worker' || mode === 'block-user') && (
                        <div className="arm-error-msg" style={{ marginBottom: '12px' }}>{error}</div>
                    )}

                    <div className="arm-actions">
                        <button
                            id="arm-btn-cancel"
                            className="arm-btn arm-btn-cancel"
                            onClick={onCancel}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            id="arm-btn-confirm"
                            className={`arm-btn ${config.btnClass}`}
                            onClick={handleConfirm}
                            disabled={loading}
                        >
                            {loading ? <span className="arm-spinner" /> : config.btnLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
