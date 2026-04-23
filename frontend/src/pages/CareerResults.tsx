import { useNavigate } from 'react-router-dom';
import { ArrowRight, Star, AlertTriangle, BookOpen, Eye, Compass, GraduationCap, TrendingUp, School } from 'lucide-react';
import { useAppState } from '../contexts/AuthContext';
import { CAREER_FIELDS } from '../store';
import type { CareerMatch } from '../store';
import './CareerResults.css';

export default function CareerResults() {
  const navigate = useNavigate();
  const { appState } = useAppState();
  const { alignedMatches, interestMatches, careerMatches, profile } = appState;

  // Fallback: if no split data, use legacy careerMatches
  const hasAligned = alignedMatches && alignedMatches.length > 0;
  const hasInterest = interestMatches && interestMatches.length > 0;
  const allMatches = careerMatches;

  if (!allMatches || allMatches.length === 0) {
    return (
      <div className="careers-page page-enter">
        <div className="no-data glass-card">
          <AlertTriangle size={32} style={{ color: 'var(--color-accent-orange)' }} />
          <h3>No Profile Found</h3>
          <p>Complete the profiling step first to see your career matches.</p>
          <button className="btn btn-primary" onClick={() => navigate('/profiling')}>
            Start Profiling <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  const situationLabel = profile?.situation === 'college'
    ? `your ${profile.degree || 'degree'}`
    : profile?.situation === 'working'
    ? 'your current profession'
    : 'your background';

  return (
    <div className="careers-page page-enter">
      <div className="section">
        <div className="section-header">
          <span className="badge badge-green">Your Results</span>
          <h2>Your Top <span className="gradient-text">Career Matches</span></h2>
          <p>Based on your profile, strengths, and interests — here are the careers best suited for you.</p>
        </div>

        {/* ===== PANEL 1: ALIGNED CAREERS ===== */}
        {hasAligned && (
          <div className="career-panel">
            <div className="panel-header panel-aligned">
              {profile?.workingGoal === 'grow' ? <TrendingUp size={20} /> : <GraduationCap size={20} />}
              <div>
                <h3>
                  {profile?.workingGoal === 'grow'
                    ? 'Growth Pathways'
                    : `Aligned with ${situationLabel}`}
                </h3>
                <p>
                  {profile?.workingGoal === 'grow'
                    ? 'Advanced and senior roles in your current field. Focus on upskilling.'
                    : 'These careers naturally fit your academic background. You can start the 7-day plan immediately.'}
                </p>
              </div>
              <span className="panel-tag tag-green">
                {profile?.workingGoal === 'grow' ? 'Career Growth' : 'Direct Path'}
              </span>
            </div>

            <div className="career-cards">
              {alignedMatches!.map((career, index) => (
                <CareerCard
                  key={career.id}
                  career={career}
                  index={index}
                  isTopOfPanel={index === 0}
                  profile={profile}
                  navigate={navigate}
                />
              ))}
            </div>
          </div>
        )}

        {/* ===== PANEL 2: INTEREST-BASED (OUTSIDE ACADEMICS) ===== */}
        {hasInterest && (
          <div className="career-panel">
            <div className="panel-header panel-interest">
              <Compass size={20} />
              <div>
                <h3>Based on Your Interests</h3>
                <p>These careers excite you but are outside {situationLabel}. You'll see the transition steps you need before starting.</p>
              </div>
              <span className="panel-tag tag-orange">Career Pivot</span>
            </div>

            <div className="career-cards">
              {interestMatches!.map((career, index) => (
                <CareerCard
                  key={career.id}
                  career={career}
                  index={index}
                  isTopOfPanel={index === 0}
                  isInterestPanel
                  profile={profile}
                  navigate={navigate}
                />
              ))}
            </div>
          </div>
        )}

        {/* If no split (school/exploring), just show all */}
        {!hasAligned && !hasInterest && allMatches && (
          <div className="career-panel">
            <div className="panel-header panel-aligned">
              <TrendingUp size={20} />
              <div>
                <h3>Recommended for You</h3>
                <p>Based on your personality, strengths, and interests.</p>
              </div>
            </div>
            <div className="career-cards">
              {allMatches.map((career, index) => (
                <CareerCard
                  key={career.id}
                  career={career}
                  index={index}
                  isTopOfPanel={index === 0}
                  profile={profile}
                  navigate={navigate}
                />
              ))}
            </div>
          </div>
        )}

        <div className="career-cta">
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/decision')}>
            I'm Ready to Decide <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---- Reusable career card sub-component ---- */
function CareerCard({
  career,
  index,
  isTopOfPanel,
  isInterestPanel,
  profile,
  navigate,
}: {
  career: CareerMatch;
  index: number;
  isTopOfPanel: boolean;
  isInterestPanel?: boolean;
  profile: any;
  navigate: (path: string) => void;
}) {
  const fieldInfo = CAREER_FIELDS.find((f) => f.id === career.field);

  // Determine required stream for 10th graders based on SCHOOL_STREAM_MAP from store
  let requiredStream = '';
  if (profile?.situation === 'school' && profile?.schoolClass === '10th_below') {
    if (['tech', 'data', 'science', 'business'].includes(career.field)) requiredStream = 'Science (Maths) / PCMB';
    else if (['medical'].includes(career.field)) requiredStream = 'Science (Biology) / PCB';
    else if (['finance', 'law'].includes(career.field)) requiredStream = 'Commerce';
    else requiredStream = 'Arts / Humanities';
  }

  return (
    <div className={`career-card glass-card ${isTopOfPanel ? 'career-card-top' : ''} ${isInterestPanel ? 'career-card-interest' : ''}`}>
      {isTopOfPanel && !isInterestPanel && (
        <div className="top-match-badge"><Star size={14} /> Best Match</div>
      )}
      {isInterestPanel && index === 0 && (
        <div className="top-match-badge interest-badge"><Compass size={14} /> Top Interest</div>
      )}

      <div className="career-card-header">
        <span className="career-emoji">{career.emoji}</span>
        <div>
          <h3>{career.title}</h3>
          <div className="career-card-meta">
            {fieldInfo && (
              <span className="field-tag" style={{ '--tag-color': fieldInfo.color } as React.CSSProperties}>
                {fieldInfo.emoji} {fieldInfo.label}
              </span>
            )}
            <div className="match-score">
              <div className="match-bar-bg">
                <div
                  className={`match-bar-fill ${isInterestPanel ? 'match-bar-interest' : ''}`}
                  style={{ width: `${career.matchPercent}%` }}
                />
              </div>
              <span className="match-percent">{career.matchPercent}%</span>
            </div>
          </div>
        </div>
      </div>

      <p className="career-why">{career.whyItFits}</p>

      {requiredStream && (
        <div className="pivot-notice" style={{ backgroundColor: 'rgba(79, 140, 255, 0.06)', borderColor: 'rgba(79, 140, 255, 0.15)', color: 'var(--color-accent-blue)' }}>
          <School size={14} />
          <span><strong>11th Grade Stream Required:</strong> {requiredStream}</span>
        </div>
      )}

      {isInterestPanel && (
        <div className="pivot-notice">
          <AlertTriangle size={14} />
          <span>This career requires a transition from your current academic path. You'll see a step-by-step pivot guide before starting.</span>
        </div>
      )}

      <div className="career-section">
        <h4><BookOpen size={16} /> Skills You'll Need</h4>
        <div className="skill-chips">
          {career.skills.map((s) => (
            <span key={s} className={`skill-chip ${isInterestPanel ? 'skill-chip-interest' : ''}`}>{s}</span>
          ))}
        </div>
      </div>

      <div className="career-section">
        <h4><AlertTriangle size={16} /> Real Challenges</h4>
        <ul className="challenge-list">
          {career.challenges.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </div>

      <button
        className="btn btn-secondary career-sim-btn"
        onClick={() => navigate(`/simulation/${career.id}`)}
      >
        <Eye size={18} /> Experience a Day in This Career
      </button>
    </div>
  );
}
