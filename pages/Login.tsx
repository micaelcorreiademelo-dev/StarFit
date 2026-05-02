
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserRole } from '../types';
import { loginWithGoogle } from '../services/firebase';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRedirectOption, setShowRedirectOption] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = async (useRedirect = false) => {
    setLoading(true);
    setError(null);
    try {
      if (useRedirect) {
        await loginWithGoogleRedirect();
      } else {
        await loginWithGoogle();
      }
      // On success, App.tsx will handle the navigation via state change
    } catch (err: any) {
      if (err.code === 'auth/popup-blocked') {
        setError('O navegador bloqueou a janela de login. Tente usar o botão abaixo ou verifique as permissões de popup.');
        setShowRedirectOption(true);
      } else {
        setError('Ocorreu um erro ao entrar com o Google. Tente novamente.');
      }
      console.error(err);
    } finally {
      if (!useRedirect) setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full overflow-y-auto bg-background-dark flex flex-col">
      <div className="min-h-full flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md py-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary text-4xl fill">fitness_center</span>
              <span className="text-4xl font-bold tracking-tighter text-white">StarFit</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Bem-vindo de volta!</h1>
            <p className="text-text-secondary mt-2">
              Acesse sua conta para continuar evoluindo.
            </p>
          </div>

          <div className="bg-card-dark p-8 rounded-2xl border border-border-dark shadow-2xl space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg text-sm text-center">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-4">
              {!showRedirectOption ? (
                <button 
                  onClick={() => handleGoogleLogin(false)}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 bg-white text-background-dark font-bold py-3 rounded-lg hover:bg-white/90 transition-all disabled:opacity-50"
                >
                  <img src="https://www.google.com/favicon.ico" alt="Google" className="size-5" />
                  {loading ? 'Entrando...' : 'Entrar com Google'}
                </button>
              ) : (
                <button 
                  onClick={() => handleGoogleLogin(true)}
                  className="w-full flex items-center justify-center gap-3 bg-primary text-background-dark font-bold py-3 rounded-lg hover:brightness-110 transition-all"
                >
                  <span className="material-symbols-outlined">login</span>
                  Entrar via Redirecionamento
                </button>
              )}
            </div>

            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border-dark"></div></div>
              <span className="relative px-3 bg-card-dark text-xs text-text-secondary">OU</span>
            </div>

            <p className="text-center text-xs text-text-secondary px-6">
              Ao continuar, você concorda com nossos Termos de Serviço e Política de Privacidade.
            </p>
          </div>

          <p className="text-center text-sm text-text-secondary mt-6">
            Ainda não tem conta? <Link to="/register" className="text-primary font-bold hover:underline">Registre-se aqui</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
