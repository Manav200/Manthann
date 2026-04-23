import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock, ArrowRight, AlertTriangle, Sparkles, Compass, GraduationCap,
  CheckCircle, Clock, TrendingUp
} from 'lucide-react';
import { useAppState } from '../contexts/AuthContext';
import { getMockRoadmap, getTransitionInfo } from '../store';
import type { CareerMatch, TransitionInfo } from '../store';
import './Decision.css';

export default function Decision() {
  const navigate = useNavigate();
  const { appState, setAppState } = useAppState();
  const { alignedMatches, interestMatches, careerMatches } = appState;
  const [selected, setSelected] = useState<CareerMatch | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [locking, setLocking] = useState(false);
  const [transition, setTransition] = useState<TransitionInfo | null>(null);

  const allMatches = careerMatches;

  if (!allMatches || allMatches.length === 0) {
    return (
      <div className="decision-page page-enter">
        <div className="no-data glass-card">
          <AlertTriangle size={32} style={{ color: 'var(--color-accent-orange)' }} />
          <h3>No Matches Found</h3>
          <p>Complete the profiling step first.</p>
          <button className="btn btn-primary" onClick={() => navigate('/profiling')}>
            Start Profiling <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  function selectCareer(career: CareerMatch) {
    setSelected(career);
    setConfirmed(false);

    // Check if career needs transition info
    if (appState.profile) {
      const info = getTransitionInfo(appState.profile, career);
      setTransition(info);
    } else {
      setTransition(null);
    }
  }

  async function lockIn() {
    if (!selected) return;
    setLocking(true);
    await new Promise((r) => setTimeout(r, 1800));
    const roadmap = getMockRoadmap(selected);
    const isAligned = selected.isAligned !== false;
    setAppState({ chosenCareer: selected, roadmap, isCareerAligned: isAligned });
    navigate('/roadmap');
  }

  // Split cards into aligned vs interest for visual grouping on the decision page
  const hasAligned = alignedMatches && alignedMatches.length > 0;
  const hasInterest = interestMatches && interestMatches.length > 0;

  return (
    <div className="decision-page page-enter">
      <div className="section decision-section">
        <div className="section-header">
          <span className="badge badge-pink">Decision Time</span>
          <h2>Lock In Your <span className="gradient-text">Career Path</span></h2>
          <p>Clarity without action is useless. Pick <strong>ONE</strong> career and commit to a focused 7-day execution cycle.</p>
        </div>

        {locking ? (
          <div className="locking-screen">
            <div className="lock-animation">
              <Lock size={48} className="lock-icon" />
              <Sparkles size={20} className="lock-sparkle" />
            </div>
            <h3>Locking in your decision...</h3>
            <p>
              {transition
                ? 'Generating your transition guide + 7-day execution plan'
                : 'Generating your personalized 7-day execution plan'}
            </p>
            <div className="progress-bar-container" style={{ maxWidth: 300, margin: '20px auto 0' }}>
              <div className="progress-bar-fill analyzing-bar" />
            </div>
          </div>
        ) : (
          <>
            {/* ---- Aligned Careers Group ---- */}
            {hasAligned && (
              <div className="decision-group">
                <div className="decision-group-label group-aligned">
                  <GraduationCap size={16} />
                  <span>Aligned with your academics — Direct 7-day plan</span>
                </div>
                <div className="decision-cards">
                  {alignedMatches!.map((career) => (
                    <DecisionCard
                      key={career.id}
                      career={career}
                      isSelected={selected?.id === career.id}
                      onSelect={() => selectCareer(career)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ---- Interest Careers Group ---- */}
            {hasInterest && (
              <div className="decision-group">
                <div className="decision-group-label group-interest">
                  <Compass size={16} />
                  <span>Based on your interests — Includes transition steps</span>
                </div>
                <div className="decision-cards">
                  {interestMatches!.map((career) => (
                    <DecisionCard
                      key={career.id}
                      career={career}
                      isSelected={selected?.id === career.id}
                      isInterest
                      onSelect={() => selectCareer(career)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ---- Fallback: No split ---- */}
            {!hasAligned && !hasInterest && (
              <div className="decision-cards">
                {allMatches.map((career) => (
                  <DecisionCard
                    key={career.id}
                    career={career}
                    isSelected={selected?.id === career.id}
                    onSelect={() => selectCareer(career)}
                  />
                ))}
              </div>
            )}

            {/* ===== TRANSITION INFO (for non-aligned careers) ===== */}
            {selected && transition && (
              <div className="transition-info glass-card">
                <div className="transition-header">
                  <Compass size={22} className="transition-icon" />
                  <div>
                    <h3>Career Pivot: {transition.fromLabel} → {transition.toLabel}</h3>
                    <p className="transition-overview">{transition.overview}</p>
                  </div>
                </div>

                <div className="transition-meta">
                  <div className="transition-meta-item">
                    <AlertTriangle size={14} />
                    <span>Difficulty: <strong className={`diff-${transition.difficulty.toLowerCase()}`}>{transition.difficulty}</strong></span>
                  </div>
                  <div className="transition-meta-item">
                    <Clock size={14} />
                    <span>Timeline: <strong>{transition.timeEstimate}</strong></span>
                  </div>
                </div>

                <div className="transition-steps">
                  <h4>Steps to Make This Switch</h4>
                  {transition.steps.map((step, i) => (
                    <div key={i} className="transition-step">
                      <span className="step-num-icon">{step.icon}</span>
                      <div>
                        <h5>{step.title}</h5>
                        <p>{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="transition-note">
                  <TrendingUp size={14} />
                  <span>Your 7-day plan will include both <strong>transition steps</strong> and <strong>introductory tasks</strong> for this career. Think of it as your exploration + action blueprint.</span>
                </div>
              </div>
            )}

            {/* ===== CONFIRMATION ===== */}
            {selected && (
              <div className="decision-confirm glass-card">
                {!transition ? (
                  <p>
                    You're about to commit to <strong>{selected.emoji} {selected.title}</strong>.
                    This career aligns with your background — you'll get a focused 7-day plan to start immediately. Ready?
                  </p>
                ) : (
                  <p>
                    You've chosen <strong>{selected.emoji} {selected.title}</strong> — a career outside your current academic path.
                    Your 7-day plan will include <strong>transition guidance</strong> to help you bridge the gap. Ready to start?
                  </p>
                )}
                <label className="confirm-checkbox">
                  <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={(e) => setConfirmed(e.target.checked)}
                  />
                  <span>
                    {transition
                      ? "I understand this requires a career pivot. I'm committed to exploring this path for 7 days."
                      : "I understand this is my focused path. I'm committing to 7 days of action."}
                  </span>
                </label>
                <button
                  className="btn btn-primary btn-lg"
                  disabled={!confirmed}
                  onClick={lockIn}
                >
                  <Lock size={18} /> Lock In & Start Execution
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ---- Decision card sub-component ---- */
function DecisionCard({
  career,
  isSelected,
  isInterest,
  onSelect,
}: {
  career: CareerMatch;
  isSelected: boolean;
  isInterest?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      className={`decision-card glass-card ${isSelected ? 'decision-selected' : ''} ${isInterest ? 'decision-interest' : ''}`}
      onClick={onSelect}
    >
      <span className="decision-emoji">{career.emoji}</span>
      <h3>{career.title}</h3>
      <span className={`decision-match ${isInterest ? 'decision-match-interest' : ''}`}>
        {career.matchPercent}% match
      </span>
      {isInterest && (
        <span className="decision-pivot-tag">
          <Compass size={10} /> Pivot
        </span>
      )}
      {isSelected && (
        <div className="decision-check-ring">
          <CheckCircle size={16} />
        </div>
      )}
    </button>
  );
}
