import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { dataService } from '../services/dataService';
import { auth } from '../services/firebase';
import { sendPasswordResetEmail, updateProfile } from 'firebase/auth';

interface TrainerSettingsProps {
  user: User;
}

const TrainerSettings: React.FC<TrainerSettingsProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'financial' | 'notifications' | 'security' | 'app'>('profile');
  
  const [username, setUsername] = useState(user.username || '');
  const [name, setName] = useState(user.name || '');
  const [specialty, setSpecialty] = useState(user.specialty || '');
  const [bio, setBio] = useState(user.bio || '');

  // Financial Settings
  const [mpAccessToken, setMpAccessToken] = useState(user.financialSettings?.mpAccessToken || '');
  const [mpPublicKey, setMpPublicKey] = useState(user.financialSettings?.mpPublicKey || '');
  const [autoReminders, setAutoReminders] = useState(user.financialSettings?.autoReminders !== false);

  // Notifications
  const [notifNewStudent, setNotifNewStudent] = useState(user.notifications?.newStudent !== false);
  const [notifEvalReminder, setNotifEvalReminder] = useState(user.notifications?.evaluationReminder !== false);
  const [notifChatMessages, setNotifChatMessages] = useState(user.notifications?.chatMessages !== false);

  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [savingUsername, setSavingUsername] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Update state when user prop changes
  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setName(user.name || '');
      setSpecialty(user.specialty || '');
      setBio(user.bio || '');

      setMpAccessToken(user.financialSettings?.mpAccessToken || '');
      setMpPublicKey(user.financialSettings?.mpPublicKey || '');
      setAutoReminders(user.financialSettings?.autoReminders !== false);

      setNotifNewStudent(user.notifications?.newStudent !== false);
      setNotifEvalReminder(user.notifications?.evaluationReminder !== false);
      setNotifChatMessages(user.notifications?.chatMessages !== false);
    }
  }, [user]);

  const isValidUsername = (u: string) => /^[a-zA-Z0-9_]{3,20}$/.test(u);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/[^a-zA-Z0-9_@]/g, '');
    if (!raw.startsWith('@')) {
       raw = '@' + raw.replace(/@/g, '');
    } else {
       raw = '@' + raw.substring(1).replace(/@/g, '');
    }
    
    setUsername(raw);
    const withoutAt = raw.substring(1);
    if (withoutAt && !isValidUsername(withoutAt)) {
      setUsernameError('Use 3 a 20 caracteres (letras, números e _)');
    } else {
      setUsernameError(null);
    }
    setSuccessMsg('');
  };

  const saveProfile = async () => {
    if (usernameError) return;
    setSavingUsername(true);
    try {
       await dataService.updateUser(user.id, { 
         username,
         name,
         specialty,
         bio
       });
       if (auth.currentUser) {
         await updateProfile(auth.currentUser, { displayName: name });
       }
       setSuccessMsg('Perfil atualizado com sucesso!');
       setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
       console.error(err);
       setUsernameError('Erro ao atualizar. Tente novamente.');
    } finally {
       setSavingUsername(false);
    }
  };

  const saveFinancial = async () => {
    setSavingUsername(true);
    try {
      await dataService.updateUser(user.id, {
        financialSettings: {
          mpAccessToken: mpAccessToken.trim(),
          mpPublicKey: mpPublicKey.trim(),
          autoReminders
        }
      });
      setSuccessMsg('Configurações financeiras salvas!');
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      console.error(err);
      setSuccessMsg('Erro ao salvar. Verifique sua conexão.');
    } finally {
      setSavingUsername(false);
    }
  };

  const saveNotifications = async (newNotifs: any) => {
    try {
      await dataService.updateUser(user.id, {
        notifications: newNotifs
      });
      setSuccessMsg('Preferências de notificação atualizadas!');
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePasswordReset = async () => {
    if (!user.email) return;
    try {
      await sendPasswordResetEmail(auth, user.email);
      setSuccessMsg(`Um e-mail de redefinição de senha foi enviado para ${user.email}`);
      setTimeout(() => setSuccessMsg(''), 8000);
    } catch (err: any) {
      console.error(err);
      setSuccessMsg('Erro ao solicitar redefinição. Tente novamente mais tarde.');
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col gap-2 mb-2">
        <h1 className="text-3xl md:text-4xl font-black text-white uppercase italic tracking-tighter">Configurações</h1>
        <p className="text-text-secondary">Gerencie suas informações, preferências financeiras e regras de acesso.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Settings Navigation */}
        <aside className="w-full lg:w-64 shrink-0 flex flex-col gap-2">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-left ${activeTab === 'profile' ? 'bg-primary text-background-dark' : 'text-text-secondary hover:bg-white/5 hover:text-white'}`}
          >
            <span className="material-symbols-outlined text-[20px]">person</span>
            Perfil
          </button>
          <button 
            onClick={() => setActiveTab('financial')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-left ${activeTab === 'financial' ? 'bg-primary text-background-dark' : 'text-text-secondary hover:bg-white/5 hover:text-white'}`}
          >
            <span className="material-symbols-outlined text-[20px]">payments</span>
            Financeiro
          </button>
          <button 
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-left ${activeTab === 'notifications' ? 'bg-primary text-background-dark' : 'text-text-secondary hover:bg-white/5 hover:text-white'}`}
          >
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            Notificações
          </button>
          <button 
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-left ${activeTab === 'security' ? 'bg-primary text-background-dark' : 'text-text-secondary hover:bg-white/5 hover:text-white'}`}
          >
            <span className="material-symbols-outlined text-[20px]">lock</span>
            Senha e Acesso
          </button>
          <button 
            onClick={() => setActiveTab('app')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-left ${activeTab === 'app' ? 'bg-primary text-background-dark' : 'text-text-secondary hover:bg-white/5 hover:text-white'}`}
          >
            <span className="material-symbols-outlined text-[22px]">install_mobile</span>
            Baixar Aplicativo
          </button>
        </aside>

        {/* Settings Content */}
        <div className="flex-1 w-full bg-card-dark border border-border-dark rounded-2xl p-6 md:p-8 relative overflow-hidden">
          {/* Subtle Background Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none"></div>

          {activeTab === 'profile' && (
            <div className="flex flex-col gap-8 animate-in fade-in duration-300 relative z-10">
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-black text-white italic uppercase">Perfil Público</h2>
                <p className="text-sm text-text-secondary">Informações visíveis para seus alunos e na sua Landing Page.</p>
              </div>
              
              {successMsg && (
                <div className="bg-green-500/10 border border-green-500/20 text-green-500 p-3 rounded-lg text-sm">
                  {successMsg}
                </div>
              )}

              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="flex flex-col gap-4 text-center">
                  <div className="w-32 h-32 rounded-full bg-background-dark border-4 border-border-dark flex items-center justify-center overflow-hidden mx-auto relative group">
                    <img src={user.avatar || "https://ui-avatars.com/api/?name=Trainer&background=bbf7d0&color=166534"} alt="Profile" className="w-full h-full object-cover group-hover:opacity-50 transition-opacity" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <span className="material-symbols-outlined text-white">photo_camera</span>
                    </div>
                  </div>
                  <button className="text-sm text-primary font-bold hover:brightness-110">Alterar Foto</button>
                </div>

                <div className="flex-1 flex flex-col gap-5 w-full">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-2 relative">
                      <label className="text-sm font-bold text-text-secondary">Username Público</label>
                      <input 
                        type="text" 
                        value={username}
                        onChange={handleUsernameChange}
                        className={`w-full bg-background-dark border ${usernameError ? 'border-red-500/50' : 'border-border-dark'} rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors`} 
                        placeholder="@username" 
                      />
                      {usernameError && (
                        <p className="text-red-400 text-xs mt-1 absolute -bottom-5 left-0">{usernameError}</p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-bold text-text-secondary">Nome Completo</label>
                      <input 
                        type="text" 
                        className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 mt-2">
                    <label className="text-sm font-bold text-text-secondary">Especialidade (Ex: Hipertrofia, Emagrecimento)</label>
                    <input 
                      type="text" 
                      className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors" 
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      placeholder="Especialista em Hipertrofia e Condicionamento"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-text-secondary">Biografia Curta</label>
                    <textarea 
                      className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors resize-none" 
                      rows={4}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Fale um pouco sobre você..."
                    ></textarea>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-border-dark">
                <button disabled={savingUsername} onClick={saveProfile} className="h-11 px-8 rounded-lg bg-primary text-background-dark font-black shadow-[0_4px_20px_rgba(var(--color-primary),0.3)] hover:scale-105 transition-transform disabled:opacity-50">
                  {savingUsername ? 'Salvando...' : 'Salvar Perfil'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'financial' && (
            <div className="flex flex-col gap-8 animate-in fade-in duration-300 relative z-10">
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-black text-white italic uppercase">Configurações Financeiras</h2>
                <p className="text-sm text-text-secondary">Padrões de cobrança e chaves de recebimento do Mercado Pago.</p>
              </div>

              {successMsg && (
                <div className="bg-green-500/10 border border-green-500/20 text-green-500 p-3 rounded-lg text-sm">
                  {successMsg}
                </div>
              )}

              <div className="flex flex-col gap-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-text-secondary">Mercado Pago Access Token</label>
                    <input 
                      type="password" 
                      value={mpAccessToken}
                      onChange={(e) => setMpAccessToken(e.target.value)}
                      className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors" 
                      placeholder="APP_USR-..." 
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-text-secondary">Mercado Pago Public Key</label>
                    <input 
                      type="text" 
                      value={mpPublicKey}
                      onChange={(e) => setMpPublicKey(e.target.value)}
                      className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors" 
                      placeholder="APP_USR-..." 
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-background-dark rounded-xl border border-border-dark mt-2">
                  <div className="flex flex-col">
                    <span className="font-bold text-white">Lembretes automáticos de cobrança</span>
                    <span className="text-xs text-text-secondary">Enviar mensagem para o aluno 3 dias antes do vencimento</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={autoReminders} 
                      onChange={(e) => setAutoReminders(e.target.checked)}
                    />
                    <div className="relative w-11 h-6 bg-border-dark peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-border-dark">
                <button 
                  onClick={saveFinancial}
                  disabled={savingUsername}
                  className="h-11 px-8 rounded-lg bg-primary text-background-dark font-black shadow-[0_4px_20px_rgba(var(--color-primary),0.3)] hover:scale-105 transition-transform disabled:opacity-50"
                >
                  {savingUsername ? 'Salvando...' : 'Salvar Preferências Financeiras'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="flex flex-col gap-8 animate-in fade-in duration-300 relative z-10">
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-black text-white italic uppercase">Notificações</h2>
                <p className="text-sm text-text-secondary">Escolha o que você deseja receber de aviso do sistema.</p>
              </div>

              {successMsg && (
                <div className="bg-green-500/10 border border-green-500/20 text-green-500 p-3 rounded-lg text-sm">
                  {successMsg}
                </div>
              )}

              <div className="flex flex-col gap-3">
                {[
                  { 
                    id: 'newStudent',
                    title: "Mensagem de novo aluno", 
                    desc: "Receber aviso quando um novo aluno solicitar vínculo", 
                    checked: notifNewStudent,
                    setter: setNotifNewStudent
                  },
                  { 
                    id: 'evaluationReminder',
                    title: "Lembrete de avaliação", 
                    desc: "Ser avisado 1 dia antes da reavaliação de um aluno", 
                    checked: notifEvalReminder,
                    setter: setNotifEvalReminder
                  },
                  { 
                    id: 'chatMessages',
                    title: "Mensagem no chat", 
                    desc: "Notificações de novas mensagens recebidas no chat", 
                    checked: notifChatMessages,
                    setter: setNotifChatMessages
                  }
                ].map((notif) => (
                  <div key={notif.id} className="flex items-center justify-between p-4 bg-background-dark rounded-xl border border-border-dark gap-4">
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="font-bold text-white text-sm md:text-base leading-tight">{notif.title}</span>
                      <span className="text-xs text-text-secondary leading-normal mt-0.5">{notif.desc}</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={notif.checked} 
                        onChange={(e) => {
                          const val = e.target.checked;
                          notif.setter(val);
                          saveNotifications({
                            newStudent: notif.id === 'newStudent' ? val : notifNewStudent,
                            evaluationReminder: notif.id === 'evaluationReminder' ? val : notifEvalReminder,
                            chatMessages: notif.id === 'chatMessages' ? val : notifChatMessages,
                          });
                        }}
                      />
                      <div className="relative w-11 h-6 bg-border-dark peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="flex flex-col gap-8 animate-in fade-in duration-300 relative z-10">
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-black text-white italic uppercase">Senha e Acesso</h2>
                <p className="text-sm text-text-secondary">Mantenha sua conta segura.</p>
              </div>

              {successMsg && (
                <div className="bg-green-500/10 border border-green-500/20 text-green-500 p-3 rounded-lg text-sm">
                  {successMsg}
                </div>
              )}

              <div className="bg-background-dark border border-border-dark p-6 rounded-2xl flex flex-col items-center text-center gap-4">
                <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-3xl">lock_reset</span>
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="text-white font-bold">Redefinir Senha</h3>
                  <p className="text-xs text-text-secondary max-w-xs">
                    Enviaremos um link seguro para o seu e-mail cadastrado ({user.email}) para que você possa escolher uma nova senha.
                  </p>
                </div>
                <button 
                  onClick={handlePasswordReset}
                  className="mt-2 h-11 px-8 rounded-lg bg-white text-background-dark font-black hover:bg-white/90 transition-all active:scale-95"
                >
                  Enviar E-mail de Redefinição
                </button>
              </div>
            </div>
          )}

          {activeTab === 'app' && (
            <div className="flex flex-col gap-8 animate-in fade-in duration-300 relative z-10">
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-black text-white italic uppercase">Instalar Aplicativo StarFit</h2>
                <p className="text-sm text-text-secondary">Transforme sua experiência utilizando o StarFit como um aplicativo nativo.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Status Card */}
                <div className="bg-background-dark border border-border-dark p-6 rounded-2xl flex flex-col gap-4">
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">info</span>
                    Status de Instalação
                  </h3>
                  
                  <div className="flex items-center gap-3 bg-white/5 p-4 rounded-xl border border-white/5 text-sm">
                    <div className="w-3 h-3 rounded-full shrink-0 bg-yellow-500 animate-pulse" />
                    <span className="text-text-primary text-xs leading-snug">
                      Detectável e pronto para instalação em smartphones e desktops.
                    </span>
                  </div>

                  <p className="text-xs text-text-secondary leading-relaxed">
                    A versão PWA (Progressive Web App) permite acessar o ecossistema diretamente de sua tela inicial, com maior velocidade de carregamento, sem a barra de tarefas do navegador e com suporte parcial no modo offline.
                  </p>
                </div>

                {/* Installation Trigger Card */}
                <div className="bg-background-dark border border-border-dark p-6 rounded-2xl flex flex-col gap-4">
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">install_desktop</span>
                    Ação Recomendada
                  </h3>

                  {(() => {
                    const isIosDevice = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
                    if (isIosDevice) {
                      return (
                        <div className="flex flex-col gap-3">
                          <p className="text-text-primary text-xs leading-relaxed">
                            No iOS/Safari, a instalação direta pelo navegador não possui instaladores flutuantes do Chrome.
                          </p>
                          <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col gap-2">
                            <p className="text-xs font-bold text-white flex items-center gap-2">
                              <span className="material-symbols-outlined text-text-secondary text-[16px]">share</span>
                              Como Instalar no iPhone/iPad:
                            </p>
                            <ol className="list-decimal list-inside text-xs text-text-secondary flex flex-col gap-1.5 leading-relaxed">
                              <li>Toque no botão de <strong>Compartilhar</strong> (ícone de quadrado com flecha para cima).</li>
                              <li>Role para baixo e selecione <strong>Adicionar à Tela de Início</strong>.</li>
                              <li>Confirme o nome do aplicativo e clique em <strong>Adicionar</strong>.</li>
                            </ol>
                          </div>
                        </div>
                      );
                    }

                    // For Web / Android, let's render a custom install button!
                    return (
                      <div className="flex flex-col gap-4">
                        <p className="text-xs text-text-secondary leading-relaxed">
                          Clique no botão abaixo para baixar o aplicativo para sua tela inicial ou desktop de forma instantânea.
                        </p>
                        <button
                          onClick={() => {
                            const promptEvent = (window as any).globalDeferredPrompt;
                            if (promptEvent) {
                              promptEvent.prompt();
                              promptEvent.userChoice.then(({ outcome }: any) => {
                                if (outcome === 'accepted') {
                                  console.log('User accepted install.');
                                }
                              });
                            } else {
                              alert('Seu navegador já instalou o StarFit ou a sessão atual está bloqueada em iframe. Se estiver no Chrome/Edge, você também pode usar o ícone de instalação direta na barra superior de URLs ou no menu "Instalar aplicativo".');
                            }
                          }}
                          className="w-full bg-primary text-background-dark font-black h-11 rounded-lg flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all text-sm mb-1"
                        >
                          <span className="material-symbols-outlined text-[18px]">download</span>
                          Instalar no Dispositivo
                        </button>
                        <p className="text-[11px] text-text-secondary text-center italic">
                          Dica: Se estiver no Desktop, procure pelo ícone de monitor com seta na barra de endereços do seu navegador.
                        </p>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Benefits Banner */}
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 flex flex-col md:flex-row items-start gap-4">
                <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined text-2xl">offline_bolt</span>
                </div>
                <div className="flex flex-col gap-1">
                  <h4 className="text-white font-bold text-sm">Quais os benefícios de instalar?</h4>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Diga adeus às barras de navegação do Chrome/Safari que reduzem sua tela útil. Experimente transições suaves a 60fps, acesso instantâneo a treinos e cronômetros mesmo sem conexão ativa de internet e carregamento extremamente veloz otimizado por cache inteligente do Service Worker local.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrainerSettings;
