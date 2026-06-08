
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
import PaymentSuccess from './pages/PaymentSuccess';
import ImpersonateWrapper from './pages/ImpersonateWrapper';
import { User, UserRole } from './types';
import { auth, syncUserToFirestore, logoutUser, db, handleRedirectResult } from './services/firebase';
import { dataService } from './services/dataService';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, onSnapshot } from 'firebase/firestore';

import { PWADashboardBanner } from './components/PWADashboardBanner';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    handleRedirectResult().catch(err => {
      console.error("Error handling redirect result:", err);
    });

    let userUnsubscribe: (() => void) | null = null;
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // If we have a firebase user, sync it to firestore
          const cachedRole = (localStorage.getItem('pending_role') as UserRole) || 'STUDENT';
          const cachedUsername = localStorage.getItem('pending_username');
          await syncUserToFirestore(firebaseUser, cachedRole, cachedUsername || undefined);
          
          // Setup real-time listener for the user document
          if (userUnsubscribe) userUnsubscribe();
          console.log("[AUTH] Configurando listener do Firestore para perfil do usuário:", firebaseUser.uid);
          userUnsubscribe = onSnapshot(doc(db, 'users', firebaseUser.uid), (doc) => {
            if (doc.exists()) {
              console.log("[PERFIL] Perfil carregado com sucesso:", doc.id);
              setUser({ id: doc.id, ...doc.data() } as User);
            } else {
              console.warn("[PERFIL] Documento do usuário não encontrado no Firestore!");
            }
          });

          localStorage.removeItem('pending_role');
          localStorage.removeItem('pending_username');

          // Auto-link logic for pending requests from PublicLandingPage
          const pendingTrainerId = localStorage.getItem('pending_link_trainer_id');
          const pendingConsultMsg = localStorage.getItem('pending_consult_plan_message');
          if (pendingTrainerId && pendingTrainerId !== 'null' && pendingTrainerId !== 'undefined') {
             const uid = firebaseUser.uid;
             const studentName = firebaseUser.displayName || 'Novo Aluno';
             const studentAvatar = firebaseUser.photoURL || '';
             
             try {
               // The dataService.requestLink already checks for duplicates
               await dataService.requestLink(uid, pendingTrainerId, studentName, studentAvatar);
               console.log("Successfully created pending link request for trainer:", pendingTrainerId);
             } catch (err) {
               console.error("Error processing pending link request:", err);
             }
             
             localStorage.removeItem('pending_link_trainer_id');
             localStorage.removeItem('pending_link_trainer_name');
             if (pendingConsultMsg) {
               alert("Sua solicitação de vínculo foi enviada! Após o personal aceitar, você poderá verificar os valores e treinos.");
               localStorage.removeItem('pending_consult_plan_message');
             }
          }
        } else {
          setUser(null);
          if (userUnsubscribe) {
            (userUnsubscribe as () => void)();
            userUnsubscribe = null;
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (userUnsubscribe) (userUnsubscribe as () => void)();
    };
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

  // Detect Subdomain
  let subdomain = null;
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  
  const isAistudioPreview = hostname.startsWith('ais-dev-') || hostname.startsWith('ais-pre-');

  if (isAistudioPreview) {
    // Never treat AI Studio preview URLs as subdomains
    subdomain = null;
  } else if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // Optionally handle localhost subdomains
    if (parts.length === 2 && parts[1] === 'localhost') {
       subdomain = parts[0];
    }
  } else if (hostname.endsWith('.run.app') || hostname.endsWith('.vercel.app') || hostname.endsWith('.web.app') || hostname.endsWith('.firebaseapp.com')) {
    // Check if there is an extra prefix part
    if (parts.length > 3 && parts[0] !== 'www') {
      subdomain = parts[0];
    }
  } else {
    // Custom domains like starfit.com -> parts = ['starfit', 'com'] (2)
    // subdomains: username.starfit.com -> parts = ['username', 'starfit', 'com'] (3)
    if (parts.length >= 3 && parts[0] !== 'www') {
      subdomain = parts[0];
    }
  }

  return (
    <Router>
      <PWADashboardBanner />
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

        <Route path="/impersonate/:userId" element={
          user && user.role === 'ADMIN' ? <ImpersonateWrapper adminUser={user} /> : <Navigate to="/" />
        } />

        <Route path="/" element={
          subdomain ? <PublicLandingPage subdomainOverride={subdomain} /> :
          !user ? <Navigate to="/login" /> : 
          showOnboarding ? <Navigate to="/onboarding" /> :
          user.role === 'ADMIN' ? <AdminDashboard user={user} onLogout={handleLogout} /> :
          user.role === 'TRAINER' ? <TrainerDashboard user={user} onLogout={handleLogout} /> :
          <StudentDashboard user={user} onLogout={handleLogout} />
        } />
        
        <Route path="/payment-success" element={<PaymentSuccess />} />
        
        <Route path="/@:username" element={<PublicLandingPage />} />
        <Route path="/:username" element={<PublicLandingPage />} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;
