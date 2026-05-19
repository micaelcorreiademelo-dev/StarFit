
// Registration file logic edited down here
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginWithGoogle, loginWithGoogleRedirect, registerWithEmail } from '../services/firebase';

const Register: React.FC = () => {
  const [profileType, setProfileType] = useState<'STUDENT' | 'TRAINER'>('STUDENT');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRedirectOption, setShowRedirectOption] = useState(false);
  const [iframeAlert, setIframeAlert] = useState(false);

  // New fields
  const [username, setUsername] = useState('');
  const [suggestedUsernames, setSuggestedUsernames] = useState<string[]>([]);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  // Email/Password fields
  const [useEmail, setUseEmail] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const pendingLinkTrainerName = localStorage.getItem('pending_link_trainer_name');

  const navigate = useNavigate();

  // Generating suggestions based on any username the user tries to type
  const isValidUsername = (u: string) => /^[a-zA-Z0-9_]{3,20}$/.test(u);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/[^a-zA-Z0-9_]/g, '');
    setUsername(raw);
    if (raw && !isValidUsername(raw)) {
      setUsernameError('Use 3 a 20 caracteres (letras, números e _)');
    } else {
      setUsernameError(null);
    }

    if (raw.length > 3) {
      setSuggestedUsernames([
        raw,
        `coach${raw}`,
        `team${raw}`,
        `personal${raw}`
      ]);
    } else {
      setSuggestedUsernames([]);
    }
  };

  const validateTrainer = () => {
    if (profileType === 'TRAINER') {
      if (!username) {
         setError('Por favor, escolha um username.');
         return false;
      }
      if (!isValidUsername(username)) {
         setError('Username inválido. Use 3 a 20 caracteres (letras, números e _)');
         return false;
      }
      localStorage.setItem('pending_username', `@${username.toLowerCase()}`);
    } else {
      localStorage.removeItem('pending_username');
    }
    return true;
  }

  const handleGoogleRegister = async (useRedirect = false) => {
    if (!validateTrainer()) return;

    if (window.top !== window.self) {
      setIframeAlert(true);
      setError('O Firebase pode não funcionar por segurança ao fazer login embutido em um ambiente iframe. Para completar o login com segurança, abra o app em uma aba limpa.');
      return;
    }

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
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('Este domínio não está autorizado no Firebase. Adicione a URL atual (ex: vercel.app) no painel do Firebase > Authentication > Settings > Authorized domains.');
      } else if (err.code === 'auth/internal-error') {
        setError('Erro interno do Firebase. Isso geralmente ocorre se o Google não estiver ativado no painel do Firebase Authentication ou por bloqueio do navegador. Tente a opção de redirecionamento ou ative o Google no Firebase.');
        setShowRedirectOption(true);
      } else if (err.code === 'auth/network-request-failed') {
        setError('Erro de conexão. Como estamos em um ambiente de visualização (iframe), navegadores com bloqueio de cookies de terceiros ou adblockers podem falhar no login. Você deve clicar no botão "Open in new tab" na barra superior do AI Studio para abrir o site em uma nova aba.');
        setShowRedirectOption(true);
      } else {
        setError('Ocorreu um erro ao registrar com o Google. Tente novamente. Erro: ' + err.message);
      }
      console.error(err);
      localStorage.removeItem('pending_role');
      localStorage.removeItem('pending_username');
    } finally {
      if (!useRedirect) setLoading(false);
    }
  };

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateTrainer()) return;
    if (!name || !email || !password) {
      setError('Preencha todos os campos.');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      localStorage.setItem('pending_role', profileType);
      await registerWithEmail(email, password, name);
      // App.tsx handles nav state
    } catch (err: any) {
       console.error(err);
       if (err.code === 'auth/email-already-in-use') {
         setError('E-mail já está em uso.');
       } else {
         setError('Ocorreu um erro ao registrar. Tente novamente.');
       }
       localStorage.removeItem('pending_role');
       localStorage.removeItem('pending_username');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full overflow-y-auto bg-background-dark flex flex-col">
      <div className="min-h-full flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-lg py-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black tracking-tighter text-white">Crie sua conta StarFit</h1>
            <p className="text-base text-text-secondary mt-2">Comece sua jornada fitness hoje mesmo.</p>
            
            {pendingLinkTrainerName && (
               <div className="mt-4 px-4 py-3 bg-primary/10 border border-primary text-primary rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined">link</span>
                  Ao finalizar o cadastro, você solicitará vínculo com {pendingLinkTrainerName}!
               </div>
            )}
          </div>

          <div className="bg-card-dark p-8 rounded-xl border border-border-dark shadow-lg space-y-8">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg text-sm text-center flex flex-col items-center gap-2">
                <span>{error}</span>
                {iframeAlert && (
                  <a 
                    href={window.location.href} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="mt-2 text-white bg-red-500/20 hover:bg-red-500/30 px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors border border-red-500/30"
                  >
                    Abrir app em nova aba <span className="material-symbols-outlined text-sm">open_in_new</span>
                  </a>
                )}
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

            {profileType === 'TRAINER' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
                <label className="text-lg font-bold text-white block">Escolha seu username</label>
                <div className="text-xs text-text-secondary -mt-3 mb-2">
                  Seu username será utilizado para:
                  <ul className="list-disc list-inside mt-1 ml-1 opacity-80">
                    <li>divulgar seu perfil</li>
                    <li>gerar sua landing page pública</li>
                    <li>gerar seu QR Code</li>
                    <li>permitir que alunos encontrem você no sistema</li>
                  </ul>
                </div>
                
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary font-bold select-none">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={handleUsernameChange}
                    className={`w-full bg-background-dark border ${usernameError ? 'border-red-500/50' : 'border-border-dark'} rounded-lg pl-8 pr-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all`}
                    placeholder="seunome"
                  />
                </div>
                
                {usernameError && (
                   <p className="text-red-400 text-xs mt-1">{usernameError}</p>
                )}

                {suggestedUsernames.length > 0 && !usernameError && (
                  <div className="mt-3">
                    <p className="text-xs text-text-secondary mb-2">Sugestões:</p>
                    <div className="flex flex-wrap gap-2">
                      {suggestedUsernames.map(sug => (
                        <button
                          key={sug}
                          onClick={() => {
                            setUsername(sug);
                            setUsernameError(null);
                            setSuggestedUsernames([]);
                          }}
                          className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 px-3 py-1 rounded-full text-xs font-medium transition-colors"
                        >
                          @{sug}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-4">
              <label className="text-lg font-bold text-white block">2. Crie sua conta</label>
              
              {!useEmail ? (
                 <>
                   {iframeAlert ? (
                     <a
                       href={window.location.href} 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="w-full flex items-center justify-center gap-3 bg-primary text-background-dark font-bold py-4 rounded-lg hover:brightness-110 transition-all"
                     >
                       <span className="material-symbols-outlined">open_in_new</span>
                       Abrir app em nova aba
                     </a>
                   ) : !showRedirectOption ? (
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

                   <div className="relative flex items-center justify-center my-4">
                     <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border-dark"></div></div>
                     <span className="relative px-3 bg-card-dark text-xs text-text-secondary">OU</span>
                   </div>

                   <button
                     onClick={() => setUseEmail(true)}
                     className="w-full flex items-center justify-center gap-2 bg-transparent border border-border-dark text-white font-bold py-4 rounded-lg hover:bg-white/5 transition-all"
                   >
                     <span className="material-symbols-outlined">mail</span>
                     Usar E-mail e Senha
                   </button>
                 </>
              ) : (
                 <form onSubmit={handleEmailRegister} className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-4">
                    <input 
                      type="text" 
                      placeholder="Nome completo" 
                      value={name} 
                      onChange={e => setName(e.target.value)}
                      className="w-full bg-background-dark border border-border-dark rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary" 
                    />
                    <input 
                      type="email" 
                      placeholder="E-mail" 
                      value={email} 
                      onChange={e => setEmail(e.target.value)}
                      className="w-full bg-background-dark border border-border-dark rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary" 
                    />
                    <input 
                      type="password" 
                      placeholder="Senha (mínimo 6 caracteres)" 
                      value={password} 
                      onChange={e => setPassword(e.target.value)}
                      className="w-full bg-background-dark border border-border-dark rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary" 
                    />

                    <div className="flex gap-2 mt-2">
                       <button
                         type="button"
                         onClick={() => setUseEmail(false)}
                         className="flex-1 bg-transparent border border-border-dark text-text-secondary py-3 rounded-lg hover:bg-white/5"
                       >
                         Voltar
                       </button>
                       <button
                         type="submit"
                         disabled={loading}
                         className="flex-[2] bg-primary text-background-dark font-bold py-3 rounded-lg hover:scale-105 transition-all disabled:opacity-50"
                       >
                         {loading ? 'Criando...' : 'Finalizar Registro'}
                       </button>
                    </div>
                    
                    <p className="text-xs text-text-secondary text-center mt-2">
                       Para esta opção funcionar, o Administrador precisa ativar E-mail/Senha no Firebase Console.
                    </p>
                 </form>
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
