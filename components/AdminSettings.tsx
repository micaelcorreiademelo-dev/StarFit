import React, { useState } from 'react';

const AdminSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'payments' | 'notifications'>('general');

  const [emailConfig, setEmailConfig] = useState({
    gmailAccount: 'atendimento@starfit.one',
    appPassword: '••••••••••••••••',
    senderName: 'StarFit Support',
    notifyOnNewPlan: true,
    notifyOnSupportTicket: true,
  });

  const [pushConfig, setPushConfig] = useState({
    welcomeMessage: 'Bem-vindo ao StarFit! Vamos começar o seu treino? 💪',
    remindWorkout: 'Você ainda não treinou hoje. Não perca o foco! 🔥',
    subscriptionExpiring: 'Sua assinatura expira em 3 dias. Renove agora!',
    newWorkoutAdded: 'Seu trainer adicionou um novo treino para você!',
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      <header className="flex flex-col justify-between items-start gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-white">Configurações do Sistema</h1>
          <p className="text-text-secondary">Gerencie as preferências globais, pagamentos e regras de comunicação.</p>
        </div>

        <div className="flex bg-card-dark p-1 rounded-xl border border-border-dark overflow-x-auto w-full shrink-0">
          <button
            onClick={() => setActiveTab('general')}
            className={`flex flex-1 items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'general' ? 'bg-primary text-background-dark' : 'text-text-secondary hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-lg">settings</span>
            Gerais
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`flex flex-1 items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'payments' ? 'bg-primary text-background-dark' : 'text-text-secondary hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-lg">payments</span>
            Pagamentos
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex flex-1 items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'notifications' ? 'bg-primary text-background-dark' : 'text-text-secondary hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-lg">notifications</span>
            Notificações
          </button>
        </div>
      </header>

      {activeTab === 'general' && (
        <div className="bg-card-dark p-8 rounded-2xl border border-border-dark space-y-8 text-left">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">Nome da Plataforma</label>
              <input 
                type="text" 
                defaultValue="StarFit ONE"
                className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">URL de Suporte</label>
              <input 
                type="text" 
                defaultValue="https://suporte.starfit.one"
                className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">Idioma Padrão</label>
              <select className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors">
                <option>Português (Brasil)</option>
                <option>English (US)</option>
                <option>Español</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">Fuso Horário</label>
              <select className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors">
                <option>(GMT-03:00) São Paulo</option>
                <option>(GMT-05:00) New York</option>
                <option>(GMT+00:00) London</option>
              </select>
            </div>
          </div>

          <div className="pt-8 border-t border-border-dark flex justify-end">
            <button className="bg-primary text-background-dark font-black px-8 py-3 rounded-xl hover:scale-105 transition-all">
              SALVAR ALTERAÇÕES
            </button>
          </div>
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-card-dark p-8 rounded-2xl border border-border-dark space-y-6 text-left">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-primary/10 p-2 rounded-lg">
                <span className="material-symbols-outlined text-primary">credit_card</span>
              </div>
              <h3 className="text-xl font-bold text-white">Stripe Integration</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-text-secondary uppercase tracking-widest block mb-2">Publicable Key</label>
                <input 
                  type="password" 
                  defaultValue="pk_live_••••••••••••••••••••••••"
                  className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-text-secondary uppercase tracking-widest block mb-2">Secret Key</label>
                <input 
                  type="password" 
                  defaultValue="sk_live_••••••••••••••••••••••••"
                  className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div className="flex items-center gap-2 text-green-400">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                <span className="text-xs font-bold">Conexão Ativa (Modo Produção)</span>
              </div>
            </div>
          </div>

          <div className="bg-card-dark p-8 rounded-2xl border border-border-dark space-y-6 text-left">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-blue-500/10 p-2 rounded-lg">
                <span className="material-symbols-outlined text-blue-500">account_balance</span>
              </div>
              <h3 className="text-xl font-bold text-white">Taxas e Repasses</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-text-secondary uppercase tracking-widest block mb-1">Comissão StarFit (%)</label>
                <p className="text-[10px] text-text-secondary mb-2">Percentual cobrado sobre cada venda de plano dos Trainers.</p>
                <input 
                  type="number" 
                  defaultValue="15"
                  className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-text-secondary uppercase tracking-widest block mb-1">Período de Saque (Dias)</label>
                <input 
                  type="number" 
                  defaultValue="14"
                  className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Email Settings (Gmail) */}
            <div className="bg-card-dark p-6 rounded-2xl border border-border-dark space-y-6 text-left">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-red-500/10 p-2 rounded-lg">
                  <span className="material-symbols-outlined text-red-500">mail</span>
                </div>
                <h3 className="text-xl font-bold text-white">Configuração de E-mail (Gmail)</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-text-secondary mb-2">Conta do Gmail (SMTP)</label>
                  <input 
                    type="email" 
                    value={emailConfig.gmailAccount}
                    onChange={(e) => setEmailConfig({...emailConfig, gmailAccount: e.target.value})}
                    className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-text-secondary mb-2">Senha de Aplicativo</label>
                  <input 
                    type="password" 
                    value={emailConfig.appPassword}
                    onChange={(e) => setEmailConfig({...emailConfig, appPassword: e.target.value})}
                    className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                <div className="pt-4 space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        checked={emailConfig.notifyOnNewPlan}
                        onChange={(e) => setEmailConfig({...emailConfig, notifyOnNewPlan: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-white/10 rounded-full peer peer-checked:bg-primary transition-colors"></div>
                      <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                    </div>
                    <span className="text-sm text-text-secondary group-hover:text-white transition-colors">Notificar novos planos</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Push Notifications Settings */}
            <div className="bg-card-dark p-6 rounded-2xl border border-border-dark space-y-6 text-left">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-blue-500/10 p-2 rounded-lg">
                  <span className="material-symbols-outlined text-blue-500">notifications_active</span>
                </div>
                <h3 className="text-xl font-bold text-white">Mensagens Automáticas (Push)</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-text-secondary mb-2">Mensagem de Boas-Vindas</label>
                  <textarea 
                    value={pushConfig.welcomeMessage}
                    onChange={(e) => setPushConfig({...pushConfig, welcomeMessage: e.target.value})}
                    rows={2}
                    className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-text-secondary mb-2">Lembrete de Treino</label>
                  <textarea 
                    value={pushConfig.remindWorkout}
                    onChange={(e) => setPushConfig({...pushConfig, remindWorkout: e.target.value})}
                    rows={2}
                    className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card-dark p-8 rounded-2xl border border-border-dark space-y-6 text-left">
            <h3 className="text-xl font-bold text-white">Regras de Disparo Automático</h3>
            <div className="space-y-4">
              {[
                { label: 'E-mail de Boas-vindas', desc: 'Enviado imediatamente após o cadastro.', active: true },
                { label: 'Notificação de Novo Treino', desc: 'Aviso push quando o trainer adiciona conteúdo.', active: true },
                { label: 'Relatórios Semanais (Master)', desc: 'Resumo de vendas enviado por e-mail.', active: false },
              ].map((rule, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                  <div>
                    <h4 className="text-white font-bold text-sm tracking-tight">{rule.label}</h4>
                    <p className="text-text-secondary text-xs">{rule.desc}</p>
                  </div>
                  <div className={`size-10 rounded-full flex items-center justify-center cursor-pointer transition-colors ${rule.active ? 'bg-primary/20 text-primary' : 'bg-white/10 text-text-secondary'}`}>
                    <span className="material-symbols-outlined text-xl">{rule.active ? 'toggle_on' : 'toggle_off'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;
