import React, { useState } from 'react';

const AdminSecurity: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'policies' | 'logs' | 'login' | 'changes' | 'blocking'>('policies');

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      <header className="flex flex-col justify-between items-start gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-white">Segurança e Auditoria</h1>
          <p className="text-text-secondary">Monitoramento de acessos, logs do sistema e ferramentas de bloqueio.</p>
        </div>

        <div className="flex bg-card-dark p-1 rounded-xl border border-border-dark overflow-x-auto w-full shrink-0">
          {[
            { id: 'policies', label: 'Políticas', icon: 'verified_user' },
            { id: 'logs', label: 'Logs de Acesso', icon: 'list_alt' },
            { id: 'login', label: 'Histórico de Login', icon: 'history' },
            { id: 'changes', label: 'Alterações no Sistema', icon: 'edit_note' },
            { id: 'blocking', label: 'Bloqueio de Usuário', icon: 'block' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex flex-1 items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeSubTab === tab.id ? 'bg-primary text-background-dark' : 'text-text-secondary hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-lg">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {activeSubTab === 'policies' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Painel de Controle de Acesso */}
          <div className="bg-card-dark p-6 rounded-2xl border border-border-dark">
            <h3 className="text-lg font-bold text-white mb-6">Políticas de Segurança</h3>
            <div className="space-y-4">
              {[
                { label: 'Autenticação de Dois Fatores (2FA)', desc: 'Obrigatório para Master Admins e Trainers.', active: true },
                { label: 'Política de Senha Forte', desc: 'Mínimo de 12 caracteres, símbolos e números.', active: true },
                { label: 'Sessão Concorrente', desc: 'Permitir apenas 1 login por conta ao mesmo tempo.', active: false },
                { label: 'Backup Georedundante', desc: 'Cópia de segurança automática em regiões distintas.', active: true },
              ].map((policy, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                  <div>
                    <p className="text-white font-bold text-sm tracking-tight">{policy.label}</p>
                    <p className="text-text-secondary text-xs">{policy.desc}</p>
                  </div>
                  <div className={`size-10 rounded-full flex items-center justify-center cursor-pointer transition-colors ${policy.active ? 'bg-primary/20 text-primary' : 'bg-white/10 text-text-secondary'}`}>
                    <span className="material-symbols-outlined">{policy.active ? 'toggle_on' : 'toggle_off'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Logs de Segurança (Críticos) */}
          <div className="bg-card-dark p-6 rounded-2xl border border-border-dark flex flex-col h-full">
            <h3 className="text-lg font-bold text-white mb-6">Auditoria Crítica</h3>
            <div className="flex-1 space-y-4 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
              {[
                { event: 'Tentativa de Invasão Bloqueada', ip: '192.168.1.1', time: '10 min atrás', severity: 'Alta' },
                { event: 'Troca de Senha Master', ip: '200.45.10.22', time: '1 hora atrás', severity: 'Média' },
                { event: 'Backup do Sistema Concluído', ip: 'Servidor Interno', time: '2 horas atrás', severity: 'Baixa' },
                { event: 'Novo Painel Admin Criado', ip: '200.45.10.22', time: '5 horas atrás', severity: 'Alta' },
                { event: 'Tentativa de Invasão Bloqueada', ip: '187.12.33.4', time: '8 horas atrás', severity: 'Alta' },
              ].map((ev, i) => (
                <div key={i} className="flex gap-4 border-l-2 border-primary/30 pl-4 py-2">
                  <div className="flex-1">
                    <p className="text-white text-sm font-bold">{ev.event}</p>
                    <p className="text-text-secondary text-xs">{ev.ip} • {ev.time}</p>
                  </div>
                  <span className={`text-[10px] font-bold uppercase ${ev.severity === 'Alta' ? 'text-red-400' : ev.severity === 'Média' ? 'text-yellow-400' : 'text-blue-400'}`}>
                    {ev.severity}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'logs' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-border-dark rounded-xl text-text-secondary hover:text-white transition-all text-xs font-bold">
              <span className="material-symbols-outlined text-sm">download</span>
              EXPORTAR LOGS (CSV)
            </button>
          </div>
          <div className="bg-card-dark rounded-2xl border border-border-dark overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-background-dark/50 text-text-secondary text-xs uppercase tracking-widest border-b border-border-dark">
              <tr>
                <th className="px-6 py-4 font-bold">Usuário</th>
                <th className="px-6 py-4 font-bold">Ação</th>
                <th className="px-6 py-4 font-bold">Recurso</th>
                <th className="px-6 py-4 font-bold">IP</th>
                <th className="px-6 py-4 font-bold">Data/Hora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-dark">
              {[
                { user: 'Master Admin', action: 'Visualização', resource: 'Dashboard Financeiro', ip: '177.10.5.4', date: '27/04/2026 15:45' },
                { user: 'Trainer #452', action: 'Download', resource: 'Relatório Alunos', ip: '189.14.2.11', date: '27/04/2026 15:30' },
                { user: 'Suporte L2', action: 'Visualização', resource: 'Ticket #8892', ip: '201.22.44.5', date: '27/04/2026 15:15' },
                { user: 'Master Admin', action: 'Filtro', resource: 'Lista de Pagamentos', ip: '177.10.5.4', date: '27/04/2026 14:50' },
              ].map((log, i) => (
                <tr key={i} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-white text-sm">{log.user}</td>
                  <td className="px-6 py-4 text-text-secondary text-sm">{log.action}</td>
                  <td className="px-6 py-4 text-white text-sm font-medium">{log.resource}</td>
                  <td className="px-6 py-4 text-text-secondary text-xs font-mono">{log.ip}</td>
                  <td className="px-6 py-4 text-text-secondary text-xs">{log.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {activeSubTab === 'login' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-border-dark rounded-xl text-text-secondary hover:text-white transition-all text-xs font-bold">
              <span className="material-symbols-outlined text-sm">download</span>
              EXPORTAR HISTÓRICO (CSV)
            </button>
          </div>
          <div className="bg-card-dark rounded-2xl border border-border-dark overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-background-dark/50 text-text-secondary text-xs uppercase tracking-widest border-b border-border-dark">
              <tr>
                <th className="px-6 py-4 font-bold">ID Usuário</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold">Dispositivo</th>
                <th className="px-6 py-4 font-bold">Localidade</th>
                <th className="px-6 py-4 font-bold">Data/Hora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-dark">
              {[
                { id: 'master@starfit.one', status: 'Sucesso', device: 'iOS - iPhone 15 Pro', geo: 'São Paulo, BR', date: '27/04/2026 15:45' },
                { id: 'trainer_ana@gmail.com', status: 'Sucesso', device: 'Windows - Chrome', geo: 'Rio de Janeiro, BR', date: '27/04/2026 14:22' },
                { id: 'aluno_joao@outlook.com', status: 'Falha (Senha)', device: 'Android - Galaxy S23', geo: 'Lisboa, PT', date: '27/04/2026 13:10' },
                { id: 'master@starfit.one', status: 'Sucesso', device: 'macOS - Safari', geo: 'São Paulo, BR', date: '27/04/2026 09:00' },
              ].map((auth, i) => (
                <tr key={i} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-white text-sm">{auth.id}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${auth.status === 'Sucesso' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {auth.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-text-secondary text-sm">{auth.device}</td>
                  <td className="px-6 py-4 text-text-secondary text-sm">{auth.geo}</td>
                  <td className="px-6 py-4 text-text-secondary text-xs">{auth.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {activeSubTab === 'changes' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-border-dark rounded-xl text-text-secondary hover:text-white transition-all text-xs font-bold">
              <span className="material-symbols-outlined text-sm">download</span>
              RELATÓRIO DE ALTERAÇÕES
            </button>
          </div>
          <div className="bg-card-dark rounded-2xl border border-border-dark overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-background-dark/50 text-text-secondary text-xs uppercase tracking-widest border-b border-border-dark">
              <tr>
                <th className="px-6 py-4 font-bold">Autor</th>
                <th className="px-6 py-4 font-bold">Tipo</th>
                <th className="px-6 py-4 font-bold">De</th>
                <th className="px-6 py-4 font-bold">Para</th>
                <th className="px-6 py-4 font-bold">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-dark">
              {[
                { author: 'Master Admin', type: 'Plano: VIP', from: 'R$ 199,00', to: 'R$ 249,00', date: '26/04/2026' },
                { author: 'Master Admin', type: 'Config Pay', from: 'Stripe: Test', to: 'Stripe: Live', date: '25/04/2026' },
                { author: 'System', type: 'Backup', from: 'None', to: 'AWS S3 Snapshot', date: '25/04/2026' },
                { author: 'Master Admin', type: 'Permissão Trainer', from: 'Basic', to: 'Advanced', date: '24/04/2026' },
              ].map((change, i) => (
                <tr key={i} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-white text-sm">{change.author}</td>
                  <td className="px-6 py-4 text-primary text-sm font-bold">{change.type}</td>
                  <td className="px-6 py-4 text-text-secondary text-xs font-mono strike-through">{change.from}</td>
                  <td className="px-6 py-4 text-green-400 text-xs font-mono">{change.to}</td>
                  <td className="px-6 py-4 text-text-secondary text-xs">{change.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {activeSubTab === 'blocking' && (
        <div className="space-y-6">
          <div className="bg-card-dark p-6 rounded-2xl border border-border-dark">
            <h3 className="text-lg font-bold text-white mb-6">Controle de Bloqueio</h3>
            <div className="flex gap-4 mb-8">
              <input 
                type="text" 
                placeholder="Buscar usuário por email, ID ou IP..."
                onChange={() => {}}
                className="flex-1 bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
              />
              <button className="bg-primary text-background-dark px-6 py-3 rounded-xl font-black text-sm hover:scale-[1.02] transition-all">
                BUSCAR
              </button>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold text-text-secondary uppercase tracking-widest">Bloqueios Ativos</h4>
              {[
                { target: 'usuario_spam@gmail.com', reason: 'Violação de Termos', type: 'Conta', date: 'Desde 20/04/2026' },
                { target: '192.168.45.12', reason: 'Múltiplas tentativas de login', type: 'IP', date: 'Desde há 2 horas' },
              ].map((block, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-red-500/5 border border-red-500/10 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="bg-red-500/20 p-2 rounded-lg">
                      <span className="material-symbols-outlined text-red-500">{block.type === 'IP' ? 'dns' : 'person'}</span>
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">{block.target}</p>
                      <p className="text-text-secondary text-xs">{block.reason} • {block.date}</p>
                    </div>
                  </div>
                  <button className="text-red-500 font-bold text-xs uppercase hover:underline">
                    Desbloquear
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSecurity;
