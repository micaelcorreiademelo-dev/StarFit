import React, { useState } from 'react';
import AdminAnnouncements from './AdminAnnouncements';

const AdminSupport: React.FC = () => {
  const [supportTab, setSupportTab] = useState<'tickets' | 'announcements'>('tickets');

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-white">Central de Suporte & Comunicação</h1>
          <p className="text-text-secondary">Gerencie chamados de trainers e alunos, e envie comunicados globais.</p>
        </div>

        <div className="flex bg-card-dark p-1 rounded-xl border border-border-dark self-start sm:self-center shrink-0">
          <button 
            onClick={() => setSupportTab('tickets')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${supportTab === 'tickets' ? 'bg-primary text-background-dark' : 'text-text-secondary hover:text-white'}`}
          >
            <span className="material-symbols-outlined text-lg">confirmation_number</span>
            Chamados
          </button>
          <button 
            onClick={() => setSupportTab('announcements')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${supportTab === 'announcements' ? 'bg-primary text-background-dark' : 'text-text-secondary hover:text-white'}`}
          >
            <span className="material-symbols-outlined text-lg">campaign</span>
            Comunicados
          </button>
        </div>
      </header>

      {supportTab === 'tickets' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: 'Chamados Abertos', value: '12', color: 'text-primary' },
              { label: 'Aguardando Resposta', value: '5', color: 'text-yellow-400' },
              { label: 'Resolvidos (Hoje)', value: '28', color: 'text-blue-400' },
            ].map((stat, i) => (
              <div key={i} className="bg-card-dark p-6 rounded-2xl border border-border-dark">
                <p className="text-sm text-text-secondary mb-1">{stat.label}</p>
                <p className={`text-4xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-card-dark rounded-2xl border border-border-dark overflow-hidden shadow-sm">
            <div className="p-6 border-b border-border-dark flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">Chamados Recentes</h3>
              <div className="flex gap-2">
                <button className="text-sm bg-white/5 px-3 py-1 rounded text-white">Pendentes</button>
                <button className="text-sm bg-white/5 px-3 py-1 rounded text-white">Todos</button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-background-dark/50 text-text-secondary text-xs uppercase tracking-widest text-center">
                  <tr>
                    <th className="px-6 py-4 font-bold text-left">Protocolo</th>
                    <th className="px-6 py-4 font-bold text-left">Usuário</th>
                    <th className="px-6 py-4 font-bold text-left">Assunto</th>
                    <th className="px-6 py-4 font-bold">Prioridade</th>
                    <th className="px-6 py-4 font-bold text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-dark">
                  {[
                    { id: '#12345', user: 'Ana Silva (Trainer)', topic: 'Erro no checkout', prio: 'Alta', pColor: 'text-red-400' },
                    { id: '#12346', user: 'João Lopes (Aluno)', topic: 'Alteração de senha', prio: 'Média', pColor: 'text-yellow-400' },
                    { id: '#12347', user: 'Carlos Sousa (Trainer)', topic: 'Bug na agenda', prio: 'Baixa', pColor: 'text-blue-400' },
                  ].map((ticket, i) => (
                    <tr key={ticket.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 text-white font-mono text-sm">{ticket.id}</td>
                      <td className="px-6 py-4 text-white">{ticket.user}</td>
                      <td className="px-6 py-4 text-text-secondary">{ticket.topic}</td>
                      <td className={`px-6 py-4 font-bold text-center ${ticket.pColor}`}>{ticket.prio}</td>
                      <td className="px-6 py-4 text-right">
                        <button className="bg-primary/20 text-primary px-3 py-1 rounded text-[10px] font-bold hover:bg-primary/30 uppercase tracking-widest">
                          Responder
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <AdminAnnouncements />
      )}
    </div>
  );
};

export default AdminSupport;
