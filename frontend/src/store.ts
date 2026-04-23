/* -------------------------------------------------------
   State manager — Firebase Auth + Firestore
   ------------------------------------------------------- */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

/* ============  TYPES  ============ */

export interface UserProfile {
  /** Step 1: What is the user's current situation */
  situation: 'school' | 'college' | 'working' | 'exploring' | '';
  /** Step 1b: School Class */
  schoolClass?: '10th_below' | '11th_12th';
  /** Step 1c: School Stream */
  schoolStream?: 'science_math' | 'science_bio' | 'commerce' | 'arts';
  /** Step 1b: Working Goal */
  workingGoal?: 'grow' | 'change';
  /** Step 1c: Current field (working-grow) */
  currentField?: string;
  /** Step 2: Which broad fields interest them (multi-select) */
  interestedFields: string[];
  /** Step 2b: If college — what degree */
  degree?: string;
  /** Step 3+: Behavioral answers */
  answers: Record<string, string>;
  completedAt?: string;
}

export interface CareerMatch {
  id: string;
  title: string;
  emoji: string;
  matchPercent: number;
  whyItFits: string;
  skills: string[];
  challenges: string[];
  dayInLife: string;
  /** The broad field this career belongs to */
  field: string;
  /** Whether this career is aligned with the user's academic background */
  isAligned?: boolean;
  /** Whether this is an advanced/senior career (for growth paths) */
  isAdvanced?: boolean;
}

export interface TransitionStep {
  icon: string;
  title: string;
  description: string;
}

export interface TransitionInfo {
  fromLabel: string;
  toLabel: string;
  difficulty: 'Low' | 'Medium' | 'High';
  timeEstimate: string;
  overview: string;
  steps: TransitionStep[];
}

export interface RoadmapDay {
  day: number;
  title: string;
  tasks: { id: string; text: string; done: boolean }[];
}

export interface AppState {
  profile: UserProfile | null;
  /** Careers aligned with academic background / current work */
  alignedMatches: CareerMatch[] | null;
  /** Careers based on interests but outside academic/work field */
  interestMatches: CareerMatch[] | null;
  /** Legacy: all matches combined (used by Decision page) */
  careerMatches: CareerMatch[] | null;
  chosenCareer: CareerMatch | null;
  /** Whether the chosen career is aligned with academics/work */
  isCareerAligned: boolean;
  roadmap: RoadmapDay[] | null;
}

/* ============  CONSTANTS — FIELDS & DEGREES  ============ */

export const CAREER_FIELDS = [
  { id: 'tech',      label: 'Technology & Software',  emoji: '💻', color: '#4f8cff' },
  { id: 'design',    label: 'Design & Creative Arts',  emoji: '🎨', color: '#ec4899' },
  { id: 'data',      label: 'Data & Analytics',        emoji: '📊', color: '#22d3ee' },
  { id: 'business',  label: 'Business & Management',   emoji: '📈', color: '#fb923c' },
  { id: 'law',       label: 'Law & Policy',            emoji: '⚖️', color: '#a855f7' },
  { id: 'medical',   label: 'Medicine & Healthcare',   emoji: '🏥', color: '#34d399' },
  { id: 'science',   label: 'Science & Research',      emoji: '🔬', color: '#60a5fa' },
  { id: 'media',     label: 'Media & Communication',   emoji: '🎬', color: '#f472b6' },
  { id: 'education', label: 'Teaching & Education',     emoji: '📚', color: '#fbbf24' },
  { id: 'finance',   label: 'Finance & Accounting',    emoji: '🏦', color: '#2dd4bf' },
];

export const DEGREE_OPTIONS = [
  'B.Tech / B.E. (Engineering)',
  'B.Sc (Science)',
  'B.Com (Commerce)',
  'BBA / BMS (Business)',
  'BA (Arts / Humanities)',
  'B.Des (Design)',
  'MBBS / BDS (Medical)',
  'LLB / BA LLB (Law)',
  'BCA (Computer Applications)',
  'B.Arch (Architecture)',
  'BPharm (Pharmacy)',
  'Diploma / ITI',
  'Other / Not sure yet',
];

/** Maps each degree to the career fields it naturally aligns with */
export const DEGREE_FIELD_MAP: Record<string, string[]> = {
  'B.Tech / B.E. (Engineering)':    ['tech', 'data'],
  'B.Sc (Science)':                 ['science', 'data'],
  'B.Com (Commerce)':               ['finance', 'business'],
  'BBA / BMS (Business)':           ['business', 'finance'],
  'BA (Arts / Humanities)':         ['media', 'education', 'law'],
  'B.Des (Design)':                 ['design'],
  'MBBS / BDS (Medical)':           ['medical'],
  'LLB / BA LLB (Law)':            ['law'],
  'BCA (Computer Applications)':    ['tech', 'data'],
  'B.Arch (Architecture)':          ['design'],
  'BPharm (Pharmacy)':              ['medical', 'science'],
  'Diploma / ITI':                  ['tech'],
  'Other / Not sure yet':           [],
};

/** Maps 11th/12th Streams to fields */
export const SCHOOL_STREAM_MAP: Record<string, string[]> = {
  'science_math': ['tech', 'data', 'science', 'business'],
  'science_bio':  ['medical', 'science', 'education'],
  'commerce':     ['finance', 'business', 'law'],
  'arts':         ['design', 'media', 'education', 'law'],
};

/* ============  PASSWORD VALIDATION (client-side)  ============ */

/** Password validation: min 8 chars, 1 uppercase, 1 digit, 1 special */
export function validatePassword(pw: string): string | null {
  if (pw.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(pw)) return 'Password must contain an uppercase letter';
  if (!/[0-9]/.test(pw)) return 'Password must contain a number';
  if (!/[^A-Za-z0-9]/.test(pw)) return 'Password must contain a special character';
  return null;
}

/* ============  FIREBASE AUTH WRAPPERS  ============ */

export async function fbRegister(
  name: string,
  email: string,
  password: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    return { ok: true };
  } catch (err: unknown) {
    const code = (err as { code?: string }).code ?? '';
    if (code === 'auth/email-already-in-use') {
      return { ok: false, error: 'An account with this email already exists' };
    }
    if (code === 'auth/weak-password') {
      return { ok: false, error: 'Password is too weak' };
    }
    return { ok: false, error: 'Registration failed. Please try again.' };
  }
}

export async function fbLogin(
  email: string,
  password: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    return { ok: true };
  } catch (err: unknown) {
    const code = (err as { code?: string }).code ?? '';
    if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
      return { ok: false, error: 'Invalid email or password' };
    }
    if (code === 'auth/wrong-password') {
      return { ok: false, error: 'Incorrect password' };
    }
    return { ok: false, error: 'Login failed. Please try again.' };
  }
}

export async function fbLogout(): Promise<void> {
  await signOut(auth);
}

/* ============  FIRESTORE STATE  ============ */

const DEFAULT_STATE: AppState = {
  profile: null,
  alignedMatches: null,
  interestMatches: null,
  careerMatches: null,
  chosenCareer: null,
  isCareerAligned: false,
  roadmap: null,
};

function stateDocRef(uid: string) {
  return doc(db, 'users', uid, 'data', 'state');
}

export async function firestoreLoadState(uid: string): Promise<AppState> {
  try {
    const snap = await getDoc(stateDocRef(uid));
    if (snap.exists()) {
      return snap.data() as AppState;
    }
  } catch (err) {
    console.error('Failed to load state from Firestore:', err);
  }
  return { ...DEFAULT_STATE };
}

export function firestoreSaveState(uid: string, state: AppState): void {
  // Fire-and-forget write — don't block UI
  setDoc(stateDocRef(uid), state, { merge: true }).catch((err) => {
    console.error('Failed to save state to Firestore:', err);
  });
}

export function firestoreClearState(uid: string): void {
  deleteDoc(stateDocRef(uid)).catch((err) => {
    console.error('Failed to clear state in Firestore:', err);
  });
}

/* ============  MOTIVATIONAL QUOTES (for career switch)  ============ */

export const MOTIVATIONAL_QUOTES = [
  { text: "Every expert was once a beginner. You've already started — that's more than most people ever do.", author: "Helen Hayes" },
  { text: "It does not matter how slowly you go, as long as you do not stop.", author: "Confucius" },
  { text: "The first 7 days are always the hardest. Push through this, and you'll surprise yourself.", author: "AAI" },
  { text: "Switching is tempting but finishing builds character. Give this path the full 7 days — you owe it to yourself.", author: "AAI" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "Doubt kills more dreams than failure ever will. Trust the process.", author: "Suzy Kassem" },
  { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
];

/* ============  MOCK AI DATA — EXPANDED ACROSS FIELDS  ============ */

// ---- All career options by field ----
const ALL_CAREERS: CareerMatch[] = [
  // --- TECH ---
  { id: 'swe', title: 'Software Engineer', emoji: '💻', matchPercent: 94, field: 'tech', whyItFits: 'Your analytical thinking and love for problem-solving align perfectly with software engineering.', skills: ['Algorithms', 'System Design', 'Full-Stack'], challenges: ['Keeping up with tech', 'Debugging'], dayInLife: 'Coding and meetings.' },
  { id: 'devops', title: 'DevOps Engineer', emoji: '⚙️', matchPercent: 85, field: 'tech', whyItFits: 'You love automating things and infrastructure.', skills: ['Docker', 'CI/CD', 'Cloud'], challenges: ['On-call incidents'], dayInLife: 'Writing infrastructure code.' },
  { id: 'swe_senior', title: 'Senior Engineering Manager', emoji: '🛠️', matchPercent: 88, field: 'tech', whyItFits: 'You excel at system architecture and team leadership.', skills: ['Technical Leadership', 'System Design', 'Agile'], challenges: ['People management vs coding'], dayInLife: 'Architecture planning and 1-on-1s.', isAdvanced: true },
  { id: 'ai_researcher', title: 'AI/ML Engineer', emoji: '🧠', matchPercent: 91, field: 'tech', whyItFits: 'You love the cutting edge of algorithms and neural networks.', skills: ['Python', 'PyTorch', 'Linear Algebra'], challenges: ['Model hallucinations'], dayInLife: 'Training models.' },
  
  // --- DATA ---
  { id: 'datascience', title: 'Data Scientist', emoji: '📊', matchPercent: 87, field: 'data', whyItFits: 'You have a strong curiosity for patterns.', skills: ['Machine Learning', 'Statistics', 'SQL'], challenges: ['Cleaning messy data'], dayInLife: 'Exploratory data analysis.' },
  { id: 'dataanalyst', title: 'Data Analyst', emoji: '📈', matchPercent: 82, field: 'data', whyItFits: 'You enjoy turning raw data into clear stories.', skills: ['Excel', 'SQL', 'Tableau'], challenges: ['Dirty data'], dayInLife: 'Dashboard building.' },
  { id: 'data_director', title: 'Director of Data Analytics', emoji: '📉', matchPercent: 86, field: 'data', whyItFits: 'You drive data-driven strategies at the organizational level.', skills: ['Data Strategy', 'Team Building', 'Business Analytics'], challenges: ['Aligning data with business goals'], dayInLife: 'Strategy meetings and cross-functional alignment.', isAdvanced: true },
  
  // --- DESIGN ---
  { id: 'uxdesign', title: 'UX Designer', emoji: '🎨', matchPercent: 78, field: 'design', whyItFits: 'Empathy for users and creative instincts.', skills: ['Figma', 'User Research'], challenges: ['Balancing user vs business goals'], dayInLife: 'Wireframing.' },
  { id: 'graphicdesign', title: 'Graphic Designer', emoji: '🖌️', matchPercent: 80, field: 'design', whyItFits: 'Strong visual eye and love for colors.', skills: ['Photoshop', 'Illustrator'], challenges: ['Client feedback'], dayInLife: 'Designing social media creatives.' },
  { id: 'design_lead', title: 'Lead Product Designer', emoji: '✨', matchPercent: 85, field: 'design', whyItFits: 'You elevate design systems and mentor junior designers.', skills: ['Design Systems', 'UX Strategy', 'Figma'], challenges: ['Maintaining consistency across teams'], dayInLife: 'Design reviews and strategy planning.', isAdvanced: true },
  { id: 'animator', title: '3D Animator / VFX Artist', emoji: '🎞️', matchPercent: 79, field: 'design', whyItFits: 'You bring static models to life and love cinematic visuals.', skills: ['Maya', 'Blender', 'After Effects'], challenges: ['Render times', 'Frame-by-frame tedium'], dayInLife: 'Keyframe animating a character running.' },
  { id: 'architect', title: 'Architect', emoji: '🏛️', matchPercent: 83, field: 'design', whyItFits: 'You balance aesthetics with structural physics.', skills: ['AutoCAD', 'Spatial Design', 'Building Codes'], challenges: ['Strict regulations'], dayInLife: 'Drafting floor plans.' },

  // --- BUSINESS ---
  { id: 'productmanager', title: 'Product Manager', emoji: '🚀', matchPercent: 88, field: 'business', whyItFits: 'You think big-picture and love strategy.', skills: ['Product Strategy', 'Agile'], challenges: ['Saying no to features'], dayInLife: 'Sprint planning and writing PRDs.' },
  { id: 'marketing', title: 'Marketing Manager', emoji: '📣', matchPercent: 81, field: 'business', whyItFits: 'Creative, data-aware, love crafting messages.', skills: ['Digital Marketing', 'SEO'], challenges: ['Proving ROI'], dayInLife: 'Campaign planning.' },
  { id: 'founder', title: 'Startup Founder / CEO', emoji: '👑', matchPercent: 92, field: 'business', whyItFits: 'You have high risk tolerance and visionary leadership.', skills: ['Fundraising', 'Vision', 'Execution'], challenges: ['Extreme stress', 'Uncertainty'], dayInLife: 'Pitching investors and hiring.', isAdvanced: true },
  { id: 'hr_manager', title: 'HR Manager', emoji: '🤝', matchPercent: 76, field: 'business', whyItFits: 'You deeply care about people culture and organizational health.', skills: ['Conflict Resolution', 'Recruiting', 'Labor Laws'], challenges: ['Difficult terminations'], dayInLife: 'Conducting interviews and resolving disputes.' },

  // --- LAW ---
  { id: 'corporatelawyer', title: 'Corporate Lawyer', emoji: '⚖️', matchPercent: 85, field: 'law', whyItFits: 'Strong analytical skills, enjoy negotiating.', skills: ['Contract Drafting', 'Negotiation'], challenges: ['Long hours'], dayInLife: 'Reviewing merger agreements.' },
  { id: 'legalanalyst', title: 'Legal Analyst', emoji: '📋', matchPercent: 78, field: 'law', whyItFits: 'You enjoy research and organizing information.', skills: ['Legal Research', 'Case Management'], challenges: ['Large volumes of documents'], dayInLife: 'Organizing case files.' },
  { id: 'partner_law', title: 'Law Firm Partner', emoji: '🏛️', matchPercent: 89, field: 'law', whyItFits: 'You excel at client acquisition and high-stakes strategy.', skills: ['Business Development', 'Litigation Strategy'], challenges: ['Revenue targets'], dayInLife: 'Client meetings and court appearances.', isAdvanced: true },

  // --- MEDICAL ---
  { id: 'doctor', title: 'Physician / Surgeon', emoji: '🩺', matchPercent: 90, field: 'medical', whyItFits: 'Deeply empathetic and enjoy helping people.', skills: ['Clinical Diagnosis', 'Anatomy'], challenges: ['Long education path'], dayInLife: 'Morning rounds and seeing patients.' },
  { id: 'healthadmin', title: 'Healthcare Administrator', emoji: '🏥', matchPercent: 76, field: 'medical', whyItFits: 'You want to impact healthcare without being clinical.', skills: ['Hospital Management', 'Budgeting'], challenges: ['Regulatory requirements'], dayInLife: 'Staffing meetings.' },
  { id: 'psychologist', title: 'Clinical Psychologist', emoji: '🛋️', matchPercent: 82, field: 'medical', whyItFits: 'You are an excellent listener and fascinated by human behavior.', skills: ['CBT', 'Active Listening', 'Diagnostics'], challenges: ['Emotional burnout'], dayInLife: 'Conducting therapy sessions.' },

  // --- SCIENCE ---
  { id: 'researcher', title: 'Research Scientist', emoji: '🔬', matchPercent: 86, field: 'science', whyItFits: 'Endlessly curious, love experimentation.', skills: ['Scientific Method', 'Lab Techniques'], challenges: ['Securing funding'], dayInLife: 'Running lab tests.' },
  { id: 'mech_engineer', title: 'Mechanical Engineer', emoji: '⚙️', matchPercent: 84, field: 'science', whyItFits: 'You love understanding how physical machines work.', skills: ['SolidWorks', 'Thermodynamics', 'Materials Science'], challenges: ['Manufacturing constraints'], dayInLife: 'Designing CAD models of engine parts.' },

  // --- MEDIA ---
  { id: 'contentcreator', title: 'Content Creator', emoji: '🎬', matchPercent: 79, field: 'media', whyItFits: 'You love storytelling and connecting with audiences.', skills: ['Video Production', 'Editing'], challenges: ['Algorithm dependency'], dayInLife: 'Filming and editing.' },
  { id: 'journalist', title: 'Journalist', emoji: '📰', matchPercent: 77, field: 'media', whyItFits: 'Curious, love writing and breaking stories.', skills: ['Investigative Research', 'Interviewing'], challenges: ['Tight deadlines'], dayInLife: 'Interviewing sources.' },

  // --- EDUCATION ---
  { id: 'teacher', title: 'Teacher / Educator', emoji: '📚', matchPercent: 83, field: 'education', whyItFits: 'Patient, love explaining concepts.', skills: ['Curriculum Design', 'Classroom Management'], challenges: ['Managing diverse needs'], dayInLife: 'Teaching classes.' },
  { id: 'professor', title: 'University Professor', emoji: '🎓', matchPercent: 87, field: 'education', whyItFits: 'You love deep academic discourse and mentoring adults.', skills: ['Lecturing', 'Publishing Papers', 'Grant Writing'], challenges: ['Tenure track pressure'], dayInLife: 'Giving a lecture to 200 students.', isAdvanced: true },

  // --- FINANCE ---
  { id: 'ca', title: 'Chartered Accountant', emoji: '🧮', matchPercent: 84, field: 'finance', whyItFits: 'You love numbers and financial analysis.', skills: ['Taxation', 'Auditing'], challenges: ['Busy tax seasons'], dayInLife: 'Reviewing financial statements.' },
  { id: 'investmentbanker', title: 'Investment Banker', emoji: '💰', matchPercent: 80, field: 'finance', whyItFits: 'Thrive under pressure, love dealmaking.', skills: ['Financial Modeling', 'Valuation'], challenges: ['80-100 hrs/week'], dayInLife: 'Updating financial models.' },
  { id: 'cfo', title: 'Chief Financial Officer (CFO)', emoji: '🏢', matchPercent: 90, field: 'finance', whyItFits: 'You lead financial strategy for entire corporations.', skills: ['Capital Allocation', 'Risk Management', 'Board Reporting'], challenges: ['Market volatility'], dayInLife: 'Presenting quarterly earnings to the board.', isAdvanced: true },
];

/* ============  QUESTIONS BY CONTEXT  ============ */

/** Generic behavioral questions for ALL users */
export const GENERIC_QUESTIONS = [
  {
    id: 'g1',
    category: 'Personality',
    question: 'When you have a completely free day with no responsibilities, what do you naturally gravitate towards?',
    options: [
      'Tinkering with something — building, fixing, or experimenting',
      'Reading, researching, or learning something new',
      'Creating something — writing, drawing, designing, or making videos',
      'Socializing, organizing events, or helping people',
    ],
  },
  {
    id: 'g2',
    category: 'Work Style',
    question: 'What kind of work environment sounds ideal to you?',
    options: [
      'Quiet and focused — I need deep concentration time',
      'Collaborative — I love brainstorming and working with people',
      'Fast-paced and dynamic — I enjoy changing priorities',
      'Flexible and creative — I want freedom to explore',
    ],
  },
  {
    id: 'g3',
    category: 'Strengths',
    question: "People often compliment you on your ability to...",
    options: [
      'Figure things out logically and solve problems',
      'Explain complex things in simple ways',
      'Come up with creative and original ideas',
      'Stay organized and manage tasks efficiently',
    ],
  },
  {
    id: 'g4',
    category: 'Values',
    question: 'What matters most to you in a career?',
    options: [
      'High salary and financial security',
      'Making a meaningful impact on society',
      'Creative freedom and self-expression',
      'Work-life balance and stability',
      'Continuous learning and intellectual challenge',
    ],
  },
  {
    id: 'g5',
    category: 'Weakness',
    question: 'Which of these challenges resonates most with you?',
    options: [
      "I get bored easily — I need variety and new challenges",
      "I overthink decisions and struggle to commit",
      "I avoid confrontation and find it hard to lead",
      "I tend to procrastinate unless I am really passionate",
    ],
  },
];

/** Extra questions for college students */
export const COLLEGE_QUESTIONS = [
  {
    id: 'c1',
    category: 'Academic Experience',
    question: 'How do you feel about your current field of study?',
    options: [
      'I love it — it genuinely excites me',
      'It is okay — some subjects are interesting, some are not',
      'I chose it because of family/peer advice, not sure if it is right',
      'I am struggling and considering a change',
    ],
  },
  {
    id: 'c2',
    category: 'Practical Exposure',
    question: 'Have you done any internships, projects, or hands-on work related to a career?',
    options: [
      'Yes, I have internship/project experience in my field',
      'I have done personal projects or freelance work',
      'I have explored through online courses and certifications',
      'No, I have not had any practical exposure yet',
    ],
  },
];

/** Extra questions for working professionals considering a switch */
export const WORKING_QUESTIONS = [
  {
    id: 'w1',
    category: 'Current Role',
    question: 'What is the main reason you want to explore a career change?',
    options: [
      'I am not passionate about my current work',
      'I want better pay or growth opportunities',
      'I want a better work-life balance',
      'I discovered a new interest and want to pursue it',
    ],
  },
];

/** Extra questions for exploring */
export const EXPLORING_QUESTIONS = [
  {
    id: 'e1',
    category: 'Free Time',
    question: 'How do you prefer to spend your free time?',
    options: [
      'Creating or designing things',
      'Figuring out how things work',
      'Organizing, planning, or leading',
      'Helping or listening to others',
    ],
  },
];

/* ============  MATCHING LOGIC  ============ */

/**
 * Returns fields that the user's academics/degree/work naturally align with.
 */
export function getAlignedFields(profile: UserProfile): string[] {
  if (profile.situation === 'college' && profile.degree) {
    return DEGREE_FIELD_MAP[profile.degree] || [];
  }
  if (profile.situation === 'school' && profile.schoolClass === '11th_12th' && profile.schoolStream) {
    return SCHOOL_STREAM_MAP[profile.schoolStream] || [];
  }
  if (profile.situation === 'working' && profile.workingGoal === 'grow' && profile.currentField) {
    return [profile.currentField];
  }
  // For school <= 10th or exploring or working-change
  return [];
}

/**
 * Splits career matches into two panels:
 * - aligned: careers matching the user's academic/work background
 * - interest: careers matching user's interests but OUTSIDE their background
 */
export function getSplitCareerMatches(profile: UserProfile): {
  aligned: CareerMatch[];
  interest: CareerMatch[];
} {
  const alignedFields = getAlignedFields(profile);
  const { interestedFields, workingGoal } = profile;
  const hasAlignmentContext = alignedFields.length > 0;

  let pool = ALL_CAREERS;

  // Filter pool based on working goal
  if (profile.situation === 'working' && workingGoal === 'grow' && profile.currentField) {
    // If growing, ONLY show careers in their current field, prioritize advanced
    pool = ALL_CAREERS.filter((c) => c.field === profile.currentField);
  } else if (interestedFields && interestedFields.length > 0) {
    pool = ALL_CAREERS.filter((c) => interestedFields.includes(c.field));
  }

  if (pool.length < 4 && workingGoal !== 'grow') {
    const remaining = ALL_CAREERS.filter((c) => !pool.some((p) => p.id === c.id));
    pool = [...pool, ...remaining.slice(0, 6 - pool.length)];
  }

  // Shuffle and score
  const scored = pool.sort(() => 0.5 - Math.random()).map((c, i) => {
    let baseBoost = 0;
    // Boost advanced roles if they want to grow
    if (workingGoal === 'grow' && c.isAdvanced) baseBoost += 15;
    // Penalize advanced roles if they are not growing (so beginners don't get CEO immediately)
    if (workingGoal !== 'grow' && c.isAdvanced) baseBoost -= 15;

    return {
      ...c,
      matchPercent: Math.max(65, Math.min(99, c.matchPercent - i * 3 + Math.floor(Math.random() * 6) + baseBoost)),
    };
  });

  if (!hasAlignmentContext) {
    // School/exploring — no split, all go to "aligned" (general recommendations)
    const topPicks = scored.sort((a, b) => b.matchPercent - a.matchPercent).slice(0, 3);
    return {
      aligned: topPicks.map((c) => ({ ...c, isAligned: true })),
      interest: [],
    };
  }

  // Split: aligned vs interest-only
  const alignedPool = scored.filter((c) => alignedFields.includes(c.field));
  const interestPool = scored.filter((c) => !alignedFields.includes(c.field));

  const aligned = alignedPool
    .sort((a, b) => b.matchPercent - a.matchPercent)
    .slice(0, 3)
    .map((c) => ({ ...c, isAligned: true }));

  const interest = interestPool
    .sort((a, b) => b.matchPercent - a.matchPercent)
    .slice(0, 3)
    .map((c) => ({ ...c, isAligned: false }));

  return { aligned, interest };
}

/** Legacy function — returns all matches combined (for backward compat) */
export function getMockCareerMatches(profile: UserProfile): CareerMatch[] {
  const { aligned, interest } = getSplitCareerMatches(profile);
  return [...aligned, ...interest];
}

/* ============  TRANSITION DATA  ============ */

/** Returns transition/pivot steps when a user picks a career outside their academic field */
export function getTransitionInfo(
  profile: UserProfile,
  career: CareerMatch
): TransitionInfo | null {
  const alignedFields = getAlignedFields(profile);

  // If no academic context or career IS aligned → no transition needed
  if (alignedFields.length === 0 || alignedFields.includes(career.field)) {
    return null;
  }

  const degreeLabel = profile.degree || 'your current background';
  const fieldLabel = CAREER_FIELDS.find((f) => f.id === career.field)?.label || career.field;

  // Generate contextual transition steps based on the target field
  const transitionSteps = getFieldTransitionSteps(career.field, degreeLabel);

  return {
    fromLabel: degreeLabel,
    toLabel: `${career.emoji} ${career.title}`,
    difficulty: getTransitionDifficulty(career.field),
    timeEstimate: getTransitionTimeEstimate(career.field),
    overview: `Your degree in ${degreeLabel} doesn't directly lead to ${fieldLabel}. But that's completely okay — many successful ${career.title}s come from non-traditional backgrounds. Here's what you'll need to bridge the gap:`,
    steps: transitionSteps,
  };
}

function getTransitionDifficulty(targetField: string): 'Low' | 'Medium' | 'High' {
  const highDifficulty = ['medical', 'law'];
  const medDifficulty = ['science', 'finance'];
  if (highDifficulty.includes(targetField)) return 'High';
  if (medDifficulty.includes(targetField)) return 'Medium';
  return 'Low';
}

function getTransitionTimeEstimate(targetField: string): string {
  const estimates: Record<string, string> = {
    tech: '3–6 months of self-study + portfolio building',
    design: '2–4 months of practice + portfolio',
    data: '3–6 months of courses + projects',
    business: '1–3 months of networking + certifications',
    law: '3–5 years (requires LLB/JD degree + bar exam)',
    medical: '5–8 years (requires MBBS/MD + residency)',
    science: '2–4 years (may need an M.Sc or PhD)',
    media: '1–3 months to start creating + 6 months to grow',
    education: '1–2 months to start teaching + B.Ed for formal role',
    finance: '3–12 months (certifications like CA/CFA/CPA)',
  };
  return estimates[targetField] || '3–6 months of focused effort';
}

function getFieldTransitionSteps(targetField: string, currentDegree: string): TransitionStep[] {
  const stepsByField: Record<string, TransitionStep[]> = {
    tech: [
      { icon: '📚', title: 'Learn the Fundamentals', description: 'Start with CS50, freeCodeCamp, or The Odin Project. No degree change needed — tech values skills over degrees.' },
      { icon: '🛠️', title: 'Build Real Projects', description: 'Create 3–5 projects (portfolio website, API, full-stack app) that demonstrate your ability to ship code.' },
      { icon: '🏆', title: 'Get Certified (Optional)', description: 'AWS, Google Cloud, or Meta Frontend certifications boost credibility for someone without a CS degree.' },
      { icon: '🤝', title: 'Network & Apply', description: 'Attend hackathons, contribute to open source, and apply for internships. Many companies hire bootcamp grads and self-taught developers.' },
    ],
    design: [
      { icon: '🎓', title: 'Master Design Tools', description: 'Learn Figma (free), Adobe Creative Suite, and Canva Pro. Take a course on Coursera or Domestika.' },
      { icon: '📁', title: 'Build a Portfolio', description: 'Complete 5+ design projects: redesign a popular app, create brand identities, or design a website from scratch.' },
      { icon: '🧪', title: 'Learn UX Research', description: 'Study user psychology, wireframing, and usability testing. Google UX Design Certificate is a great start.' },
      { icon: '💼', title: 'Freelance First', description: 'Take on freelance projects on Fiverr/Upwork to build experience before applying for full-time roles.' },
    ],
    data: [
      { icon: '🐍', title: 'Learn Python & SQL', description: 'These are the two essential languages. Start with Python (pandas, numpy) and SQL on Mode Analytics.' },
      { icon: '📊', title: 'Master Statistics & ML', description: `Your ${currentDegree} background may already give you an edge in analytical thinking. Build on it with statistics and machine learning courses.` },
      { icon: '📁', title: 'Build a Data Portfolio', description: 'Complete 3+ Kaggle competitions or analysis projects. Show you can clean data, find insights, and communicate results.' },
      { icon: '🎓', title: 'Consider a Master\'s Degree', description: 'An M.Sc in Data Science or Analytics (1–2 years) significantly boosts your chances, but is not mandatory.' },
    ],
    law: [
      { icon: '⚠️', title: 'Academic Change Required', description: 'Law typically requires a formal degree (LLB/BA LLB or JD). You will need to appear for entrance exams like CLAT, LSAT, or equivalent.' },
      { icon: '📚', title: 'Prepare for Entrance Exams', description: 'Start preparing for law entrance exams. This is a 6–12 month commitment alongside your current studies.' },
      { icon: '📝', title: 'Explore Legal Tech/Policy', description: `With your ${currentDegree} background, you could also explore legal technology, IPR, or cyber law — fields that bridge your current knowledge with law.` },
      { icon: '🤝', title: 'Talk to Law Professionals', description: 'Connect with practicing lawyers and law students to understand the reality of the profession before committing.' },
    ],
    medical: [
      { icon: '⚠️', title: 'Major Academic Change Required', description: 'Medicine requires MBBS (5.5 years) which needs NEET qualification. This is the most significant career pivot.' },
      { icon: '🔬', title: 'Consider Allied Health', description: `With your ${currentDegree}, you could explore biomedical engineering, healthcare management, public health, or health informatics — these don't require MBBS.` },
      { icon: '📖', title: 'NEET Preparation', description: 'If you are committed to becoming a doctor, you need 1–2 years of focused NEET preparation covering Physics, Chemistry, and Biology.' },
      { icon: '💡', title: 'Explore Alternatives First', description: 'Before committing to a 7+ year path, shadow doctors, volunteer at hospitals, and truly confirm this is your calling.' },
    ],
    business: [
      { icon: '📚', title: 'Learn Business Fundamentals', description: 'Take courses on marketing, strategy, and operations. Harvard Business School Online offers great free courses.' },
      { icon: '🤝', title: 'Build Your Network', description: 'Business is about relationships. Attend industry meetups, join LinkedIn communities, and find mentors in your target industry.' },
      { icon: '🎓', title: 'Consider an MBA (Optional)', description: 'An MBA isn\'t mandatory but opens doors. Prepare for CAT/GMAT if you want to pursue it. Your diverse background is actually an advantage.' },
      { icon: '🚀', title: 'Start Something Small', description: 'Run a small project, freelance gig, or student org to demonstrate leadership and business thinking.' },
    ],
    science: [
      { icon: '📖', title: 'Strengthen Your Foundation', description: 'Take advanced courses in your target science (biology, chemistry, physics) through NPTEL, MIT OCW, or Coursera.' },
      { icon: '🔬', title: 'Get Lab Experience', description: 'Apply for research assistant positions at universities. Hands-on lab experience is crucial for a science career.' },
      { icon: '🎓', title: 'Consider M.Sc / PhD', description: 'A postgraduate degree is almost essential for a research career. Start preparing for entrance exams like JAM, GATE, or GRE.' },
      { icon: '📝', title: 'Publish & Collaborate', description: 'Even as an undergrad, try to co-author a research paper or present at a conference to build your academic profile.' },
    ],
    media: [
      { icon: '📱', title: 'Start Creating Today', description: 'Media doesn\'t require a degree switch. Start a YouTube channel, blog, podcast, or Instagram page right now.' },
      { icon: '🎬', title: 'Learn Production Skills', description: 'Master video editing (Premiere Pro/DaVinci), writing, or graphic design. These are your core tools.' },
      { icon: '📈', title: 'Build an Audience', description: 'Consistency is key. Post regularly, engage with your community, and study what content resonates.' },
      { icon: '💰', title: 'Monetize Over Time', description: 'Brand deals, ad revenue, and sponsorships come after you build an audience. Your 7-day plan will get you started.' },
    ],
    education: [
      { icon: '📚', title: 'Start Tutoring Immediately', description: 'You don\'t need a degree to start. Tutor juniors, volunteer at NGOs, or teach on platforms like Unacademy, Byju\'s.' },
      { icon: '🎓', title: 'Get Certified (B.Ed)', description: 'For formal teaching roles in schools, you\'ll eventually need a B.Ed (1–2 years). But you can start teaching NOW.' },
      { icon: '💻', title: 'Explore EdTech', description: `Your ${currentDegree} combined with teaching skills is powerful. Consider roles in EdTech: curriculum design, instructional design, or teacher training.` },
      { icon: '🧠', title: 'Develop Your Teaching Style', description: 'Study pedagogy, classroom management, and different learning styles. Practice explaining complex topics simply.' },
    ],
    finance: [
      { icon: '📊', title: 'Learn Financial Fundamentals', description: 'Start with accounting basics, financial statements, and Excel mastery. Investopedia and Khan Academy are great free resources.' },
      { icon: '🎓', title: 'Pursue Certifications', description: 'CA (Chartered Accountant), CFA (Chartered Financial Analyst), or CPA — pick one certification track and start preparing.' },
      { icon: '📈', title: 'Practice with Real Data', description: 'Analyze real company financial statements, calculate ratios, and practice stock valuation using free tools.' },
      { icon: '💼', title: 'Get Industry Exposure', description: 'Apply for finance internships, join investment clubs, or start a virtual stock portfolio to build practical experience.' },
    ],
  };

  return stepsByField[targetField] || [
    { icon: '🔍', title: 'Research the Path', description: 'Understand the qualifications, skills, and experience needed for this career.' },
    { icon: '📚', title: 'Fill Knowledge Gaps', description: 'Identify what you need to learn and find courses, books, or mentors to guide you.' },
    { icon: '🛠️', title: 'Build Practical Experience', description: 'Start with small projects, freelancing, or volunteering to gain hands-on experience.' },
    { icon: '🤝', title: 'Network with Professionals', description: 'Connect with people already in this field for advice, mentorship, and opportunities.' },
  ];
}

/* ============  ROADMAP DATA  ============ */

export function getMockRoadmap(career: CareerMatch): RoadmapDay[] {
  const roadmaps: Record<string, RoadmapDay[]> = {
    swe: [
      { day: 1, title: 'Foundations', tasks: [
        { id: '1-1', text: 'Set up your development environment (VS Code, Git, Node.js)', done: false },
        { id: '1-2', text: 'Learn core programming concepts: variables, loops, functions', done: false },
        { id: '1-3', text: 'Complete a "Hello World" project in JavaScript or Python', done: false },
      ]},
      { day: 2, title: 'Data Structures Basics', tasks: [
        { id: '2-1', text: 'Learn Arrays, Strings, and Hash Maps', done: false },
        { id: '2-2', text: 'Solve 3 easy problems on LeetCode', done: false },
        { id: '2-3', text: 'Write notes summarizing Big-O notation', done: false },
      ]},
      { day: 3, title: 'Build a Mini Project', tasks: [
        { id: '3-1', text: 'Create a simple To-Do app with HTML, CSS, JS', done: false },
        { id: '3-2', text: 'Add local storage for persistence', done: false },
        { id: '3-3', text: 'Push the project to GitHub', done: false },
      ]},
      { day: 4, title: 'Backend Introduction', tasks: [
        { id: '4-1', text: 'Learn what APIs are and how HTTP works', done: false },
        { id: '4-2', text: 'Build a simple REST API with Express or FastAPI', done: false },
        { id: '4-3', text: 'Test your API with Postman', done: false },
      ]},
      { day: 5, title: 'Databases & Storage', tasks: [
        { id: '5-1', text: 'Learn SQL basics: SELECT, INSERT, JOIN', done: false },
        { id: '5-2', text: 'Set up SQLite and connect it to your API', done: false },
        { id: '5-3', text: 'Build a CRUD endpoint connected to your database', done: false },
      ]},
      { day: 6, title: 'Full-Stack Integration', tasks: [
        { id: '6-1', text: 'Connect your To-Do frontend to your backend API', done: false },
        { id: '6-2', text: 'Handle loading states and error messages in UI', done: false },
        { id: '6-3', text: 'Add a README with setup instructions to your repo', done: false },
      ]},
      { day: 7, title: 'Publish & Reflect', tasks: [
        { id: '7-1', text: 'Deploy your app to Vercel or Netlify', done: false },
        { id: '7-2', text: 'Write a blog post or LinkedIn post about what you built', done: false },
        { id: '7-3', text: 'Plan your next learning goals for the coming month', done: false },
      ]},
    ],
    datascience: [
      { day: 1, title: 'Python Essentials', tasks: [
        { id: '1-1', text: 'Install Anaconda and set up Jupyter Notebook', done: false },
        { id: '1-2', text: 'Learn Python basics: lists, dicts, pandas intro', done: false },
        { id: '1-3', text: 'Load and explore a CSV dataset in a notebook', done: false },
      ]},
      { day: 2, title: 'Data Wrangling', tasks: [
        { id: '2-1', text: 'Clean a messy dataset: handle nulls, duplicates, types', done: false },
        { id: '2-2', text: 'Create summary statistics and describe patterns', done: false },
        { id: '2-3', text: 'Learn groupby, merge, and pivot operations in pandas', done: false },
      ]},
      { day: 3, title: 'Visualization', tasks: [
        { id: '3-1', text: 'Create 5 different chart types with matplotlib/seaborn', done: false },
        { id: '3-2', text: 'Build an interactive dashboard with Plotly', done: false },
        { id: '3-3', text: 'Tell a data story: write insights for each visualization', done: false },
      ]},
      { day: 4, title: 'Statistics Crash Course', tasks: [
        { id: '4-1', text: 'Learn mean, median, standard deviation, correlation', done: false },
        { id: '4-2', text: 'Understand hypothesis testing and p-values', done: false },
        { id: '4-3', text: 'Run a statistical test on your dataset', done: false },
      ]},
      { day: 5, title: 'Machine Learning Intro', tasks: [
        { id: '5-1', text: 'Learn supervised vs unsupervised learning', done: false },
        { id: '5-2', text: 'Train a linear regression model with scikit-learn', done: false },
        { id: '5-3', text: 'Evaluate model accuracy and interpret results', done: false },
      ]},
      { day: 6, title: 'Real ML Project', tasks: [
        { id: '6-1', text: 'Pick a Kaggle dataset and define a prediction goal', done: false },
        { id: '6-2', text: 'Feature engineering, train/test split, model selection', done: false },
        { id: '6-3', text: 'Submit your predictions and check your leaderboard score', done: false },
      ]},
      { day: 7, title: 'Portfolio & Next Steps', tasks: [
        { id: '7-1', text: 'Create a GitHub repo with your notebook and README', done: false },
        { id: '7-2', text: 'Share your project on LinkedIn & Kaggle', done: false },
        { id: '7-3', text: 'List 3 advanced topics to study next (NLP, Deep Learning, etc.)', done: false },
      ]},
    ],
    uxdesign: [
      { day: 1, title: 'UX Fundamentals', tasks: [
        { id: '1-1', text: 'Read about UX principles: usability, accessibility, empathy', done: false },
        { id: '1-2', text: "Analyze 3 apps you use daily: what's good/bad about their UX?", done: false },
        { id: '1-3', text: 'Install Figma and explore the interface', done: false },
      ]},
      { day: 2, title: 'User Research', tasks: [
        { id: '2-1', text: 'Write a user interview script for a food delivery app', done: false },
        { id: '2-2', text: 'Interview 2 friends using your script', done: false },
        { id: '2-3', text: 'Create an affinity map from your research insights', done: false },
      ]},
      { day: 3, title: 'Wireframing', tasks: [
        { id: '3-1', text: 'Sketch low-fi wireframes for 5 screens on paper', done: false },
        { id: '3-2', text: 'Convert your best sketches into Figma wireframes', done: false },
        { id: '3-3', text: 'Get feedback from someone and iterate', done: false },
      ]},
      { day: 4, title: 'Visual Design', tasks: [
        { id: '4-1', text: 'Choose a color palette, typography, and spacing system', done: false },
        { id: '4-2', text: 'Create a mini design system in Figma (buttons, cards, inputs)', done: false },
        { id: '4-3', text: 'Apply your design system to one wireframe screen', done: false },
      ]},
      { day: 5, title: 'Prototyping', tasks: [
        { id: '5-1', text: 'Build an interactive prototype in Figma (link screens, add transitions)', done: false },
        { id: '5-2', text: 'Add micro-interactions and hover states', done: false },
        { id: '5-3', text: 'Test the prototype yourself: is the flow intuitive?', done: false },
      ]},
      { day: 6, title: 'Usability Testing', tasks: [
        { id: '6-1', text: 'Run a usability test with 2-3 participants', done: false },
        { id: '6-2', text: 'Document pain points and confusion areas', done: false },
        { id: '6-3', text: 'Iterate on your design based on feedback', done: false },
      ]},
      { day: 7, title: 'Portfolio Piece', tasks: [
        { id: '7-1', text: 'Write a UX case study: problem, process, solution', done: false },
        { id: '7-2', text: 'Create a Behance or Dribbble post showcasing your work', done: false },
        { id: '7-3', text: 'Identify 3 areas to grow: animation, accessibility, or research', done: false },
      ]},
    ],
    corporatelawyer: [
      { day: 1, title: 'Legal Foundations', tasks: [
        { id: '1-1', text: 'Read about the Indian/US legal system structure', done: false },
        { id: '1-2', text: 'Understand the difference between civil and criminal law', done: false },
        { id: '1-3', text: 'Explore what corporate lawyers actually do daily', done: false },
      ]},
      { day: 2, title: 'Contract Basics', tasks: [
        { id: '2-1', text: 'Learn the elements of a valid contract', done: false },
        { id: '2-2', text: 'Read and analyze a sample NDA (Non-Disclosure Agreement)', done: false },
        { id: '2-3', text: 'Draft a simple service agreement from scratch', done: false },
      ]},
      { day: 3, title: 'Legal Research', tasks: [
        { id: '3-1', text: 'Learn how to use legal research tools (e.g. SCC Online, Westlaw)', done: false },
        { id: '3-2', text: 'Research and summarize a landmark corporate law case', done: false },
        { id: '3-3', text: 'Write a 1-page legal opinion on a hypothetical scenario', done: false },
      ]},
      { day: 4, title: 'Corporate Governance', tasks: [
        { id: '4-1', text: 'Study the Companies Act basics: directors, shareholders, meetings', done: false },
        { id: '4-2', text: 'Review a real company board resolution template', done: false },
        { id: '4-3', text: 'Understand compliance requirements for startups', done: false },
      ]},
      { day: 5, title: 'Negotiation Skills', tasks: [
        { id: '5-1', text: 'Watch a masterclass on negotiation techniques', done: false },
        { id: '5-2', text: 'Practice a mock negotiation scenario with a friend', done: false },
        { id: '5-3', text: 'Write down your negotiation framework and key principles', done: false },
      ]},
      { day: 6, title: 'Real Case Study', tasks: [
        { id: '6-1', text: 'Pick a recent corporate litigation case and read the judgment', done: false },
        { id: '6-2', text: 'Analyze both sides of the argument', done: false },
        { id: '6-3', text: 'Write a 500-word summary with your own analysis', done: false },
      ]},
      { day: 7, title: 'Career Roadmap', tasks: [
        { id: '7-1', text: 'Research law schools, entrance exams (CLAT, LSAT), or bar requirements', done: false },
        { id: '7-2', text: 'Connect with 2 lawyers on LinkedIn and ask for advice', done: false },
        { id: '7-3', text: 'Create a 3-month study plan for your legal career journey', done: false },
      ]},
    ],
    doctor: [
      { day: 1, title: 'Medical Foundations', tasks: [
        { id: '1-1', text: 'Review basic human anatomy: major organ systems', done: false },
        { id: '1-2', text: 'Watch a documentary on a day in the life of a doctor', done: false },
        { id: '1-3', text: 'Research the medical education path (MBBS, USMLE, residency)', done: false },
      ]},
      { day: 2, title: 'Biology Deep Dive', tasks: [
        { id: '2-1', text: 'Study cell biology: cell structure, DNA, and genetics basics', done: false },
        { id: '2-2', text: 'Learn about the cardiovascular system in detail', done: false },
        { id: '2-3', text: 'Take a quiz on Khan Academy biology to test your knowledge', done: false },
      ]},
      { day: 3, title: 'First Aid & Emergency', tasks: [
        { id: '3-1', text: 'Learn CPR and basic first aid (watch certified tutorials)', done: false },
        { id: '3-2', text: 'Understand common symptoms and when to seek emergency care', done: false },
        { id: '3-3', text: 'Create a first aid reference card for yourself', done: false },
      ]},
      { day: 4, title: 'Clinical Exposure', tasks: [
        { id: '4-1', text: 'Shadow a doctor or visit a local clinic (if possible)', done: false },
        { id: '4-2', text: 'Watch surgical procedure videos on medical education platforms', done: false },
        { id: '4-3', text: 'Write reflections on what excited or challenged you', done: false },
      ]},
      { day: 5, title: 'Medical Ethics', tasks: [
        { id: '5-1', text: 'Study the Hippocratic Oath and medical ethics principles', done: false },
        { id: '5-2', text: 'Read about a medical ethics dilemma and write your opinion', done: false },
        { id: '5-3', text: 'Understand patient confidentiality and informed consent', done: false },
      ]},
      { day: 6, title: 'Specialization Research', tasks: [
        { id: '6-1', text: 'Explore different medical specializations (surgery, pediatrics, psychiatry)', done: false },
        { id: '6-2', text: 'Interview or message a specialist doctor about their journey', done: false },
        { id: '6-3', text: 'List your top 3 specializations of interest with reasons', done: false },
      ]},
      { day: 7, title: 'Your Medical Journey Plan', tasks: [
        { id: '7-1', text: 'Create a study plan for NEET/MCAT/entrance exam preparation', done: false },
        { id: '7-2', text: 'Join a medical aspirants community online', done: false },
        { id: '7-3', text: 'Write a personal statement about why medicine is your calling', done: false },
      ]},
    ],
    productmanager: [
      { day: 1, title: 'PM Fundamentals', tasks: [
        { id: '1-1', text: 'Read "What is a Product Manager?" by Lenny Rachitsky', done: false },
        { id: '1-2', text: 'Understand the product lifecycle: ideation to launch', done: false },
        { id: '1-3', text: 'Analyze a product you love — why does it work?', done: false },
      ]},
      { day: 2, title: 'User Research', tasks: [
        { id: '2-1', text: 'Conduct 3 user interviews about a product pain point', done: false },
        { id: '2-2', text: 'Create user personas based on your findings', done: false },
        { id: '2-3', text: 'Map the user journey for a common task', done: false },
      ]},
      { day: 3, title: 'PRD Writing', tasks: [
        { id: '3-1', text: 'Pick a feature idea and write a 1-page product requirements doc', done: false },
        { id: '3-2', text: 'Define success metrics (KPIs) for your feature', done: false },
        { id: '3-3', text: 'Prioritize features using the RICE framework', done: false },
      ]},
      { day: 4, title: 'Design & Wireframes', tasks: [
        { id: '4-1', text: 'Sketch wireframes for your feature (pen and paper)', done: false },
        { id: '4-2', text: 'Create a simple prototype in Figma', done: false },
        { id: '4-3', text: 'Get feedback from 2 people and iterate', done: false },
      ]},
      { day: 5, title: 'Agile & Execution', tasks: [
        { id: '5-1', text: 'Learn Agile/Scrum methodology basics', done: false },
        { id: '5-2', text: 'Write user stories with acceptance criteria', done: false },
        { id: '5-3', text: 'Create a sprint plan for your feature', done: false },
      ]},
      { day: 6, title: 'Analytics & Metrics', tasks: [
        { id: '6-1', text: 'Set up Google Analytics for any website you own', done: false },
        { id: '6-2', text: 'Analyze metrics: DAU, retention, conversion funnels', done: false },
        { id: '6-3', text: 'Write a data-driven recommendation for your product', done: false },
      ]},
      { day: 7, title: 'Portfolio & Networking', tasks: [
        { id: '7-1', text: 'Write a PM case study of your feature idea', done: false },
        { id: '7-2', text: 'Connect with 3 PMs on LinkedIn and ask for coffee chats', done: false },
        { id: '7-3', text: 'Plan your PM learning path for the next month', done: false },
      ]},
    ],
    ca: [
      { day: 1, title: 'Accounting Basics', tasks: [
        { id: '1-1', text: 'Learn the accounting equation: Assets = Liabilities + Equity', done: false },
        { id: '1-2', text: 'Understand debit/credit rules for journal entries', done: false },
        { id: '1-3', text: 'Practice 10 basic journal entries', done: false },
      ]},
      { day: 2, title: 'Financial Statements', tasks: [
        { id: '2-1', text: 'Read and understand a real company balance sheet', done: false },
        { id: '2-2', text: 'Learn to prepare an income statement (P&L)', done: false },
        { id: '2-3', text: 'Analyze the cash flow statement of a listed company', done: false },
      ]},
      { day: 3, title: 'Taxation Intro', tasks: [
        { id: '3-1', text: 'Study basic income tax slabs and deductions', done: false },
        { id: '3-2', text: 'Learn about GST: input credit, filing, and compliance', done: false },
        { id: '3-3', text: 'Calculate tax liability for a sample scenario', done: false },
      ]},
      { day: 4, title: 'Auditing Basics', tasks: [
        { id: '4-1', text: 'Understand what an audit is and why companies need it', done: false },
        { id: '4-2', text: 'Learn the types of audits: internal, external, statutory', done: false },
        { id: '4-3', text: 'Review a sample audit report and understand its sections', done: false },
      ]},
      { day: 5, title: 'Excel & Tally', tasks: [
        { id: '5-1', text: 'Master Excel formulas: VLOOKUP, SUMIF, Pivot Tables', done: false },
        { id: '5-2', text: 'Set up Tally and create a sample company', done: false },
        { id: '5-3', text: 'Record 20 transactions in Tally with GST', done: false },
      ]},
      { day: 6, title: 'Financial Analysis', tasks: [
        { id: '6-1', text: 'Calculate key financial ratios: ROE, debt-to-equity, current ratio', done: false },
        { id: '6-2', text: 'Compare financial ratios of 2 companies in the same industry', done: false },
        { id: '6-3', text: 'Write a 1-page financial health report', done: false },
      ]},
      { day: 7, title: 'CA Career Planning', tasks: [
        { id: '7-1', text: 'Understand the CA exam structure: Foundation, Inter, Final', done: false },
        { id: '7-2', text: 'Register on the ICAI website and explore resources', done: false },
        { id: '7-3', text: 'Create a 6-month study plan for CA Foundation', done: false },
      ]},
    ],
    contentcreator: [
      { day: 1, title: 'Find Your Niche', tasks: [
        { id: '1-1', text: 'List 5 topics you can talk about passionately for hours', done: false },
        { id: '1-2', text: 'Research successful creators in those niches', done: false },
        { id: '1-3', text: 'Pick ONE niche and define your unique angle', done: false },
      ]},
      { day: 2, title: 'Content Planning', tasks: [
        { id: '2-1', text: 'Script your first video/post (hook, body, CTA)', done: false },
        { id: '2-2', text: 'Create a content calendar for the next 2 weeks', done: false },
        { id: '2-3', text: 'Study trending formats on YouTube/Instagram/Twitter', done: false },
      ]},
      { day: 3, title: 'Production', tasks: [
        { id: '3-1', text: 'Set up basic equipment: phone camera, lighting, microphone', done: false },
        { id: '3-2', text: 'Film or create your first piece of content', done: false },
        { id: '3-3', text: 'Learn basic editing in CapCut, Premiere Pro, or DaVinci Resolve', done: false },
      ]},
      { day: 4, title: 'Editing & Polish', tasks: [
        { id: '4-1', text: 'Edit your content with cuts, text overlays, and music', done: false },
        { id: '4-2', text: 'Create an eye-catching thumbnail or cover image', done: false },
        { id: '4-3', text: 'Write an SEO-optimized title and description', done: false },
      ]},
      { day: 5, title: 'Publish & Learn', tasks: [
        { id: '5-1', text: 'Publish your first piece of content on your chosen platform', done: false },
        { id: '5-2', text: 'Share it with friends and ask for honest feedback', done: false },
        { id: '5-3', text: 'Analyze initial metrics: views, watch time, engagement', done: false },
      ]},
      { day: 6, title: 'Growth Strategy', tasks: [
        { id: '6-1', text: 'Study SEO and algorithm tips for your platform', done: false },
        { id: '6-2', text: 'Engage with 10 creators in your niche (comments, collabs)', done: false },
        { id: '6-3', text: 'Create your second piece of content, applying lessons learned', done: false },
      ]},
      { day: 7, title: 'Build the Habit', tasks: [
        { id: '7-1', text: 'Set up a consistent posting schedule you can maintain', done: false },
        { id: '7-2', text: 'Create a brand kit: logo, colors, bio, and tone of voice', done: false },
        { id: '7-3', text: 'Write down your 100-day content creation goal', done: false },
      ]},
    ],
    teacher: [
      { day: 1, title: 'Teaching Foundations', tasks: [
        { id: '1-1', text: 'Study different teaching methodologies: Montessori, Socratic, Flipped', done: false },
        { id: '1-2', text: 'Identify a subject you can teach confidently', done: false },
        { id: '1-3', text: 'Watch a TED talk on innovating education', done: false },
      ]},
      { day: 2, title: 'Lesson Planning', tasks: [
        { id: '2-1', text: 'Create a lesson plan for a 30-minute class', done: false },
        { id: '2-2', text: 'Include an icebreaker, core concept, and an activity', done: false },
        { id: '2-3', text: 'Design a simple quiz or assessment for the lesson', done: false },
      ]},
      { day: 3, title: 'Teach a Session', tasks: [
        { id: '3-1', text: 'Teach a mini-class to a friend, sibling, or online', done: false },
        { id: '3-2', text: 'Record yourself and review your teaching style', done: false },
        { id: '3-3', text: 'Collect feedback and note areas for improvement', done: false },
      ]},
      { day: 4, title: 'EdTech Tools', tasks: [
        { id: '4-1', text: 'Explore tools: Google Classroom, Kahoot, Notion, Canva for Education', done: false },
        { id: '4-2', text: 'Create an interactive presentation using one of these tools', done: false },
        { id: '4-3', text: 'Set up a simple class page on Google Classroom', done: false },
      ]},
      { day: 5, title: 'Student Psychology', tasks: [
        { id: '5-1', text: 'Learn about different learning styles: visual, auditory, kinesthetic', done: false },
        { id: '5-2', text: 'Understand classroom management techniques', done: false },
        { id: '5-3', text: 'Read about motivating disengaged students', done: false },
      ]},
      { day: 6, title: 'Curriculum Design', tasks: [
        { id: '6-1', text: 'Map out a 4-week curriculum for your chosen subject', done: false },
        { id: '6-2', text: 'Include assessments, projects, and group activities', done: false },
        { id: '6-3', text: 'Align your curriculum with learning outcomes', done: false },
      ]},
      { day: 7, title: 'Your Teaching Path', tasks: [
        { id: '7-1', text: 'Research teaching certifications (B.Ed, CELTA, teaching fellowships)', done: false },
        { id: '7-2', text: 'Apply to volunteer teaching programs or tutoring platforms', done: false },
        { id: '7-3', text: 'Write a personal teaching philosophy statement', done: false },
      ]},
    ],
  };

  // For careers without a specific roadmap, generate a generic one
  if (roadmaps[career.id]) {
    return roadmaps[career.id];
  }

  // Fallback: generic exploration roadmap tailored to the career title
  return [
    { day: 1, title: `Discover ${career.title}`, tasks: [
      { id: '1-1', text: `Research what a ${career.title} does on a daily basis`, done: false },
      { id: '1-2', text: `Watch 2 YouTube videos or read 2 articles about ${career.title} careers`, done: false },
      { id: '1-3', text: 'Write down what excites you and what worries you about this path', done: false },
    ]},
    { day: 2, title: 'Core Skills', tasks: [
      { id: '2-1', text: `Identify the top 5 skills needed for a ${career.title}`, done: false },
      { id: '2-2', text: 'Rate yourself on each skill (1-10) honestly', done: false },
      { id: '2-3', text: 'Pick 1 skill gap and find a free resource to start learning it', done: false },
    ]},
    { day: 3, title: 'Hands-On Practice', tasks: [
      { id: '3-1', text: `Find a beginner project or exercise related to ${career.title}`, done: false },
      { id: '3-2', text: 'Spend 2 hours working on it', done: false },
      { id: '3-3', text: 'Document what you learned and where you got stuck', done: false },
    ]},
    { day: 4, title: 'Talk to a Professional', tasks: [
      { id: '4-1', text: `Find 2 ${career.title}s on LinkedIn and send connection requests`, done: false },
      { id: '4-2', text: 'Prepare 5 insightful questions to ask them', done: false },
      { id: '4-3', text: 'Schedule or send a coffee chat message', done: false },
    ]},
    { day: 5, title: 'Deep Dive Project', tasks: [
      { id: '5-1', text: 'Take on a more challenging project or case study', done: false },
      { id: '5-2', text: 'Spend 3+ focused hours working on it', done: false },
      { id: '5-3', text: 'Ask for feedback from someone knowledgeable', done: false },
    ]},
    { day: 6, title: 'Education Path', tasks: [
      { id: '6-1', text: `Research certifications, courses, or degrees for ${career.title}`, done: false },
      { id: '6-2', text: 'Compare 3 options and make a pros/cons list', done: false },
      { id: '6-3', text: 'Enroll in one free introductory course or resource', done: false },
    ]},
    { day: 7, title: 'Reflect & Plan Forward', tasks: [
      { id: '7-1', text: 'Write a 1-page reflection: Is this career truly for me?', done: false },
      { id: '7-2', text: 'Create a 30-day plan to continue exploring or committing', done: false },
      { id: '7-3', text: 'Share your 7-day journey on LinkedIn or with a mentor', done: false },
    ]},
  ];
}
