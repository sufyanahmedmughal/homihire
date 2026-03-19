import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const NAV_LINKS = [
    {
        to: '/dashboard',
        label: 'Dashboard',
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
            </svg>
        ),
    },
    {
        to: '/pending-workers',
        label: 'Pending Workers',
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
        ),
    },
    {
        to: '/workers',
        label: 'All Workers',
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
            </svg>
        ),
    },
    {
        to: '/users',
        label: 'All Users',
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="23" y1="11" x2="17" y2="11" />
                <line x1="23" y1="7" x2="23" y2="15" />
            </svg>
        ),
    },
];

export default function Sidebar() {
    return (
        <aside className="sidebar" aria-label="Admin navigation">
            {/* Logo */}
            <div className="sidebar-logo">
                <div className="sidebar-logo-icon">
                    <svg width="22" height="22" viewBox="0 0 28 28" fill="none" aria-hidden="true">
                        <path d="M14 2L3 9v16h7v-8h8v8h7V9L14 2z" fill="url(#sbGrad)" />
                        <defs>
                            <linearGradient id="sbGrad" x1="3" y1="2" x2="25" y2="25" gradientUnits="userSpaceOnUse">
                                <stop stopColor="#818cf8" />
                                <stop offset="1" stopColor="#38bdf8" />
                            </linearGradient>
                        </defs>
                    </svg>
                </div>
                <div className="sidebar-logo-text">
                    <span className="sidebar-logo-name">HomiHire</span>
                    <span className="sidebar-logo-role">Admin Panel</span>
                </div>
            </div>

            {/* Nav */}
            <nav className="sidebar-nav">
                <span className="sidebar-section-label">Navigation</span>
                {NAV_LINKS.map(({ to, label, icon }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) =>
                            `sidebar-link ${isActive ? 'sidebar-link--active' : ''}`
                        }
                    >
                        <span className="sidebar-link-icon">{icon}</span>
                        <span className="sidebar-link-label">{label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Footer */}
            <div className="sidebar-footer">
                <div className="sidebar-slice-badge">Slice 2</div>
                <span className="sidebar-footer-text">Admin Dashboard & Worker Approval</span>
            </div>
        </aside>
    );
}
