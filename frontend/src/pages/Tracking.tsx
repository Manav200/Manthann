import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, AlertTriangle, CheckCircle2, Circle, Trophy,
  Flame, RotateCcw, X, Heart, Sparkles, RefreshCw
} from 'lucide-react';
import { useAppState } from '../contexts/AuthContext';
import { MOTIVATIONAL_QUOTES } from '../store';
import type { RoadmapDay } from '../store';
import './Tracking.css';

export default function Tracking() {
  const navigate = useNavigate();
  const { appState, setAppState, clearAppState } = useAppState();
  const [activeDay, setActiveDay] = useState(0);
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [motivQuote, setMotivQuote] = useState(MOTIVATIONAL_QUOTES[0]);

  const roadmap = appState.roadmap;

  // Auto-select first incomplete day
  useEffect(() => {
    if (!roadmap) return;
    const firstIncomplete = roadmap.findIndex((d) => d.tasks.some((t) => !t.done));
    setActiveDay(firstIncomplete >= 0 ? firstIncomplete : roadmap.length - 1);
  }, [roadmap]);

  if (!appState.chosenCareer || !roadmap) {
    return (
      <div className="tracking-page page-enter">
        <div className="no-data glass-card">
          <AlertTriangle size={32} style={{ color: 'var(--color-accent-orange)' }} />
          <h3>No Execution Plan</h3>
          <p>Complete profiling and lock in a career to start tracking.</p>
          <button className="btn btn-primary" onClick={() => navigate('/profiling')}>
            Start Profiling <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  const totalTasks = roadmap.reduce((sum, d) => sum + d.tasks.length, 0);
  const doneTasks = roadmap.reduce((sum, d) => sum + d.tasks.filter((t) => t.done).length, 0);
  const overallPercent = Math.round((doneTasks / totalTasks) * 100);

  const currentDay = roadmap[activeDay];
  const dayDone = currentDay.tasks.filter((t) => t.done).length;
  const dayTotal = currentDay.tasks.length;
  const dayPercent = Math.round((dayDone / dayTotal) * 100);

  function toggleTask(taskId: string) {
    const updated: RoadmapDay[] = roadmap!.map((d) => ({
      ...d,
      tasks: d.tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)),
    }));
    setAppState({ roadmap: updated });
  }

  function handleSwitchClick() {
    // Pick a random motivational quote
    const randomQuote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
    setMotivQuote(randomQuote);
    setShowSwitchModal(true);
  }

  function confirmSwitch() {
    clearAppState();
    navigate('/profiling');
  }

  return (
    <div className="tracking-page page-enter">
      <div className="section tracking-section">
        {/* Overview bar */}
        <div className="tracking-overview glass-card">
          <div className="tracking-overview-left">
            <span className="tracking-career-emoji">{appState.chosenCareer.emoji}</span>
            <div>
              <h3>{appState.chosenCareer.title}</h3>
              <p className="tracking-subtitle">7-Day Execution Tracker</p>
            </div>
          </div>
          <div className="tracking-overview-right">
            <div className="overall-progress">
              <div className="overall-ring" style={{ '--pct': `${overallPercent * 3.6}deg` } as React.CSSProperties}>
                <span className="overall-pct">{overallPercent}%</span>
              </div>
              <span className="overall-label">Overall</span>
            </div>
            <div className="streak-badge">
              <Flame size={16} />
              <span>{doneTasks}/{totalTasks} tasks</span>
            </div>
          </div>
        </div>

        <div className="tracking-body">
          {/* Day selector */}
          <div className="day-selector">
            {roadmap.map((d, i) => {
              const dDone = d.tasks.filter((t) => t.done).length;
              const isComplete = dDone === d.tasks.length;
              return (
                <button
                  key={d.day}
                  className={`day-tab ${activeDay === i ? 'day-tab-active' : ''} ${isComplete ? 'day-tab-complete' : ''}`}
                  onClick={() => setActiveDay(i)}
                >
                  {isComplete ? <Trophy size={14} /> : <span className="day-num">{d.day}</span>}
                  <span className="day-tab-label">Day {d.day}</span>
                </button>
              );
            })}
          </div>

          {/* Day detail */}
          <div className="day-detail glass-card">
            <div className="day-detail-header">
              <div>
                <span className="badge badge-blue">Day {currentDay.day}</span>
                <h3>{currentDay.title}</h3>
              </div>
              <div className="day-progress-ring" style={{ '--dpct': `${dayPercent * 3.6}deg` } as React.CSSProperties}>
                <span>{dayDone}/{dayTotal}</span>
              </div>
            </div>

            <div className="day-progress-bar">
              <div className="progress-bar-container">
                <div className="progress-bar-fill" style={{ width: `${dayPercent}%` }} />
              </div>
              <span className="day-pct">{dayPercent}%</span>
            </div>

            <ul className="task-checklist">
              {currentDay.tasks.map((task) => (
                <li
                  key={task.id}
                  className={`task-check-item ${task.done ? 'task-done' : ''}`}
                  onClick={() => toggleTask(task.id)}
                >
                  <span className="check-icon">
                    {task.done ? <CheckCircle2 size={22} /> : <Circle size={22} />}
                  </span>
                  <span className="task-label">{task.text}</span>
                </li>
              ))}
            </ul>

            {dayPercent === 100 && (
              <div className="day-complete-msg">
                <Trophy size={24} style={{ color: '#fbbf24' }} />
                <span>Day {currentDay.day} complete! Amazing work 🎉</span>
              </div>
            )}
          </div>
        </div>

        {overallPercent === 100 && (
          <div className="all-complete glass-card">
            <Trophy size={40} style={{ color: '#fbbf24' }} />
            <h2>Congratulations! 🎉</h2>
            <p>You've completed your entire 7-day execution plan for <strong>{appState.chosenCareer.title}</strong>. You've taken the first real step towards your career.</p>
            <div className="complete-actions">
              <button className="btn btn-primary" onClick={() => { clearAppState(); navigate('/profiling'); }}>
                <Sparkles size={16} /> Explore Another Career
              </button>
            </div>
          </div>
        )}

        {/* Footer with switch career button */}
        <div className="tracking-footer">
          <button className="btn btn-ghost switch-career-btn" onClick={handleSwitchClick}>
            <RefreshCw size={16} /> Want to Switch Career?
          </button>
        </div>
      </div>

      {/* ===== SWITCH CAREER MOTIVATION MODAL ===== */}
      {showSwitchModal && (
        <div className="modal-overlay" onClick={() => setShowSwitchModal(false)}>
          <div className="switch-modal glass-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowSwitchModal(false)}>
              <X size={20} />
            </button>

            <div className="modal-heart">
              <Heart size={32} className="heart-icon" />
            </div>

            <h3>Wait — You're Doing Great! 💪</h3>

            <div className="motiv-quote">
              <p className="quote-text">"{motivQuote.text}"</p>
              <span className="quote-author">— {motivQuote.author}</span>
            </div>

            <div className="switch-progress-info">
              <p>You've completed <strong>{doneTasks} out of {totalTasks}</strong> tasks ({overallPercent}%) in your <strong>{appState.chosenCareer.title}</strong> journey.</p>
              {overallPercent < 50 && (
                <p className="switch-encouragement">
                  You're still in the <strong>exploration phase</strong>. The real clarity comes after Day 4. Give it a few more days before deciding — you might surprise yourself!
                </p>
              )}
              {overallPercent >= 50 && overallPercent < 100 && (
                <p className="switch-encouragement">
                  You're <strong>more than halfway there</strong>! Don't quit now — you're building real skills. Finish the 7 days, and then decide with actual experience under your belt.
                </p>
              )}
            </div>

            <div className="switch-actions">
              <button className="btn btn-primary" onClick={() => setShowSwitchModal(false)}>
                <Flame size={16} /> Keep Going — I'll Finish This!
              </button>
              <button className="btn btn-ghost switch-confirm-btn" onClick={confirmSwitch}>
                <RotateCcw size={14} /> I understand, but I want to start fresh
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
