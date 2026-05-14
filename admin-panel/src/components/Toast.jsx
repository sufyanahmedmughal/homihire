import { useState, useCallback, useEffect } from 'react';
import './Toast.css';

let _showToast = null;

export function showToast(message, type = 'info') {
    if (_showToast) _showToast(message, type);
}

export default function ToastProvider() {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
    }, []);

    useEffect(() => {
        _showToast = addToast;
        return () => { _showToast = null; };
    }, [addToast]);

    return (
        <div className="toast-container" aria-live="polite">
            {toasts.map(toast => (
                <div key={toast.id} className={`toast toast-${toast.type}`}>
                    <span className="toast-icon">
                        {toast.type === 'success' && '✓'}
                        {toast.type === 'error'   && '✕'}
                        {toast.type === 'warning' && '⚠'}
                        {toast.type === 'info'    && 'ℹ'}
                    </span>
                    <span className="toast-msg">{toast.message}</span>
                </div>
            ))}
        </div>
    );
}
