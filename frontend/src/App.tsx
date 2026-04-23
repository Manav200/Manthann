import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Brain } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LandingPage from './pages/LandingPage';
import Register from './pages/Register';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Profiling from './pages/Profiling';
import CareerResults from './pages/CareerResults';
import Simulation from './pages/Simulation';
import Decision from './pages/Decision';
import Roadmap from './pages/Roadmap';
import Tracking from './pages/Tracking';
import AuthGuard from './components/AuthGuard';
import Navbar from './components/Navbar';
import './App.css';

function AppRoutes() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <Brain size={40} className="loading-icon" />
        <p>Loading AAI...</p>
      </div>
    );
  }

  return (
    <div className="app-wrapper">
      <div className="bg-glow" />
      <Navbar />
      <main className="main-content">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />

          {/* Protected routes */}
          <Route path="/profile" element={<AuthGuard><Profile /></AuthGuard>} />
          <Route path="/profiling" element={<AuthGuard><Profiling /></AuthGuard>} />
          <Route path="/careers" element={<AuthGuard><CareerResults /></AuthGuard>} />
          <Route path="/simulation/:careerId" element={<AuthGuard><Simulation /></AuthGuard>} />
          <Route path="/decision" element={<AuthGuard><Decision /></AuthGuard>} />
          <Route path="/roadmap" element={<AuthGuard><Roadmap /></AuthGuard>} />
          <Route path="/tracking" element={<AuthGuard><Tracking /></AuthGuard>} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
