import React, { useState } from 'react';

const TrainerSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'financial' | 'notifications' | 'security'>('profile');

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

              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="flex flex-col gap-4 text-center">
                  <div className="w-32 h-32 rounded-full bg-background-dark border-4 border-border-dark flex items-center justify-center overflow-hidden mx-auto relative group">
                    <img src="https://ui-avatars.com/api/?name=Trainer&background=bbf7d0&color=166534" alt="Profile" className="w-full h-full object-cover group-hover:opacity-50 transition-opacity" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <span className="material-symbols-outlined text-white">photo_camera</span>
                    </div>
                  </div>
                  <button className="text-sm text-primary font-bold hover:brightness-110">Alterar Foto</button>
                </div>

                <div className="flex-1 flex flex-col gap-5 w-full">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-bold text-text-secondary">Nome Completo</label>
                      <input type="text" className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors" defaultValue="Carlos Silva" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-bold text-text-secondary">CREF</label>
                      <input type="text" className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors" defaultValue="000000-G/SP" />
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-text-secondary">Especialidade (Ex: Hipertrofia, Emagrecimento)</label>
                    <input type="text" className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors" defaultValue="Especialista em Hipertrofia e Condicionamento" />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-text-secondary">Biografia Curta</label>
                    <textarea 
                      className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors resize-none" 
                      rows={4}
                      defaultValue="Transformando vidas através do movimento há mais de 10 anos. Foco total em resultados sustentáveis e saúde."
                    ></textarea>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-border-dark">
                <button className="h-11 px-8 rounded-lg bg-primary text-background-dark font-black shadow-[0_4px_20px_rgba(var(--color-primary),0.3)] hover:scale-105 transition-transform">
                  Salvar Perfil
                </button>
              </div>
            </div>
          )}

          {activeTab === 'financial' && (
            <div className="flex flex-col gap-8 animate-in fade-in duration-300 relative z-10">
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-black text-white italic uppercase">Configurações Financeiras</h2>
                <p className="text-sm text-text-secondary">Padrões de cobrança e chaves de recebimento.</p>
              </div>

              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-text-secondary">Chave PIX Principal</label>
                  <input type="text" className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors" placeholder="e-mail, CPF/CNPJ, telefone ou chave aleatória" />
                </div>
                
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-text-secondary">Valor Padrão da Mensalidade/Consultoria (R$)</label>
                  <input type="number" className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors" placeholder="250,00" />
                </div>

                <div className="flex items-center justify-between p-4 bg-background-dark rounded-xl border border-border-dark mt-2">
                  <div className="flex flex-col">
                    <span className="font-bold text-white">Lembretes automáticos de cobrança</span>
                    <span className="text-xs text-text-secondary">Enviar mensagem para o aluno 3 dias antes do vencimento</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-border-dark peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-border-dark">
                <button className="h-11 px-8 rounded-lg bg-primary text-background-dark font-black shadow-[0_4px_20px_rgba(var(--color-primary),0.3)] hover:scale-105 transition-transform">
                  Salvar Preferências
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

              <div className="flex flex-col gap-3">
                {[
                  { title: "Mensagem de novo aluno", desc: "Receber aviso quando um novo aluno solicitar vínculo", checked: true },
                  { title: "Lembrete de avaliação", desc: "Ser avisado 1 dia antes da reavaliação de um aluno", checked: true },
                  { title: "Mensagem no chat", desc: "Notificações de novas mensagens recebidas no chat", checked: true }
                ].map((notif, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-background-dark rounded-xl border border-border-dark">
                    <div className="flex flex-col">
                      <span className="font-bold text-white">{notif.title}</span>
                      <span className="text-xs text-text-secondary">{notif.desc}</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked={notif.checked} />
                      <div className="w-11 h-6 bg-border-dark peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
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
                <p className="text-sm text-text-secondary">Mantenha sua conta segura alterando sua senha regularmente.</p>
              </div>

              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-text-secondary">Senha Atual</label>
                  <input type="password" className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors" placeholder="••••••••" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-text-secondary">Nova Senha</label>
                    <input type="password" className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors" placeholder="Mínimo de 8 caracteres" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-text-secondary">Confirmar Nova Senha</label>
                    <input type="password" className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors" placeholder="Mínimo de 8 caracteres" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-border-dark">
                <button className="h-11 px-8 rounded-lg bg-white/10 text-white font-black hover:bg-white/20 transition-colors">
                  Alterar Senha
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrainerSettings;
