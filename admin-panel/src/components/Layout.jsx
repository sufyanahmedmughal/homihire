import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import './Layout.css';

const PAGE_TITLES = {
    '/dashboard':       { title: 'Dashboard',        breadcrumb: 'Overview' },
    '/pending-workers': { title: 'Pending Approval',  breadcrumb: 'Workers' },
    '/workers':         { title: 'All Workers',       breadcrumb: 'Workers' },
    '/users':           { title: 'All Users',         breadcrumb: 'Users' },
};

export default function Layout({ children, pendingCount = 0 }) {
    const [collapsed, setCollapsed] = useState(false);
    const [time, setTime]           = useState(new Date());
    const pathname                  = window.location.pathname;
    const meta                      = PAGE_TITLES[pathname] || { title: 'Admin', breadcrumb: 'HomiHire' };

    useEffect(() => {
        const t = setInterval(() => setTime(new Date()), 60000);
        return () => clearInterval(t);
    }, []);

    // Listen for sidebar collapse via class mutation (simple approach)
    useEffect(() => {
        const sidebar = document.querySelector('.sidebar');
        if (!sidebar) return;
        const obs = new MutationObserver(() => {
            setCollapsed(sidebar.classList.contains('collapsed'));
        });
        obs.observe(sidebar, { attributes: true, attributeFilter: ['class'] });
        return () => obs.disconnect();
    }, []);

    const fmt = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const dateFmt = time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

    return (
        <div className="layout-root">
            <Sidebar pendingCount={pendingCount} />

            <div className={`layout-main${collapsed ? ' sidebar-collapsed' : ''}`}>
                {/* Top bar */}
                <header className="layout-topbar">
                    <div className="layout-topbar-title">
                        <div className="layout-topbar-breadcrumb">
                            <span>HomiHire</span>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
                            {meta.breadcrumb}
                            {meta.breadcrumb !== meta.title && (
                                <>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
                                    <span>{meta.title}</span>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="layout-topbar-actions">
                        <div className="layout-status-dot" title="System Online" />
                        <span className="layout-topbar-time">{dateFmt} · {fmt}</span>
                    </div>
                </header>

                {/* Page content */}
                <main className="layout-content">
                    {children}
                </main>
            </div>
        </div>
    );
}
