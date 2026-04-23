import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Coffee, Laptop, Users, BookOpen, CheckCircle } from 'lucide-react';
import { useAppState } from '../contexts/AuthContext';
import './Simulation.css';

const TIME_ICONS: Record<string, React.ReactNode> = {
  '9:00': <Coffee size={18} />,
  '10:00': <Laptop size={18} />,
  '11:30': <Users size={18} />,
  '12:30': <Coffee size={18} />,
  '1:00': <Laptop size={18} />,
  '1:30': <BookOpen size={18} />,
  '2:30': <Laptop size={18} />,
  '3:00': <Users size={18} />,
  '4:00': <BookOpen size={18} />,
  '4:30': <BookOpen size={18} />,
  '5:00': <CheckCircle size={18} />,
  '5:30': <CheckCircle size={18} />,
};

function getIcon(line: string) {
  for (const [time, icon] of Object.entries(TIME_ICONS)) {
    if (line.startsWith(time)) return icon;
  }
  return <Clock size={18} />;
}

export default function Simulation() {
  const { careerId } = useParams();
  const navigate = useNavigate();
  const { appState } = useAppState();
  const career = appState.careerMatches?.find((c) => c.id === careerId);

  if (!career) {
    return (
      <div className="sim-page page-enter">
        <div className="no-data glass-card">
          <h3>Career not found</h3>
          <button className="btn btn-primary" onClick={() => navigate('/careers')}>Back to Results</button>
        </div>
      </div>
    );
  }

  const timelineItems = career.dayInLife.split('\n').filter(Boolean);

  return (
    <div className="sim-page page-enter">
      <div className="section sim-section">
        <button className="btn btn-ghost sim-back" onClick={() => navigate('/careers')}>
          <ArrowLeft size={18} /> Back to Results
        </button>

        <div className="sim-hero glass-card">
          <span className="sim-emoji">{career.emoji}</span>
          <div>
            <span className="badge badge-purple">Career Simulation</span>
            <h2>A Day in the Life of a <span className="gradient-text">{career.title}</span></h2>
            <p>Experience what a real workday looks like. This is not theory — it's the daily reality.</p>
          </div>
        </div>

        <div className="sim-timeline">
          {timelineItems.map((item, i) => {
            const [time, ...rest] = item.split(' – ');
            return (
              <div key={i} className="sim-event glass-card" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="sim-event-icon">{getIcon(item)}</div>
                <div className="sim-event-content">
                  <span className="sim-time">{time.trim()}</span>
                  <p>{rest.join(' – ').trim()}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="sim-footer">
          <p>Does this excite you? If yes, this career might be for you.</p>
          <button className="btn btn-primary" onClick={() => navigate('/decision')}>
            I'm Ready to Decide
          </button>
        </div>
      </div>
    </div>
  );
}
