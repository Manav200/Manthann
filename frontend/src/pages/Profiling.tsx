import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, ArrowLeft, Brain, Sparkles, CheckCircle, GraduationCap,
  Briefcase, Compass, School, Check, Target, TrendingUp, RefreshCw
} from 'lucide-react';
import { useAppState } from '../contexts/AuthContext';
import {
  getSplitCareerMatches,
  CAREER_FIELDS,
  DEGREE_OPTIONS,
  GENERIC_QUESTIONS,
  COLLEGE_QUESTIONS,
  WORKING_QUESTIONS,
  EXPLORING_QUESTIONS,
} from '../store';
import type { UserProfile } from '../store';
import './Profiling.css';

type Phase =
  | 'situation'
  | 'schoolClass'
  | 'schoolStream'
  | 'workingGoal'
  | 'currentField'
  | 'fields'
  | 'degree'
  | 'questions'
  | 'analyzing';

const SITUATIONS = [
  { id: 'school' as const,    label: 'School Student',             desc: 'I am in school and exploring options',       icon: School },
  { id: 'college' as const,   label: 'College Student',            desc: 'I am pursuing a degree right now',            icon: GraduationCap },
  { id: 'working' as const,   label: 'Working Professional',       desc: 'I have a job but want to explore other paths', icon: Briefcase },
  { id: 'exploring' as const, label: "Not Sure / Just Exploring",  desc: "I don't know what I want — help me find out", icon: Compass },
];

const WORKING_GOALS = [
  { id: 'grow' as const, label: 'Grow in my current field', desc: 'I want to advance and see senior/next-level roles in my industry.', icon: TrendingUp },
  { id: 'change' as const, label: 'Pivot to a new career', desc: 'I want to switch to a completely different field.', icon: RefreshCw },
];

export default function Profiling() {
  const navigate = useNavigate();
  const { setAppState } = useAppState();

  // Phase tracking
  const [phase, setPhase] = useState<Phase>('situation');

  // Step 1: Situation
  const [situation, setSituation] = useState<UserProfile['situation']>('');
  const [schoolClass, setSchoolClass] = useState<UserProfile['schoolClass']>(undefined);
  const [schoolStream, setSchoolStream] = useState<UserProfile['schoolStream']>(undefined);
  const [workingGoal, setWorkingGoal] = useState<UserProfile['workingGoal']>(undefined);
  const [currentField, setCurrentField] = useState<string | undefined>(undefined);

  // Step 2: Fields of interest (multi-select)
  const [selectedFields, setSelectedFields] = useState<string[]>([]);

  // Step 2b: Degree (if college)
  const [degree, setDegree] = useState('');

  // Step 3: Questions
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // Build the question list based on situation
  const questions = useMemo(() => {
    const qs = [...GENERIC_QUESTIONS];
    if (situation === 'college') qs.push(...COLLEGE_QUESTIONS);
    if (situation === 'working') qs.push(...WORKING_QUESTIONS);
    if (situation === 'exploring') qs.push(...EXPLORING_QUESTIONS);
    return qs;
  }, [situation]);

  // Rough progress visualization
  const totalSteps = 4 + questions.length; // situation, subphase, fields, degree/questions
  let completedSteps = (situation ? 1 : 0) + Object.keys(answers).length;
  if (selectedFields.length > 0 || currentField) completedSteps++;
  if (degree || schoolStream || workingGoal) completedSteps++;
  const progressPercent = Math.min(100, Math.round((completedSteps / totalSteps) * 100));

  // Navigation Logic
  function goToNextFromSituation() {
    if (!situation) return;
    if (situation === 'school') setPhase('schoolClass');
    else if (situation === 'working') setPhase('workingGoal');
    else if (situation === 'college') setPhase('fields');
    else if (situation === 'exploring') setPhase('fields');
  }

  function goToNextFromSchoolClass() {
    if (!schoolClass) return;
    if (schoolClass === '11th_12th') setPhase('schoolStream');
    else setPhase('fields');
  }

  function goToNextFromWorkingGoal() {
    if (!workingGoal) return;
    if (workingGoal === 'grow') setPhase('currentField');
    else setPhase('fields');
  }

  function goFromFields() {
    if (selectedFields.length === 0) return;
    if (situation === 'college') setPhase('degree');
    else setPhase('questions');
  }

  function toggleField(fieldId: string) {
    setSelectedFields((prev) =>
      prev.includes(fieldId) ? prev.filter((f) => f !== fieldId) : [...prev, fieldId]
    );
  }

  function selectAnswer(option: string) {
    const q = questions[currentQ];
    setAnswers((prev) => ({ ...prev, [q.id]: option }));
  }

  function nextQ() {
    if (currentQ < questions.length - 1) setCurrentQ((p) => p + 1);
  }

  function prevQ() {
    if (currentQ > 0) {
      setCurrentQ((p) => p - 1);
    } else {
      // Back tracking from questions
      if (situation === 'college') setPhase('degree');
      else if (situation === 'working' && workingGoal === 'grow') setPhase('currentField');
      else setPhase('fields');
    }
  }

  async function finish() {
    setPhase('analyzing');
    await new Promise((r) => setTimeout(r, 2000));
    const profileRaw: Partial<UserProfile> = {
      situation: situation || 'exploring',
      schoolClass,
      schoolStream,
      workingGoal,
      currentField,
      interestedFields: selectedFields,
      degree: degree || undefined,
      answers,
      completedAt: new Date().toISOString(),
    };

    // Firebase crashes if any field is strictly undefined. We must strip them.
    const profile = Object.fromEntries(
      Object.entries(profileRaw).filter(([_, v]) => v !== undefined)
    ) as unknown as UserProfile;
    const { aligned, interest } = getSplitCareerMatches(profile);
    setAppState({
      profile,
      alignedMatches: aligned,
      interestMatches: interest,
      careerMatches: [...aligned, ...interest],
    });
    navigate('/careers');
  }

  const allQsAnswered = questions.every((q) => answers[q.id]);

  // -------- RENDER --------

  if (phase === 'analyzing') {
    return (
      <div className="profiling-page page-enter">
        <div className="analyzing-screen">
          <div className="analyzing-animation">
            <Brain size={48} className="analyzing-brain" />
            <Sparkles size={20} className="analyzing-sparkle s1" />
            <Sparkles size={16} className="analyzing-sparkle s2" />
            <Sparkles size={14} className="analyzing-sparkle s3" />
          </div>
          <h2>Analyzing Your Profile</h2>
          <p>Our AI engine is evaluating your strengths, interests, and background to find the best career matches for you...</p>
          <div className="progress-bar-container" style={{ maxWidth: 300, margin: '24px auto 0' }}>
            <div className="progress-bar-fill analyzing-bar" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profiling-page page-enter">
      <div className="profiling-container">
        {/* Global progress */}
        <div className="profiling-header">
          <div className="step-indicators">
            <StepDot active={phase === 'situation'} done={!!situation} label="You" />
            {situation === 'school' && <StepDot active={['schoolClass', 'schoolStream'].includes(phase)} done={!!schoolClass} label="Class" />}
            {situation === 'working' && <StepDot active={['workingGoal', 'currentField'].includes(phase)} done={!!workingGoal} label="Goal" />}
            {(situation !== 'working' || workingGoal === 'change') && <StepDot active={phase === 'fields'} done={selectedFields.length > 0} label="Fields" />}
            {situation === 'college' && <StepDot active={phase === 'degree'} done={!!degree} label="Degree" />}
            <StepDot active={phase === 'questions'} done={allQsAnswered} label="Questions" />
          </div>
          <div className="progress-bar-container">
            <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        {/* ===== PHASE: SITUATION ===== */}
        {phase === 'situation' && (
          <div className="phase-card glass-card">
            <div className="phase-header">
              <span className="badge badge-purple">Step 1</span>
              <h2>Tell us about yourself</h2>
              <p>Everyone's journey is different. Where are you right now?</p>
            </div>
            <div className="situation-grid">
              {SITUATIONS.map((s) => {
                const Icon = s.icon;
                const isSelected = situation === s.id;
                return (
                  <button
                    key={s.id}
                    className={`situation-card ${isSelected ? 'situation-selected' : ''}`}
                    onClick={() => setSituation(s.id)}
                  >
                    <Icon size={28} className="situation-icon" />
                    <h4>{s.label}</h4>
                    <p>{s.desc}</p>
                    {isSelected && <CheckCircle size={18} className="situation-check" />}
                  </button>
                );
              })}
            </div>
            <div className="profiling-nav">
              <div />
              <button className="btn btn-primary" onClick={goToNextFromSituation} disabled={!situation}>
                Next <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ===== PHASE: SCHOOL CLASS ===== */}
        {phase === 'schoolClass' && (
          <div className="phase-card glass-card">
            <div className="phase-header">
              <span className="badge badge-purple"><School size={14} /> School Level</span>
              <h2>Which class are you in?</h2>
            </div>
            <div className="options-grid">
              <button className={`option-btn ${schoolClass === '10th_below' ? 'option-selected' : ''}`} onClick={() => setSchoolClass('10th_below')}>
                <span className="option-text">10th grade or below</span>
                {schoolClass === '10th_below' && <CheckCircle size={18} className="option-check" />}
              </button>
              <button className={`option-btn ${schoolClass === '11th_12th' ? 'option-selected' : ''}`} onClick={() => setSchoolClass('11th_12th')}>
                <span className="option-text">11th or 12th grade</span>
                {schoolClass === '11th_12th' && <CheckCircle size={18} className="option-check" />}
              </button>
            </div>
            <div className="profiling-nav">
              <button className="btn btn-ghost" onClick={() => setPhase('situation')}><ArrowLeft size={18} /> Back</button>
              <button className="btn btn-primary" onClick={goToNextFromSchoolClass} disabled={!schoolClass}>Next <ArrowRight size={18} /></button>
            </div>
          </div>
        )}

        {/* ===== PHASE: SCHOOL STREAM ===== */}
        {phase === 'schoolStream' && (
          <div className="phase-card glass-card">
            <div className="phase-header">
              <span className="badge badge-purple"><Target size={14} /> Academic Stream</span>
              <h2>Which stream have you chosen?</h2>
            </div>
            <div className="options-grid">
              {[
                { id: 'science_math', label: 'Science (Maths)' },
                { id: 'science_bio', label: 'Science (Biology)' },
                { id: 'commerce', label: 'Commerce' },
                { id: 'arts', label: 'Arts / Humanities' },
              ].map(st => (
                <button
                  key={st.id}
                  className={`option-btn ${schoolStream === st.id ? 'option-selected' : ''}`}
                  onClick={() => setSchoolStream(st.id as any)}
                >
                  <span className="option-text">{st.label}</span>
                  {schoolStream === st.id && <CheckCircle size={18} className="option-check" />}
                </button>
              ))}
            </div>
            <div className="profiling-nav">
              <button className="btn btn-ghost" onClick={() => setPhase('schoolClass')}><ArrowLeft size={18} /> Back</button>
              <button className="btn btn-primary" onClick={() => setPhase('fields')} disabled={!schoolStream}>Next <ArrowRight size={18} /></button>
            </div>
          </div>
        )}

        {/* ===== PHASE: WORKING GOAL ===== */}
        {phase === 'workingGoal' && (
          <div className="phase-card glass-card">
            <div className="phase-header">
              <span className="badge badge-purple"><Briefcase size={14} /> Career Goal</span>
              <h2>What's your primary goal?</h2>
            </div>
            <div className="situation-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
              {WORKING_GOALS.map((wg) => {
                const Icon = wg.icon;
                const isSelected = workingGoal === wg.id;
                return (
                  <button
                    key={wg.id}
                    className={`situation-card ${isSelected ? 'situation-selected' : ''}`}
                    onClick={() => setWorkingGoal(wg.id)}
                  >
                    <Icon size={28} className="situation-icon" />
                    <h4>{wg.label}</h4>
                    <p>{wg.desc}</p>
                    {isSelected && <CheckCircle size={18} className="situation-check" />}
                  </button>
                );
              })}
            </div>
            <div className="profiling-nav">
              <button className="btn btn-ghost" onClick={() => setPhase('situation')}><ArrowLeft size={18} /> Back</button>
              <button className="btn btn-primary" onClick={goToNextFromWorkingGoal} disabled={!workingGoal}>Next <ArrowRight size={18} /></button>
            </div>
          </div>
        )}

        {/* ===== PHASE: CURRENT FIELD (Working - Grow) ===== */}
        {phase === 'currentField' && (
          <div className="phase-card glass-card">
            <div className="phase-header">
              <span className="badge badge-purple"><Briefcase size={14} /> Current Industry</span>
              <h2>What is your current field?</h2>
              <p>We'll show you advanced growth paths within this field.</p>
            </div>
            <div className="degree-list">
              {CAREER_FIELDS.map((f: any) => (
                <button
                  key={f.id}
                  className={`degree-option ${currentField === f.id ? 'degree-selected' : ''}`}
                  onClick={() => setCurrentField(f.id)}
                >
                  <span>{f.emoji} {f.label}</span>
                  {currentField === f.id && <CheckCircle size={18} className="option-check" />}
                </button>
              ))}
            </div>
            <div className="profiling-nav">
              <button className="btn btn-ghost" onClick={() => setPhase('workingGoal')}><ArrowLeft size={18} /> Back</button>
              <button className="btn btn-primary" onClick={() => setPhase('questions')} disabled={!currentField}>Next <ArrowRight size={18} /></button>
            </div>
          </div>
        )}


        {/* ===== PHASE: FIELD SELECTION ===== */}
        {phase === 'fields' && (
          <div className="phase-card glass-card">
            <div className="phase-header">
              <span className="badge badge-blue">Interests</span>
              <h2>What fields interest you?</h2>
              <p>
                {situation === 'exploring'
                  ? "No worries if you're unsure — pick any fields that sound even slightly interesting."
                  : "Select one or more fields that catch your attention. You can select multiple!"}
              </p>
            </div>
            <div className="fields-grid">
              {CAREER_FIELDS.map((field: any) => {
                const isSelected = selectedFields.includes(field.id);
                return (
                  <button
                    key={field.id}
                    className={`field-card ${isSelected ? 'field-selected' : ''}`}
                    onClick={() => toggleField(field.id)}
                    style={{ '--field-color': field.color } as React.CSSProperties}
                  >
                    <span className="field-emoji">{field.emoji}</span>
                    <span className="field-label">{field.label}</span>
                    {isSelected && <Check size={16} className="field-check" />}
                  </button>
                );
              })}
            </div>
            <p className="fields-hint">
              {selectedFields.length === 0
                ? 'Select at least one field to continue'
                : `${selectedFields.length} field${selectedFields.length > 1 ? 's' : ''} selected`}
            </p>
            <div className="profiling-nav">
              <button className="btn btn-ghost" onClick={() => {
                if (situation === 'school') setPhase(schoolClass === '11th_12th' ? 'schoolStream' : 'schoolClass');
                else if (situation === 'working') setPhase('workingGoal');
                else setPhase('situation');
              }}>
                <ArrowLeft size={18} /> Back
              </button>
              <button className="btn btn-primary" onClick={goFromFields} disabled={selectedFields.length === 0}>
                Next <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ===== PHASE: DEGREE (college students only) ===== */}
        {phase === 'degree' && (
          <div className="phase-card glass-card">
            <div className="phase-header">
              <span className="badge badge-green"><GraduationCap size={14} /> Your Degree</span>
              <h2>What are you studying?</h2>
              <p>This helps us tailor career suggestions that align with your education.</p>
            </div>
            <div className="degree-list">
              {DEGREE_OPTIONS.map((d: string) => (
                <button
                  key={d}
                  className={`degree-option ${degree === d ? 'degree-selected' : ''}`}
                  onClick={() => setDegree(d)}
                >
                  <span>{d}</span>
                  {degree === d && <CheckCircle size={18} className="option-check" />}
                </button>
              ))}
            </div>
            <div className="profiling-nav">
              <button className="btn btn-ghost" onClick={() => setPhase('fields')}><ArrowLeft size={18} /> Back</button>
              <button className="btn btn-primary" onClick={() => setPhase('questions')} disabled={!degree}>Next <ArrowRight size={18} /></button>
            </div>
          </div>
        )}

        {/* ===== PHASE: BEHAVIORAL QUESTIONS ===== */}
        {phase === 'questions' && (
          <>
            <div className="profiling-meta">
              <span className="badge badge-blue">{questions[currentQ].category}</span>
              <span className="q-counter">{currentQ + 1} / {questions.length}</span>
            </div>

            <div className="question-card glass-card">
              <h2 className="question-text">{questions[currentQ].question}</h2>
              <div className="options-grid">
                {questions[currentQ].options.map((opt: string, i: number) => (
                  <button
                    key={i}
                    className={`option-btn ${answers[questions[currentQ].id] === opt ? 'option-selected' : ''}`}
                    onClick={() => selectAnswer(opt)}
                  >
                    <span className="option-letter">{String.fromCharCode(65 + i)}</span>
                    <span className="option-text">{opt}</span>
                    {answers[questions[currentQ].id] === opt && <CheckCircle size={18} className="option-check" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="profiling-nav">
              <button className="btn btn-ghost" onClick={prevQ}>
                <ArrowLeft size={18} /> {currentQ === 0 ? 'Back' : 'Previous'}
              </button>

              {currentQ < questions.length - 1 ? (
                <button
                  className="btn btn-primary"
                  onClick={nextQ}
                  disabled={!answers[questions[currentQ].id]}
                >
                  Next <ArrowRight size={18} />
                </button>
              ) : (
                <button className="btn btn-primary" onClick={finish} disabled={!allQsAnswered}>
                  <Sparkles size={18} /> Find My Careers
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ---- Step dot sub-component ---- */
function StepDot({ active, done, label }: { active: boolean; done: boolean; label: string }) {
  return (
    <div className={`step-dot-wrap ${active ? 'step-active' : ''} ${done ? 'step-done' : ''}`}>
      <div className="step-dot-circle">
        {done ? <Check size={12} /> : null}
      </div>
      <span className="step-dot-label">{label}</span>
    </div>
  );
}
