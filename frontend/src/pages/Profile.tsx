import { useNavigate } from 'react-router-dom';
import {
  Mail, Calendar, ArrowRight, LogOut, RotateCcw,
  Brain, Target, Rocket, CheckCircle2, BarChart3, Zap,
  Trophy, Flame, TrendingUp
} from 'lucide-react';
import { useAuth, useAppState } from '../contexts/AuthContext';
import { fbLogout } from '../store';
import './Profile.css';

export default function Profile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { appState, clearAppState } = useAppState();

  if (!user) {
    navigate('/login', { replace: true });
    return null;
  }

  const displayName = user.displayName || user.email || 'User';
  const email = user.email || '';
  const createdAt = user.metadata.creationTime || new Date().toISOString();

  // Compute journey stages
  const stages = [
    { key: 'profiling', label: 'Profiling', icon: <Brain size={18} />, done: !!appState.profile },
    { key: 'careers', label: 'Career Match', icon: <Target size={18} />, done: !!appState.careerMatches },
    { key: 'decision', label: 'Decision', icon: <Rocket size={18} />, done: !!appState.chosenCareer },
    { key: 'roadmap', label: 'Roadmap', icon: <CheckCircle2 size={18} />, done: !!appState.roadmap },
    { key: 'tracking', label: 'Tracking', icon: <BarChart3 size={18} />, done: !!appState.roadmap && appState.roadmap.some((d) => d.tasks.some((t) => t.done)) },
  ];

  const completedStages = stages.filter((s) => s.done).length;

  // Roadmap stats
  const totalTasks = appState.roadmap?.reduce((sum, d) => sum + d.tasks.length, 0) ?? 0;
  const doneTasks = appState.roadmap?.reduce((sum, d) => sum + d.tasks.filter((t) => t.done).length, 0) ?? 0;
  const overallPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  // Best match
  const topMatch = appState.careerMatches?.[0] ?? null;

  // Per-day completion for bar chart
  const dayStats = appState.roadmap?.map((d) => ({
    day: d.day,
    title: d.title,
    done: d.tasks.filter((t) => t.done).length,
    total: d.tasks.length,
    pct: Math.round((d.tasks.filter((t) => t.done).length / d.tasks.length) * 100),
  })) ?? [];

  // Member since
  const memberSince = new Date(createdAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  // Days active (since registration)
  const daysActive = Math.max(
    1,
    Math.ceil((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24))
  );

  // Initials
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Resume action — find where user left off
  function getResumeAction(): { label: string; path: string } {
    if (!appState.profile) return { label: 'Start Profiling', path: '/profiling' };
    if (!appState.careerMatches) return { label: 'View Careers', path: '/careers' };
    if (!appState.chosenCareer) return { label: 'Make Decision', path: '/decision' };
    if (!appState.roadmap) return { label: 'View Roadmap', path: '/roadmap' };
    return { label: 'Track Progress', path: '/tracking' };
  }

  const resume = getResumeAction();

  async function handleLogout() {
    await fbLogout();
    navigate('/');
  }

  function handleRestart() {
    clearAppState();
    navigate('/profiling');
  }

  return (
    <div className="profile-page page-enter">
      <div className="section profile-section">
        {/* User Card */}
        <div className="profile-user-card glass-card">
          <div className="profile-avatar">
            <span>{initials}</span>
          </div>
          <div className="profile-user-info">
            <h2>{displayName}</h2>
            <div className="profile-meta">
              <span className="profile-meta-item"><Mail size={14} /> {email}</span>
              <span className="profile-meta-item"><Calendar size={14} /> Joined {memberSince}</span>
            </div>
          </div>
          <div className="profile-user-actions">
            <button className="btn btn-primary" onClick={() => navigate(resume.path)}>
              {resume.label} <ArrowRight size={16} />
            </button>
            <button className="btn btn-ghost" onClick={handleLogout}>
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="profile-stats-grid">
          <div className="stat-card glass-card">
            <div className="stat-card-icon" style={{ background: 'rgba(79, 140, 255, 0.15)', color: 'var(--color-accent-blue)' }}>
              <TrendingUp size={22} />
            </div>
            <div className="stat-card-data">
              <span className="stat-card-value">{completedStages}/5</span>
              <span className="stat-card-label">Stages Done</span>
            </div>
          </div>
          <div className="stat-card glass-card">
            <div className="stat-card-icon" style={{ background: 'rgba(52, 211, 153, 0.15)', color: 'var(--color-accent-green)' }}>
              <CheckCircle2 size={22} />
            </div>
            <div className="stat-card-data">
              <span className="stat-card-value">{doneTasks}/{totalTasks}</span>
              <span className="stat-card-label">Tasks Done</span>
            </div>
          </div>
          <div className="stat-card glass-card">
            <div className="stat-card-icon" style={{ background: 'rgba(168, 85, 247, 0.15)', color: 'var(--color-accent-purple)' }}>
              <Flame size={22} />
            </div>
            <div className="stat-card-data">
              <span className="stat-card-value">{overallPct}%</span>
              <span className="stat-card-label">Completion</span>
            </div>
          </div>
          <div className="stat-card glass-card">
            <div className="stat-card-icon" style={{ background: 'rgba(251, 146, 60, 0.15)', color: 'var(--color-accent-orange)' }}>
              <Zap size={22} />
            </div>
            <div className="stat-card-data">
              <span className="stat-card-value">{daysActive}</span>
              <span className="stat-card-label">Days Active</span>
            </div>
          </div>
        </div>

        {/* Journey Pipeline */}
        <div className="profile-journey glass-card">
          <h3><TrendingUp size={20} /> Career Journey Progress</h3>
          <div className="journey-pipeline">
            {stages.map((s, i) => (
              <div key={s.key} className={`journey-stage ${s.done ? 'stage-complete' : ''}`}>
                <div className="stage-dot">
                  {s.done ? <CheckCircle2 size={16} /> : s.icon}
                </div>
                <span className="stage-label">{s.label}</span>
                {i < stages.length - 1 && <div className={`stage-connector ${s.done ? 'connector-done' : ''}`} />}
              </div>
            ))}
          </div>
        </div>

        {/* Two-column grid: Career + Roadmap */}
        <div className="profile-details-grid">
          {/* Career Match Card */}
          <div className="profile-career glass-card">
            <h3><Target size={20} /> Career Match</h3>
            {topMatch ? (
              <div className="career-match-summary">
                <span className="career-emoji">{topMatch.emoji}</span>
                <div className="career-match-info">
                  <h4>{topMatch.title}</h4>
                  <div className="match-score">
                    <div className="match-score-bar">
                      <div className="match-score-fill" style={{ width: `${topMatch.matchPercent}%` }} />
                    </div>
                    <span className="match-pct">{topMatch.matchPercent}%</span>
                  </div>
                  <p className="career-why">{topMatch.whyItFits.slice(0, 120)}...</p>
                </div>
              </div>
            ) : (
              <div className="no-career-data">
                <Brain size={32} style={{ color: 'var(--color-text-muted)' }} />
                <p>Complete profiling to see your career matches</p>
                <button className="btn btn-secondary" onClick={() => navigate('/profiling')}>
                  Start Profiling <ArrowRight size={16} />
                </button>
              </div>
            )}
            {appState.chosenCareer && (
              <div className="chosen-badge">
                <Trophy size={14} />
                <span>Chosen: <strong>{appState.chosenCareer.title}</strong></span>
              </div>
            )}
          </div>

          {/* Roadmap Progress Chart */}
          <div className="profile-roadmap glass-card">
            <h3><BarChart3 size={20} /> Roadmap Progress</h3>
            {dayStats.length > 0 ? (
              <div className="roadmap-chart">
                {dayStats.map((d) => (
                  <div key={d.day} className="chart-bar-group">
                    <div className="chart-bar-track">
                      <div
                        className={`chart-bar-fill ${d.pct === 100 ? 'bar-complete' : ''}`}
                        style={{ height: `${d.pct}%` }}
                      />
                    </div>
                    <span className="chart-bar-label">D{d.day}</span>
                    <span className="chart-bar-pct">{d.pct}%</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-career-data">
                <BarChart3 size={32} style={{ color: 'var(--color-text-muted)' }} />
                <p>Choose a career to unlock your 7-day roadmap</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="profile-actions">
          <button className="btn btn-primary" onClick={() => navigate(resume.path)}>
            <ArrowRight size={18} /> {resume.label}
          </button>
          <button className="btn btn-secondary" onClick={handleRestart}>
            <RotateCcw size={16} /> Restart Journey
          </button>
        </div>
      </div>
    </div>
  );
}
