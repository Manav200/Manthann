import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { fbLogin } from '../store';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  if (user) {
    navigate('/profile', { replace: true });
    return null;
  }

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: '' }));
    setGlobalError('');
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.email.trim()) e.email = 'Email is required';
    if (!form.password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const result = await fbLogin(form.email.trim(), form.password);
    if (!result.ok) {
      setGlobalError(result.error);
      setLoading(false);
      return;
    }
    navigate('/profile');
  }

  return (
    <div className="auth-page page-enter">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-icon">
            <LogIn size={28} />
          </div>
          <h1>Welcome <span className="gradient-text">Back</span></h1>
          <p>Sign in to continue your career journey</p>
        </div>

        <form className="auth-card glass-card" onSubmit={handleSubmit} noValidate>
          {globalError && (
            <div className="form-error">
              <AlertCircle size={18} />
              {globalError}
            </div>
          )}

          {/* Email */}
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Email Address</label>
            <div className="input-wrapper">
              <input
                id="login-email"
                type="email"
                className={`input-field ${errors.email ? 'input-error' : ''}`}
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                autoComplete="email"
              />
              <Mail size={18} className="input-icon" />
            </div>
            {errors.email && <div className="field-error"><AlertCircle size={14} />{errors.email}</div>}
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Password</label>
            <div className="input-wrapper">
              <input
                id="login-password"
                type={showPw ? 'text' : 'password'}
                className={`input-field ${errors.password ? 'input-error' : ''}`}
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                autoComplete="current-password"
              />
              <Lock size={18} className="input-icon" />
              <button type="button" className="password-toggle" onClick={() => setShowPw(!showPw)} tabIndex={-1}>
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <div className="field-error"><AlertCircle size={14} />{errors.password}</div>}
          </div>

          <button
            type="submit"
            className={`btn btn-primary auth-submit ${loading ? 'btn-loading' : ''}`}
            disabled={loading}
          >
            <LogIn size={18} />
            Sign In
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
}
