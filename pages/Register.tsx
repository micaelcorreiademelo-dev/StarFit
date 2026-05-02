
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginWithGoogle, loginWithGoogleRedirect } from '../services/firebase';

const Register: React.FC = () => {
  const [profileType, setProfileType] = useState<'STUDENT' | 'TRAINER'>('STUDENT');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRedirectOption, setShowRedirectOption] = useState(false);
  const navigate = useNavigate();

  const handleGoogleRegister = async (useRedirect = false) => {
    setLoading(true);
    setError(null);
    try {
      // Store the requested role in localStorage so App.tsx can use it to create the user profile
      localStorage.setItem('pending_role', profileType);
      if (useRedirect) {
        await loginWithGoogleRedirect();
      } else {
        await loginWithGoogle();
      }
      // On success, App.tsx will handle the navigation via state change
    } catch (err: any) {
      if (err.code === 'auth/popup-blocked') {
        setError('O navegador bloqueou a janela de registro. Tente usar o botão abaixo ou verifique as permissões de popup.');
        setShowRedirectOption(true);
      } else {
        setError('Ocorreu um erro ao registrar com o Google. Tente novamente.');
      }
      console.error(err);
      localStorage.removeItem('pending_role');
    } finally {
      if (!useRedirect) setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full overflow-y-auto bg-background-dark flex flex-col">
      <div className="min-h-full flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-lg py-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black tracking-tighter text-white">Crie sua conta StarFit</h1>
            <p className="text-base text-text-secondary mt-2">Comece sua jornada fitness hoje mesmo.</p>
          </div>

          <div className="bg-card-dark p-8 rounded-xl border border-border-dark shadow-lg space-y-8">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg text-sm text-center">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <label className="text-lg font-bold text-white block">1. Escolha seu perfil</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Student Option */}
                <button 
                  onClick={() => setProfileType('STUDENT')}
                  className={`flex flex-col items-center text-center p-4 rounded-xl border transition-all duration-200 ${profileType === 'STUDENT' ? 'border-primary bg-primary/5' : 'border-border-dark hover:border-primary/50'}`}
                >
                  <div className={`mb-3 flex size-12 items-center justify-center rounded-lg transition-colors ${profileType === 'STUDENT' ? 'bg-primary text-background-dark' : 'bg-background-dark text-text-secondary'}`}>
                    <span className="material-symbols-outlined text-3xl">sports_gymnastics</span>
                  </div>
                  <span className="text-base font-bold text-white">Sou Aluno</span>
                  <span className="text-xs text-text-secondary mt-1 leading-tight">Quero atingir meus objetivos e receber treinos.</span>
                </button>

                {/* Trainer Option */}
                <button 
                  onClick={() => setProfileType('TRAINER')}
                  className={`flex flex-col items-center text-center p-4 rounded-xl border transition-all duration-200 ${profileType === 'TRAINER' ? 'border-primary bg-primary/5' : 'border-border-dark hover:border-primary/50'}`}
                >
                  <div className={`mb-3 flex size-12 items-center justify-center rounded-lg transition-colors ${profileType === 'TRAINER' ? 'bg-primary text-background-dark' : 'bg-background-dark text-text-secondary'}`}>
                    <span className="material-symbols-outlined text-3xl">assignment_ind</span>
                  </div>
                  <span className="text-base font-bold text-white">Sou Personal</span>
                  <span className="text-xs text-text-secondary mt-1 leading-tight">Quero gerenciar meus alunos e treinos.</span>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-lg font-bold text-white block">2. Crie sua conta</label>
              {!showRedirectOption ? (
                <button 
                  onClick={() => handleGoogleRegister(false)}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 bg-white text-background-dark font-bold py-4 rounded-lg hover:bg-white/90 transition-all disabled:opacity-50"
                >
                  <img src="https://www.google.com/favicon.ico" alt="Google" className="size-6" />
                  {loading ? 'Criando conta...' : 'Registrar com Google'}
                </button>
              ) : (
                <button 
                  onClick={() => handleGoogleRegister(true)}
                  className="w-full flex items-center justify-center gap-3 bg-primary text-background-dark font-bold py-4 rounded-lg hover:brightness-110 transition-all"
                >
                  <span className="material-symbols-outlined text-background-dark">login</span>
                  Registrar via Redirecionamento
                </button>
              )}
            </div>

            <p className="text-center text-xs text-text-secondary">
              Ao criar uma conta, você aceita nossos termos de uso e política de privacidade.
            </p>
          </div>

          <p className="text-center text-sm text-text-secondary mt-6">
            Já tem uma conta? <Link to="/login" className="font-medium text-primary hover:underline">Faça login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
