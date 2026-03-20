
import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Onboarding from './pages/Onboarding';
import AdminDashboard from './pages/AdminDashboard';
import TrainerDashboard from './pages/TrainerDashboard';
import StudentDashboard from './pages/StudentDashboard';
import Checkout from './pages/Checkout';
import PaymentConfirmation from './pages/PaymentConfirmation';
import SubscriptionManagement from './pages/SubscriptionManagement';
import { User } from './types';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const handleLogin = (role: 'ADMIN' | 'TRAINER' | 'STUDENT') => {
    setUser({
      id: '1',
      name: role === 'ADMIN' ? 'Master Admin' : role === 'TRAINER' ? 'Carlos Sousa' : 'João Silva',
      email: 'user@starfit.com',
      role,
      avatar: `https://i.pravatar.cc/150?u=${role}`
    });
    setShowOnboarding(true);
  };

  const handleRegister = (role: 'STUDENT' | 'TRAINER') => {
    handleLogin(role);
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/onboarding" /> : <Login onLogin={handleLogin} />} />
        <Route path="/register" element={user ? <Navigate to="/onboarding" /> : <Register onRegister={handleRegister} />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        
        <Route path="/onboarding" element={
          user && showOnboarding ? <Onboarding onComplete={() => setShowOnboarding(false)} /> : <Navigate to="/" />
        } />

        <Route path="/checkout" element={
          user && user.role === 'STUDENT' ? <Checkout user={user} /> : <Navigate to="/" />
        } />

        <Route path="/payment-confirmation" element={
          user && user.role === 'STUDENT' ? <PaymentConfirmation user={user} /> : <Navigate to="/" />
        } />

        <Route path="/subscription-management" element={
          user && user.role === 'STUDENT' ? <SubscriptionManagement user={user} onLogout={() => setUser(null)} /> : <Navigate to="/" />
        } />

        <Route path="/" element={
          !user ? <Navigate to="/login" /> : 
          showOnboarding ? <Navigate to="/onboarding" /> :
          user.role === 'ADMIN' ? <AdminDashboard user={user} onLogout={() => setUser(null)} /> :
          user.role === 'TRAINER' ? <TrainerDashboard user={user} onLogout={() => setUser(null)} /> :
          <StudentDashboard user={user} onLogout={() => setUser(null)} />
        } />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;
