import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const NAV_ITEMS = [
    {
        group: 'Overview',
        items: [
            { id: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: IconDashboard },
        ],
    },
    {
        group: 'Workers',
        items: [
            { id: 'pending',  label: 'Pending Approval', path: '/pending-workers', icon: IconClock,   badgeKey: 'pending' },
            { id: 'workers',  label: 'All Workers',      path: '/workers',         icon: IconWorker },
        ],
    },
    {
        group: 'Users',
        items: [
            { id: 'users', label: 'All Users', path: '/users', icon: IconUsers },
        ],
    },
];

export default function Sidebar({ pendingCount = 0 }) {
    const [collapsed, setCollapsed] = useState(false);
    const { admin, logout }         = useAuth();
    const navigate                  = useNavigate();
    const location                  = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
    };

    const initials = admin?.name
        ? admin.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
        : (admin?.email?.[0] || 'A').toUpperCase();

    return (
        <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
            {/* Brand */}
            <div className="sidebar-brand">
                <div className="sidebar-brand-icon">
                    <svg width="18" height="18" viewBox="0 0 28 28" fill="none" aria-hidden="true">
                        <path d="M14 2L3 9v16h7v-8h8v8h7V9L14 2z" fill="white" />
                    </svg>
                </div>
                <div className="sidebar-brand-text">
                    <span className="sidebar-brand-name">HomiHire</span>
                    <span className="sidebar-brand-sub">Admin Panel</span>
                </div>
            </div>

            {/* Collapse toggle */}
            <button
                className="sidebar-toggle"
                onClick={() => setCollapsed(c => !c)}
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                id="sidebar-collapse-btn"
            >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M15 18l-6-6 6-6" />
                </svg>
            </button>

            {/* Nav */}
            <nav className="sidebar-nav" aria-label="Admin navigation">
                {NAV_ITEMS.map(group => (
                    <div key={group.group}>
                        <div className="sidebar-section-label">{group.group}</div>
                        {group.items.map(item => {
                            const Icon    = item.icon;
                            const isActive = location.pathname === item.path;
                            const badge   = item.badgeKey === 'pending' && pendingCount > 0;
                            return (
                                <button
                                    key={item.id}
                                    id={`sidebar-nav-${item.id}`}
                                    className={`sidebar-link${isActive ? ' active' : ''}`}
                                    onClick={() => navigate(item.path)}
                                >
                                    <span className="sidebar-link-icon"><Icon /></span>
                                    <span className="sidebar-link-label">{item.label}</span>
                                    {badge && (
                                        <span className="sidebar-link-badge">{pendingCount}</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                ))}
            </nav>

            {/* Footer */}
            <div className="sidebar-footer">
                <div className="sidebar-admin">
                    <div className="sidebar-admin-avatar">{initials}</div>
                    <div className="sidebar-admin-info">
                        <div className="sidebar-admin-name">{admin?.name || admin?.email || 'Admin'}</div>
                        <div className="sidebar-admin-role">Super Admin</div>
                    </div>
                </div>
                <button
                    id="sidebar-logout-btn"
                    className="sidebar-logout-btn"
                    onClick={handleLogout}
                >
                    <span className="sidebar-link-icon"><IconLogout /></span>
                    <span className="sidebar-logout-btn-label">Sign Out</span>
                </button>
            </div>
        </aside>
    );
}

/* ── Inline SVG Icons ── */
function IconDashboard() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" />
        </svg>
    );
}
function IconClock() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
        </svg>
    );
}
function IconWorker() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
            <path d="M9 11l1 1 2-3" />
        </svg>
    );
}
function IconUsers() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
        </svg>
    );
}
function IconLogout() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
        </svg>
    );
}
