import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './TopBar.css';

export default function TopBar({ title }) {
    const { admin, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
    };

    // Admin initials avatar
    const initials = admin?.name
        ? admin.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
        : (admin?.email?.[0] || 'A').toUpperCase();

    return (
        <header className="topbar">
            <div className="topbar-left">
                <h1 className="topbar-title">{title}</h1>
            </div>
            <div className="topbar-right">
                <div className="topbar-admin">
                    <div className="topbar-admin-info">
                        <span className="topbar-admin-name">{admin?.name || admin?.email || 'Admin'}</span>
                        <span className="topbar-admin-role">Administrator</span>
                    </div>
                    <div className="topbar-avatar" aria-label="Admin avatar">
                        {initials}
                    </div>
                </div>
                <button
                    id="topbar-logout-btn"
                    className="topbar-logout-btn"
                    onClick={handleLogout}
                    title="Sign out"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    <span>Sign Out</span>
                </button>
            </div>
        </header>
    );
}
