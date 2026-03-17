import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './DashboardPage.css';

/**
 * DashboardPage — Placeholder for Slice 1
 * Full implementation is built in Slice 2.
 * Only serves as the authenticated landing page after login.
 */
export default function DashboardPage() {
    const { admin, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
    };

    return (
        <div className="dashboard-placeholder">
            <div className="dp-card">
                {/* Logo */}
                <div className="dp-logo">
                    <svg width="36" height="36" viewBox="0 0 28 28" fill="none" aria-hidden="true">
                        <path d="M14 2L3 9v16h7v-8h8v8h7V9L14 2z" fill="url(#dpGrad)" />
                        <defs>
                            <linearGradient id="dpGrad" x1="3" y1="2" x2="25" y2="25" gradientUnits="userSpaceOnUse">
                                <stop stopColor="#818cf8" />
                                <stop offset="1" stopColor="#38bdf8" />
                            </linearGradient>
                        </defs>
                    </svg>
                </div>

                <div className="dp-badge">Slice 1 Complete ✓</div>

                <h1 className="dp-title">Authentication Successful</h1>

                <p className="dp-desc">
                    You are signed in as{' '}
                    <span className="dp-highlight">{admin?.name || admin?.email || 'Admin'}</span>.
                    <br />
                    The full dashboard will be built in <strong>Slice 2</strong>.
                </p>

                <div className="dp-info-grid">
                    <div className="dp-info-item">
                        <span className="dp-info-label">Admin ID</span>
                        <span className="dp-info-value">{admin?._id || '—'}</span>
                    </div>
                    <div className="dp-info-item">
                        <span className="dp-info-label">Email</span>
                        <span className="dp-info-value">{admin?.email || '—'}</span>
                    </div>
                    <div className="dp-info-item">
                        <span className="dp-info-label">Slice</span>
                        <span className="dp-info-value">1 — Foundation & Auth</span>
                    </div>
                    <div className="dp-info-item">
                        <span className="dp-info-label">Status</span>
                        <span className="dp-info-value dp-status-ok">● Authenticated</span>
                    </div>
                </div>

                <button
                    id="dashboard-logout-btn"
                    className="dp-logout-btn"
                    onClick={handleLogout}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Sign Out
                </button>
            </div>
        </div>
    );
}
