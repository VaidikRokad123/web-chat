import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ThemeToggle';
import ParticleBackground from '../components/ParticleBackground';
import './Auth.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <ParticleBackground />
      <div className="auth-bg">
        <div className="auth-shape shape-1" />
        <div className="auth-shape shape-2" />
        <div className="auth-shape shape-3" />
      </div>

      <div className="auth-theme-toggle">
        <ThemeToggle />
      </div>

      <div className="auth-card fade-in">
        <div className="auth-header">
          <div className="auth-logo">
            <svg viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="12" fill="url(#logo-grad)" />
              <path d="M12 14h16v2H12zm0 5h12v2H12zm0 5h14v2H12z" fill="#fff" opacity="0.9" />
              <defs>
                <linearGradient id="logo-grad" x1="0" y1="0" x2="40" y2="40">
                  <stop stopColor="#6c5ce7" />
                  <stop offset="1" stopColor="#a29bfe" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1>Welcome back</h1>
          <p>Sign in to continue to ChatVerse</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder=" "
              autoComplete="email"
            />
            <label htmlFor="login-email">Email address</label>
          </div>

          <div className="input-group">
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder=" "
              minLength={6}
              autoComplete="current-password"
            />
            <label htmlFor="login-password">Password</label>
          </div>

          <button
            type="submit"
            className={`auth-btn ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {loading ? (
              <span className="btn-spinner" />
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        <p className="auth-footer">
          Don&apos;t have an account?{' '}
          <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
}
