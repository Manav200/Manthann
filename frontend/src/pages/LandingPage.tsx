import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  ArrowRight, Brain, Target, Rocket, BarChart3,
  Zap, Users, Lightbulb, CheckCircle2
} from 'lucide-react';
import './LandingPage.css';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const startPath = user ? '/profiling' : '/register';

  return (
    <div className="landing page-enter">
      {/* ===== HERO ===== */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge badge badge-purple">
            <Zap size={14} /> Agentic AI-Powered
          </div>
          <h1 className="hero-title">
            From Confusion to{' '}
            <span className="gradient-text">Clarity</span> to{' '}
            Execution
          </h1>
          <p className="hero-subtitle">
            Stop guessing your career. AAI deeply profiles you, simulates real career
            paths, forces a clear decision, and gives you a 7-day actionable plan to start
            executing — today.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary btn-lg" onClick={() => navigate(startPath)}>
              Start Your Journey <ArrowRight size={20} />
            </button>
            <button className="btn btn-secondary btn-lg" onClick={() => {
              document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
            }}>
              See How It Works
            </button>
          </div>
          <div className="hero-stats">
            <StatItem value="5 min" label="Smart Profiling" />
            <StatItem value="3" label="Career Matches" />
            <StatItem value="7 days" label="Action Plan" />
          </div>
        </div>

        {/* Decorative floating elements */}
        <div className="hero-visual">
          <div className="float-card fc-1 glass-card">
            <Brain size={24} className="fc-icon" style={{ color: 'var(--color-accent-purple)' }} />
            <span>Profile Analysis</span>
          </div>
          <div className="float-card fc-2 glass-card">
            <Target size={24} className="fc-icon" style={{ color: 'var(--color-accent-blue)' }} />
            <span>Career Matching</span>
          </div>
          <div className="float-card fc-3 glass-card">
            <Rocket size={24} className="fc-icon" style={{ color: 'var(--color-accent-pink)' }} />
            <span>7-Day Roadmap</span>
          </div>
          <div className="float-card fc-4 glass-card">
            <BarChart3 size={24} className="fc-icon" style={{ color: 'var(--color-accent-green)' }} />
            <span>Track Progress</span>
          </div>
        </div>
      </section>

      {/* ===== PROBLEM ===== */}
      <section className="section" id="problem">
        <div className="section-header">
          <span className="badge badge-pink">The Problem</span>
          <h2>Career Decisions Are Broken</h2>
          <p>Students choose careers based on peer pressure, trends, and incomplete information — not their actual strengths.</p>
        </div>
        <div className="problem-grid">
          <ProblemCard
            icon={<Users size={28} />}
            title="Peer Pressure"
            desc="Following what friends are doing instead of discovering your own path."
            color="var(--color-accent-pink)"
          />
          <ProblemCard
            icon={<Lightbulb size={28} />}
            title="Trend Chasing"
            desc="Picking what's currently popular (AI, coding) without understanding the reality."
            color="var(--color-accent-orange)"
          />
          <ProblemCard
            icon={<Target size={28} />}
            title="No Real Evaluation"
            desc="No system to identify real strengths, understand job expectations, or match both."
            color="var(--color-accent-purple)"
          />
        </div>
      </section>

      {/* ===== WHY EXISTING FAILS ===== */}
      <section className="section alt-bg">
        <div className="section-header">
          <span className="badge badge-blue">The Gap</span>
          <h2>Why Existing Solutions Fail</h2>
          <p>Everyone suggests. No one ensures action.</p>
        </div>
        <div className="fails-grid">
          <FailCard title="Generic Quizzes" desc="Surface-level results like 'be an engineer'. No deep personalization." />
          <FailCard title="YouTube & Google" desc="Too much information. Students get confused instead of clarity." />
          <FailCard title="Career Counselors" desc="Helpful but not scalable or affordable for everyone." />
          <FailCard title="AI Chatbots" desc="They give advice, but don't ensure execution or follow-through." />
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="section" id="how-it-works">
        <div className="section-header">
          <span className="badge badge-green">Our Solution</span>
          <h2>How AAI Works</h2>
          <p>Not guidance. A system for decision + action.</p>
        </div>
        <div className="steps-timeline">
          <Step num={1} title="Smart Profiling" desc="Deep analysis of personality, skills, interests, biases, and work style." icon={<Brain size={22} />} />
          <Step num={2} title="Career Matching" desc="3 personalized career options with match scores and skill requirements." icon={<Target size={22} />} />
          <Step num={3} title="Career Simulation" desc="Experience a 'day in the life' — real tasks, real challenges, real insight." icon={<Rocket size={22} />} />
          <Step num={4} title="Forced Decision" desc="No more confusion. Pick ONE career and commit to the path." icon={<CheckCircle2 size={22} />} />
          <Step num={5} title="7-Day Execution" desc="Personalized daily tasks, projects, and milestones to start building now." icon={<Zap size={22} />} />
          <Step num={6} title="Progress Tracking" desc="Daily checklist, visual progress, and AI feedback to keep you on track." icon={<BarChart3 size={22} />} />
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="cta-section">
        <div className="cta-content glass-card">
          <h2>Ready to Find Your True Path?</h2>
          <p>Stop guessing. Start AAI. It takes just 5 minutes.</p>
          <button className="btn btn-primary btn-lg" onClick={() => navigate(startPath)}>
            Begin Profiling <ArrowRight size={20} />
          </button>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="footer">
        <p>Built by <strong>Team AAI</strong> — Manav Mahawar & Ayush Raj</p>
        <p className="footer-sub">AI Career Decision Engine · Agentic AI</p>
      </footer>
    </div>
  );
}

/* ---- Sub-components ---- */

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div className="stat-item">
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

function ProblemCard({ icon, title, desc, color }: { icon: React.ReactNode; title: string; desc: string; color: string }) {
  return (
    <div className="problem-card glass-card">
      <div className="problem-icon" style={{ color }}>{icon}</div>
      <h4>{title}</h4>
      <p>{desc}</p>
    </div>
  );
}

function FailCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="fail-card glass-card">
      <span className="fail-x">✕</span>
      <h4>{title}</h4>
      <p>{desc}</p>
    </div>
  );
}

function Step({ num, title, desc, icon }: { num: number; title: string; desc: string; icon: React.ReactNode }) {
  return (
    <div className="step-item">
      <div className="step-connector" />
      <div className="step-dot">
        <span className="step-num">{num}</span>
      </div>
      <div className="step-body glass-card">
        <div className="step-icon">{icon}</div>
        <div>
          <h4>{title}</h4>
          <p>{desc}</p>
        </div>
      </div>
    </div>
  );
}
