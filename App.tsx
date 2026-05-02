
import React, { useState, useEffect } from 'react';
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
import PublicLandingPage from './pages/PublicLandingPage';
import { User, UserRole } from './types';
import { auth, syncUserToFirestore, logoutUser } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // If we have a firebase user, sync it to firestore
          const cachedRole = localStorage.getItem('pending_role') as UserRole || 'STUDENT';
          const syncedUser = await syncUserToFirestore(firebaseUser, cachedRole);
          setUser(syncedUser);
          localStorage.removeItem('pending_role');
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white font-medium">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
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
          user && user.role === 'STUDENT' ? <SubscriptionManagement user={user} onLogout={handleLogout} /> : <Navigate to="/" />
        } />

        <Route path="/" element={
          !user ? <Navigate to="/login" /> : 
          showOnboarding ? <Navigate to="/onboarding" /> :
          user.role === 'ADMIN' ? <AdminDashboard user={user} onLogout={handleLogout} /> :
          user.role === 'TRAINER' ? <TrainerDashboard user={user} onLogout={handleLogout} /> :
          <StudentDashboard user={user} onLogout={handleLogout} />
        } />
        
        <Route path="/@:username" element={<PublicLandingPage />} />
        <Route path="/:username" element={<PublicLandingPage />} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;
