import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Brain, LogIn, UserPlus, LogOut, User, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { fbLogout } from '../store';
import './Navbar.css';

export default function Navbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isLanding = pathname === '/';
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Close dropdown on nav
  useEffect(() => {
    setDropdownOpen(false);
  }, [pathname]);

  const displayName = user?.displayName || user?.email || '';
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  async function handleLogout() {
    await fbLogout();
    navigate('/');
  }

  return (
    <nav className={`navbar ${isLanding ? 'navbar-transparent' : 'navbar-solid'}`}>
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <div className="brand-icon">
            <Brain size={22} />
          </div>
          <span className="brand-text">
            <span className="gradient-text">AAI</span>
            <span className="brand-sub">AI Career Engine</span>
          </span>
        </Link>

        <div className="navbar-right">
          {user && !isLanding && (
            <div className="navbar-links">
              <NavLink to="/profile" current={pathname}>Dashboard</NavLink>
              <NavLink to="/profiling" current={pathname}>Profile</NavLink>
              <NavLink to="/careers" current={pathname}>Careers</NavLink>
              <NavLink to="/roadmap" current={pathname}>Roadmap</NavLink>
              <NavLink to="/tracking" current={pathname}>Progress</NavLink>
            </div>
          )}

          {user ? (
            <div className="user-menu" ref={dropdownRef}>
              <button
                className="user-menu-trigger"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-label="User menu"
              >
                <div className="user-avatar-sm">{initials}</div>
                <ChevronDown size={14} className={`chevron ${dropdownOpen ? 'chevron-open' : ''}`} />
              </button>

              {dropdownOpen && (
                <div className="user-dropdown glass-card">
                  <div className="dropdown-header">
                    <span className="dropdown-name">{displayName}</span>
                    <span className="dropdown-email">{user.email}</span>
                  </div>
                  <div className="dropdown-divider" />
                  <Link to="/profile" className="dropdown-item">
                    <User size={16} /> My Profile
                  </Link>
                  <button className="dropdown-item dropdown-logout" onClick={handleLogout}>
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-ghost btn-sm">
                <LogIn size={16} /> Login
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                <UserPlus size={16} /> Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

function NavLink({ to, current, children }: { to: string; current: string; children: React.ReactNode }) {
  const isActive = current === to;
  return (
    <Link to={to} className={`nav-link ${isActive ? 'nav-link-active' : ''}`}>
      {children}
      {isActive && <span className="nav-indicator" />}
    </Link>
  );
}
