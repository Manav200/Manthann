import { useNavigate } from 'react-router-dom';
import { ArrowRight, AlertTriangle, Calendar, Rocket } from 'lucide-react';
import { useAppState } from '../contexts/AuthContext';
import './Roadmap.css';

export default function Roadmap() {
  const navigate = useNavigate();
  const { appState } = useAppState();
  const { chosenCareer, roadmap } = appState;

  if (!chosenCareer || !roadmap) {
    return (
      <div className="roadmap-page page-enter">
        <div className="no-data glass-card">
          <AlertTriangle size={32} style={{ color: 'var(--color-accent-orange)' }} />
          <h3>No Roadmap Yet</h3>
          <p>You need to complete profiling and lock in a career first.</p>
          <button className="btn btn-primary" onClick={() => navigate('/profiling')}>
            Start Profiling <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="roadmap-page page-enter">
      <div className="section roadmap-section">
        <div className="roadmap-header glass-card">
          <div className="roadmap-header-left">
            <span className="badge badge-green"><Rocket size={14} /> Your Execution Plan</span>
            <h2>
              7-Day Roadmap: <span className="gradient-text">{chosenCareer.emoji} {chosenCareer.title}</span>
            </h2>
            <p>Real tasks. Real output. One week to launch your career journey.</p>
          </div>
        </div>

        <div className="roadmap-days">
          {roadmap.map((day) => (
            <div key={day.day} className="roadmap-day glass-card">
              <div className="day-header">
                <div className="day-badge">
                  <Calendar size={14} />
                  Day {day.day}
                </div>
                <h3>{day.title}</h3>
              </div>
              <ul className="day-tasks">
                {day.tasks.map((task) => (
                  <li key={task.id} className="day-task">
                    <span className="task-bullet" />
                    <span>{task.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="roadmap-cta">
          <p>Ready to start executing?</p>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/tracking')}>
            Start Day 1 <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
