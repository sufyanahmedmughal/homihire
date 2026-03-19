import { useState, useEffect, useRef } from 'react';
import './ConfirmActionModal.css';

/**
 * ConfirmActionModal
 * Props:
 *   isOpen       — boolean
 *   title        — modal title
 *   description  — description text
 *   variant      — 'approve' | 'reject' | 'block'
 *   requireText  — if true, show a textarea (e.g. rejection reason)
 *   textLabel    — label for textarea
 *   textPlaceholder
 *   onConfirm(text) — callback with textarea content (or '' if no text)
 *   onCancel
 *   loading
 */
export default function ConfirmActionModal({
    isOpen,
    title,
    description,
    variant = 'block',
    requireText = false,
    textLabel = 'Note',
    textPlaceholder = '',
    onConfirm,
    onCancel,
    loading = false,
}) {
    const [text, setText] = useState('');
    const [error, setError] = useState('');
    const overlayRef = useRef(null);
    const textRef = useRef(null);

    useEffect(() => {
        if (!isOpen) { setText(''); setError(''); }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && requireText && textRef.current) {
            setTimeout(() => textRef.current?.focus(), 100);
        }
    }, [isOpen, requireText]);

    useEffect(() => {
        const handleKey = (e) => { if (e.key === 'Escape' && !loading) onCancel(); };
        if (isOpen) document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [isOpen, loading, onCancel]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (requireText && !text.trim()) {
            setError(`${textLabel} is required`);
            textRef.current?.focus();
            return;
        }
        setError('');
        onConfirm(text.trim());
    };

    const handleOverlayClick = (e) => {
        if (e.target === overlayRef.current && !loading) onCancel();
    };

    const VARIANT_ICONS = {
        approve: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
            </svg>
        ),
        reject: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
        ),
        block: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
            </svg>
        ),
    };

    return (
        <div className="cam-overlay" ref={overlayRef} onClick={handleOverlayClick} role="dialog" aria-modal="true">
            <div className="cam-modal">
                <div className={`cam-icon-wrap cam-icon-${variant}`}>
                    {VARIANT_ICONS[variant]}
                </div>

                <h3 className="cam-title">{title}</h3>
                <p className="cam-desc">{description}</p>

                {requireText && (
                    <div className="cam-field">
                        <label className="field-label">{textLabel} <span className="cam-required">*</span></label>
                        <textarea
                            ref={textRef}
                            id="cam-reason-textarea"
                            className={`cam-textarea ${error ? 'cam-textarea-error' : ''}`}
                            placeholder={textPlaceholder}
                            value={text}
                            onChange={(e) => { setText(e.target.value); if (error) setError(''); }}
                            rows={4}
                            maxLength={500}
                            disabled={loading}
                        />
                        {error && <span className="cam-error-msg">{error}</span>}
                        <span className="cam-char-count">{text.length}/500</span>
                    </div>
                )}

                <div className="cam-actions">
                    <button
                        id="cam-cancel-btn"
                        className="cam-btn cam-btn-cancel"
                        onClick={onCancel}
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        id="cam-confirm-btn"
                        className={`cam-btn cam-btn-confirm cam-btn-${variant}`}
                        onClick={handleConfirm}
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="spinner" style={{ width: 16, height: 16 }} />
                        ) : null}
                        {title}
                    </button>
                </div>
            </div>
        </div>
    );
}
