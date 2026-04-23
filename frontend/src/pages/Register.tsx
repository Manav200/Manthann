import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, User, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { fbRegister, validatePassword } from '../store';
import './Register.css';

export default function Register() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Redirect if already logged in
  if (user) {
    navigate('/profile', { replace: true });
    return null;
  }

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: '' }));
    setGlobalError('');
  }

  // Password strength
  const pwChecks = {
    length: form.password.length >= 8,
    upper: /[A-Z]/.test(form.password),
    digit: /[0-9]/.test(form.password),
    special: /[^A-Za-z0-9]/.test(form.password),
  };
  const pwScore = Object.values(pwChecks).filter(Boolean).length;

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email';
    const pwErr = validatePassword(form.password);
    if (pwErr) e.password = pwErr;
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const result = await fbRegister(form.name.trim(), form.email.trim(), form.password);
    if (!result.ok) {
      setGlobalError((result as { ok: false; error: string }).error);
      setLoading(false);
      return;
    }
    // Firebase auth state change will be picked up by AuthContext
    navigate('/profiling');
  }

  return (
    <div className="auth-page page-enter">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-icon">
            <UserPlus size={28} />
          </div>
          <h1>Create Your <span className="gradient-text">Account</span></h1>
          <p>Join AAI and discover your ideal career path</p>
        </div>

        <form className="auth-card glass-card" onSubmit={handleSubmit} noValidate>
          {globalError && (
            <div className="form-error">
              <AlertCircle size={18} />
              {globalError}
            </div>
          )}

          {/* Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="reg-name">Full Name</label>
            <div className="input-wrapper">
              <input
                id="reg-name"
                type="text"
                className={`input-field ${errors.name ? 'input-error' : ''}`}
                placeholder="Enter your full name"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                autoComplete="name"
              />
              <User size={18} className="input-icon" />
            </div>
            {errors.name && <div className="field-error"><AlertCircle size={14} />{errors.name}</div>}
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">Email Address</label>
            <div className="input-wrapper">
              <input
                id="reg-email"
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
            <label className="form-label" htmlFor="reg-password">Password</label>
            <div className="input-wrapper">
              <input
                id="reg-password"
                type={showPw ? 'text' : 'password'}
                className={`input-field ${errors.password ? 'input-error' : ''}`}
                placeholder="Create a strong password"
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                autoComplete="new-password"
              />
              <Lock size={18} className="input-icon" />
              <button type="button" className="password-toggle" onClick={() => setShowPw(!showPw)} tabIndex={-1}>
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <div className="field-error"><AlertCircle size={14} />{errors.password}</div>}

            {/* Strength meter */}
            {form.password.length > 0 && (
              <>
                <div className="pw-strength">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`pw-strength-bar ${pwScore >= i ? 'filled' : ''} ${pwScore >= 3 ? 'strong' : pwScore >= 2 ? 'medium' : ''}`}
                    />
                  ))}
                </div>
                <div className="pw-strength-label">
                  {pwScore <= 1 ? 'Weak' : pwScore === 2 ? 'Fair' : pwScore === 3 ? 'Good' : 'Strong'}
                </div>
                <ul className="pw-requirements">
                  <li className={`pw-req ${pwChecks.length ? 'met' : ''}`}>
                    <CheckCircle2 size={12} /> 8+ characters
                  </li>
                  <li className={`pw-req ${pwChecks.upper ? 'met' : ''}`}>
                    <CheckCircle2 size={12} /> Uppercase letter
                  </li>
                  <li className={`pw-req ${pwChecks.digit ? 'met' : ''}`}>
                    <CheckCircle2 size={12} /> Number
                  </li>
                  <li className={`pw-req ${pwChecks.special ? 'met' : ''}`}>
                    <CheckCircle2 size={12} /> Special character
                  </li>
                </ul>
              </>
            )}
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="reg-confirm">Confirm Password</label>
            <div className="input-wrapper">
              <input
                id="reg-confirm"
                type={showConfirm ? 'text' : 'password'}
                className={`input-field ${errors.confirm ? 'input-error' : ''}`}
                placeholder="Re-enter your password"
                value={form.confirm}
                onChange={(e) => update('confirm', e.target.value)}
                autoComplete="new-password"
              />
              <Lock size={18} className="input-icon" />
              <button type="button" className="password-toggle" onClick={() => setShowConfirm(!showConfirm)} tabIndex={-1}>
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirm && <div className="field-error"><AlertCircle size={14} />{errors.confirm}</div>}
          </div>

          <button
            type="submit"
            className={`btn btn-primary auth-submit ${loading ? 'btn-loading' : ''}`}
            disabled={loading}
          >
            <UserPlus size={18} />
            Create Account
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
