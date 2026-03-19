import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { getAdminStats } from '../services/adminService';
import toast from 'react-hot-toast';
import './DashboardPage.css';

export default function DashboardPage() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await getAdminStats();
                setStats(data);
            } catch (err) {
                toast.error(err.response?.data?.message || 'Failed to load dashboard stats');
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const w = stats?.total_workers || {};
    const j = stats?.total_jobs || {};

    return (
        <AdminLayout title="Dashboard">
            <div className="dash-container">
                {/* Header info */}
                <div className="dash-header-row">
                    <p className="dash-subtitle">Overview of HomiHire platform metrics.</p>
                    {stats?.cached_at && (
                        <span className="dash-cache-time">
                            Last updated: {new Date(stats.cached_at).toLocaleTimeString('en-PK')}
                        </span>
                    )}
                </div>

                {loading ? (
                    <div className="dash-loading">
                        <span className="spinner" style={{ width: 40, height: 40 }} />
                        <p>Loading stats...</p>
                    </div>
                ) : (
                    <div className="dash-grids">
                        {/* Users & Global */}
                        <div className="dash-grid">
                            <div className="dash-card dash-card-primary">
                                <div className="dash-card-icon">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                        <circle cx="9" cy="7" r="4" />
                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                    </svg>
                                </div>
                                <div className="dash-card-content">
                                    <span className="dash-card-title">Total Users</span>
                                    <span className="dash-card-value">{stats?.total_users || 0}</span>
                                </div>
                            </div>
                            <div className="dash-card">
                                <div className="dash-card-icon">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                </div>
                                <div className="dash-card-content">
                                    <span className="dash-card-title">Total Workers</span>
                                    <span className="dash-card-value">{
                                        (w.approved || 0) + (w.pending || 0) + (w.rejected || 0) + (w.blocked || 0)
                                    }</span>
                                </div>
                            </div>
                        </div>

                        {/* Workers Breakdown */}
                        <h2 className="dash-section-title">Workers by Status</h2>
                        <div className="dash-grid dash-grid-4">
                            <div className="dash-stat-box dash-stat-pending">
                                <span className="dash-stat-label">Pending Approval</span>
                                <span className="dash-stat-num">{w.pending || 0}</span>
                            </div>
                            <div className="dash-stat-box dash-stat-approved">
                                <span className="dash-stat-label">Approved</span>
                                <span className="dash-stat-num">{w.approved || 0}</span>
                            </div>
                            <div className="dash-stat-box dash-stat-rejected">
                                <span className="dash-stat-label">Rejected</span>
                                <span className="dash-stat-num">{w.rejected || 0}</span>
                            </div>
                            <div className="dash-stat-box dash-stat-blocked">
                                <span className="dash-stat-label">Blocked</span>
                                <span className="dash-stat-num">{w.blocked || 0}</span>
                            </div>
                        </div>

                        {/* Jobs Breakdown */}
                        <h2 className="dash-section-title">Jobs by Status</h2>
                        <div className="dash-grid dash-grid-4">
                            <div className="dash-stat-box dash-stat-job-pending">
                                <span className="dash-stat-label">Pending</span>
                                <span className="dash-stat-num">{j.pending || 0}</span>
                            </div>
                            <div className="dash-stat-box dash-stat-job-active">
                                <span className="dash-stat-label">In Progress</span>
                                <span className="dash-stat-num">{j.in_progress || 0}</span>
                            </div>
                            <div className="dash-stat-box dash-stat-job-complete">
                                <span className="dash-stat-label">Completed</span>
                                <span className="dash-stat-num">{j.completed || 0}</span>
                            </div>
                            <div className="dash-stat-box dash-stat-job-cancelled">
                                <span className="dash-stat-label">Cancelled / Removed</span>
                                <span className="dash-stat-num">{(j.cancelled || 0) + (j.worker_removed || 0)}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
