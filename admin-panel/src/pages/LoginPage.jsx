import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

export default function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, isAuthenticated } = useAuth();

    const [formData, setFormData] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});

    // If already logged in, redirect to dashboard
    useEffect(() => {
        if (isAuthenticated) {
            const from = location.state?.from?.pathname || '/dashboard';
            navigate(from, { replace: true });
        }
    }, [isAuthenticated, navigate, location]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        // Clear field error on change
        if (fieldErrors[name]) {
            setFieldErrors((prev) => ({ ...prev, [name]: '' }));
        }
        if (error) setError('');
    };

    const validate = () => {
        const errors = {};
        if (!formData.email.trim()) {
            errors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = 'Enter a valid email address';
        }
        if (!formData.password) {
            errors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            errors.password = 'Password must be at least 6 characters';
        }
        return errors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const errors = validate();
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        setLoading(true);
        try {
            await login(formData.email.trim().toLowerCase(), formData.password);
            const from = location.state?.from?.pathname || '/dashboard';
            navigate(from, { replace: true });
        } catch (err) {
            const status = err.response?.status;
            const msg = err.response?.data?.message;

            if (status === 401 || status === 403) {
                setError(msg || 'Invalid email or password. Please try again.');
            } else if (status === 429) {
                setError('Too many login attempts. Please wait and try again later.');
            } else if (!err.response) {
                setError('Unable to connect to server. Check your network connection.');
            } else {
                setError(msg || 'An unexpected error occurred. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            {/* Animated background orbs */}
            <div className="login-bg">
                <div className="orb orb-1" />
                <div className="orb orb-2" />
                <div className="orb orb-3" />
                <div className="grid-overlay" />
            </div>

            {/* Login Card */}
            <div className="login-card-wrapper">
                <div className="login-card">
                    {/* Logo / Brand */}
                    <div className="login-brand">
                        <div className="brand-icon">
                            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
                                <path
                                    d="M14 2L3 9v16h7v-8h8v8h7V9L14 2z"
                                    fill="url(#brandGrad)"
                                    stroke="rgba(255,255,255,0.2)"
                                    strokeWidth="0.5"
                                />
                                <defs>
                                    <linearGradient id="brandGrad" x1="3" y1="2" x2="25" y2="25" gradientUnits="userSpaceOnUse">
                                        <stop stopColor="#818cf8" />
                                        <stop offset="1" stopColor="#38bdf8" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                        <div>
                            <h1 className="brand-name">HomiHire</h1>
                            <span className="brand-tag">Admin Console</span>
                        </div>
                    </div>

                    {/* Heading */}
                    <div className="login-heading">
                        <h2 className="login-title">Welcome back</h2>
                        <p className="login-subtitle">
                            Sign in to access the admin dashboard
                        </p>
                    </div>

                    {/* Form */}
                    <form
                        id="admin-login-form"
                        className="login-form"
                        onSubmit={handleSubmit}
                        noValidate
                    >
                        {/* Global error */}
                        {error && (
                            <div className="error-msg" role="alert" aria-live="assertive">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                                    <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    <circle cx="12" cy="16" r="1" fill="currentColor" />
                                </svg>
                                {error}
                            </div>
                        )}

                        {/* Email Field */}
                        <div className="field-group">
                            <label className="field-label" htmlFor="login-email">
                                Email Address
                            </label>
                            <div className="input-wrapper">
                                <span className="input-icon">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                        <rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="1.5" />
                                        <path d="M2 8l10 6 10-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                    </svg>
                                </span>
                                <input
                                    id="login-email"
                                    name="email"
                                    type="email"
                                    className={`input-field with-icon ${fieldErrors.email ? 'error' : ''}`}
                                    placeholder="admin@homihire.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    autoComplete="email"
                                    autoFocus
                                    disabled={loading}
                                    aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                                    aria-invalid={!!fieldErrors.email}
                                />
                            </div>
                            {fieldErrors.email && (
                                <span id="email-error" className="field-error-msg">
                                    {fieldErrors.email}
                                </span>
                            )}
                        </div>

                        {/* Password Field */}
                        <div className="field-group">
                            <label className="field-label" htmlFor="login-password">
                                Password
                            </label>
                            <div className="input-wrapper">
                                <span className="input-icon">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                        <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
                                        <path d="M8 11V7a4 4 0 018 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                        <circle cx="12" cy="16" r="1.5" fill="currentColor" />
                                    </svg>
                                </span>
                                <input
                                    id="login-password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    className={`input-field with-icon with-icon-right ${fieldErrors.password ? 'error' : ''}`}
                                    placeholder="Enter your password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    autoComplete="current-password"
                                    disabled={loading}
                                    aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                                    aria-invalid={!!fieldErrors.password}
                                />
                                <button
                                    type="button"
                                    id="toggle-password-visibility"
                                    className="password-toggle"
                                    onClick={() => setShowPassword((v) => !v)}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    disabled={loading}
                                >
                                    {showPassword ? (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                            <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                            <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                            <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                        </svg>
                                    ) : (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.5" />
                                            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            {fieldErrors.password && (
                                <span id="password-error" className="field-error-msg">
                                    {fieldErrors.password}
                                </span>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button
                            id="admin-login-submit"
                            type="submit"
                            className="btn-primary login-btn"
                            disabled={loading}
                            aria-busy={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner" aria-hidden="true" />
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    Sign In
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                        <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer info */}
                    <div className="login-footer">
                        <div className="security-badge">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path d="M12 2L4 6v6c0 5 3.6 9.74 8 11 4.4-1.26 8-6 8-11V6l-8-4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                                <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span>Secured with JWT authentication</span>
                        </div>
                    </div>
                </div>

                {/* Side info panel */}
                <div className="login-info-panel" aria-hidden="true">
                    <div className="info-panel-content">
                        <div className="info-icon-wrap">
                            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                                <circle cx="24" cy="24" r="24" fill="rgba(99,102,241,0.12)" />
                                <path d="M24 10L12 17v14h8v-8h8v8h8V17L24 10z" fill="url(#panelGrad)" />
                                <defs>
                                    <linearGradient id="panelGrad" x1="12" y1="10" x2="36" y2="31" gradientUnits="userSpaceOnUse">
                                        <stop stopColor="#818cf8" />
                                        <stop offset="1" stopColor="#38bdf8" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                        <h3 className="info-title">HomiHire Admin</h3>
                        <p className="info-desc">
                            The command center for managing your home service platform.
                        </p>
                        <ul className="info-features">
                            <li>
                                <span className="info-dot" />
                                Manage & approve workers
                            </li>
                            <li>
                                <span className="info-dot" />
                                Monitor platform activity
                            </li>
                            <li>
                                <span className="info-dot" />
                                View analytics & reports
                            </li>
                            <li>
                                <span className="info-dot" />
                                Handle complaints & support
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
