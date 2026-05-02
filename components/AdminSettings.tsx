import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const AdminSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'payments' | 'notifications'>('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [generalConfig, setGeneralConfig] = useState({
    platformName: 'StarFit ONE',
    supportUrl: 'https://suporte.starfit.one',
    defaultLanguage: 'Português (Brasil)',
    timezone: '(GMT-03:00) São Paulo'
  });

  const [paymentConfig, setPaymentConfig] = useState({
    mpAccessToken: '',
    mpPublicKey: '',
    platformFee: 15,
    payoutDays: 14
  });

  const [emailConfig, setEmailConfig] = useState({
    gmailAccount: 'atendimento@starfit.one',
    appPassword: '',
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

  const [autoRules, setAutoRules] = useState({
    welcomeEmail: true,
    newWorkoutPush: true,
    weeklyReports: false
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'master');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.general) setGeneralConfig(data.general);
          if (data.payments) setPaymentConfig(data.payments);
          if (data.email) setEmailConfig(data.email);
          if (data.push) setPushConfig(data.push);
          if (data.autoRules) setAutoRules(data.autoRules);
        }
      } catch (error) {
        console.error("Error loading settings:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const docRef = doc(db, 'settings', 'master');
      await setDoc(docRef, {
        general: generalConfig,
        payments: paymentConfig,
        email: emailConfig,
        push: pushConfig,
        autoRules: autoRules,
        updatedAt: new Date()
      }, { merge: true });
      alert('Configurações salvas com sucesso!');
    } catch (error) {
      console.error("Error saving settings:", error);
      alert('Erro ao salvar as configurações.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-text-secondary">Carregando configurações...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-white">Configurações do Sistema</h1>
          <p className="text-text-secondary">Gerencie as preferências globais, pagamentos e regras de comunicação.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="bg-primary text-background-dark font-black px-8 py-3 rounded-xl hover:scale-105 transition-all disabled:opacity-50"
        >
          {saving ? 'SALVANDO...' : 'SALVAR ALTERAÇÕES'}
        </button>
      </header>

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

      {activeTab === 'general' && (
        <div className="bg-card-dark p-8 rounded-2xl border border-border-dark space-y-8 text-left">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">Nome da Plataforma</label>
              <input 
                type="text" 
                value={generalConfig.platformName}
                onChange={(e) => setGeneralConfig({...generalConfig, platformName: e.target.value})}
                className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">URL de Suporte</label>
              <input 
                type="text" 
                value={generalConfig.supportUrl}
                onChange={(e) => setGeneralConfig({...generalConfig, supportUrl: e.target.value})}
                className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">Idioma Padrão</label>
              <select 
                value={generalConfig.defaultLanguage}
                onChange={(e) => setGeneralConfig({...generalConfig, defaultLanguage: e.target.value})}
                className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
              >
                <option value="Português (Brasil)">Português (Brasil)</option>
                <option value="English (US)">English (US)</option>
                <option value="Español">Español</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">Fuso Horário</label>
              <select 
                value={generalConfig.timezone}
                onChange={(e) => setGeneralConfig({...generalConfig, timezone: e.target.value})}
                className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
              >
                <option value="(GMT-03:00) São Paulo">(GMT-03:00) São Paulo</option>
                <option value="(GMT-05:00) New York">(GMT-05:00) New York</option>
                <option value="(GMT+00:00) London">(GMT+00:00) London</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-card-dark p-8 rounded-2xl border border-border-dark space-y-6 text-left">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-[#009EE3]/10 p-2 rounded-lg">
                <span className="material-symbols-outlined text-[#009EE3]">storefront</span>
              </div>
              <h3 className="text-xl font-bold text-white">Integração Mercado Pago</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-text-secondary uppercase tracking-widest block mb-2">Access Token</label>
                <input 
                  type="password" 
                  value={paymentConfig.mpAccessToken}
                  onChange={(e) => setPaymentConfig({...paymentConfig, mpAccessToken: e.target.value})}
                  placeholder="APP_USR-..."
                  className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-text-secondary uppercase tracking-widest block mb-2">Public Key</label>
                <input 
                  type="password" 
                  value={paymentConfig.mpPublicKey}
                  onChange={(e) => setPaymentConfig({...paymentConfig, mpPublicKey: e.target.value})}
                  placeholder="APP_USR-..."
                  className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              {paymentConfig.mpAccessToken && paymentConfig.mpPublicKey ? (
                <div className="flex items-center gap-2 text-green-400">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  <span className="text-xs font-bold">Chaves Salvas</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-yellow-400">
                  <span className="material-symbols-outlined text-sm">warning</span>
                  <span className="text-xs font-bold">Configure as chaves do Mercado Pago</span>
                </div>
              )}
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
                  value={paymentConfig.platformFee}
                  onChange={(e) => setPaymentConfig({...paymentConfig, platformFee: Number(e.target.value)})}
                  className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-text-secondary uppercase tracking-widest block mb-1">Período de Saque (Dias)</label>
                <input 
                  type="number" 
                  value={paymentConfig.payoutDays}
                  onChange={(e) => setPaymentConfig({...paymentConfig, payoutDays: Number(e.target.value)})}
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
                    placeholder="••••••••••••••••"
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
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        checked={emailConfig.notifyOnSupportTicket}
                        onChange={(e) => setEmailConfig({...emailConfig, notifyOnSupportTicket: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-white/10 rounded-full peer peer-checked:bg-primary transition-colors"></div>
                      <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                    </div>
                    <span className="text-sm text-text-secondary group-hover:text-white transition-colors">Notificar novos chamados de suporte</span>
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
                <div>
                  <label className="block text-sm font-bold text-text-secondary mb-2">Assinatura Expirando</label>
                  <textarea 
                    value={pushConfig.subscriptionExpiring}
                    onChange={(e) => setPushConfig({...pushConfig, subscriptionExpiring: e.target.value})}
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
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                <div>
                  <h4 className="text-white font-bold text-sm tracking-tight">E-mail de Boas-vindas</h4>
                  <p className="text-text-secondary text-xs">Enviado imediatamente após o cadastro.</p>
                </div>
                <div 
                  onClick={() => setAutoRules({...autoRules, welcomeEmail: !autoRules.welcomeEmail})}
                  className={`size-10 rounded-full flex items-center justify-center cursor-pointer transition-colors ${autoRules.welcomeEmail ? 'bg-primary/20 text-primary' : 'bg-white/10 text-text-secondary'}`}
                >
                  <span className="material-symbols-outlined text-xl">{autoRules.welcomeEmail ? 'toggle_on' : 'toggle_off'}</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                <div>
                  <h4 className="text-white font-bold text-sm tracking-tight">Notificação de Novo Treino</h4>
                  <p className="text-text-secondary text-xs">Aviso push quando o trainer adiciona conteúdo.</p>
                </div>
                <div 
                  onClick={() => setAutoRules({...autoRules, newWorkoutPush: !autoRules.newWorkoutPush})}
                  className={`size-10 rounded-full flex items-center justify-center cursor-pointer transition-colors ${autoRules.newWorkoutPush ? 'bg-primary/20 text-primary' : 'bg-white/10 text-text-secondary'}`}
                >
                  <span className="material-symbols-outlined text-xl">{autoRules.newWorkoutPush ? 'toggle_on' : 'toggle_off'}</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                <div>
                  <h4 className="text-white font-bold text-sm tracking-tight">Relatórios Semanais (Master)</h4>
                  <p className="text-text-secondary text-xs">Resumo de vendas enviado por e-mail.</p>
                </div>
                <div 
                  onClick={() => setAutoRules({...autoRules, weeklyReports: !autoRules.weeklyReports})}
                  className={`size-10 rounded-full flex items-center justify-center cursor-pointer transition-colors ${autoRules.weeklyReports ? 'bg-primary/20 text-primary' : 'bg-white/10 text-text-secondary'}`}
                >
                  <span className="material-symbols-outlined text-xl">{autoRules.weeklyReports ? 'toggle_on' : 'toggle_off'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;

