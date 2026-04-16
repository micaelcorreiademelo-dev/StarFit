
import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import AdminTrainers from '../components/AdminTrainers';
import AdminPlans from '../components/AdminPlans';
import { User } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { MOCK_MRR_DATA } from '../constants';

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
}

const COLORS = ['#13ec5b', '#00C49F', '#FFBB28', '#FF8042'];
const PIE_DATA = [
  { name: 'Starter', value: 400 },
  { name: 'Pro', value: 300 },
  { name: 'Premium', value: 300 },
];

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background-dark overflow-hidden">
      <Sidebar 
        user={user} 
        onLogout={onLogout} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between px-4 h-16 bg-card-dark border-b border-border-dark shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 text-text-primary hover:bg-white/5 rounded-lg"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary fill">fitness_center</span>
              <span className="font-black text-xl tracking-tighter text-white">StarFit</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {activeTab === 'dashboard' && (
            <div className="max-w-7xl mx-auto space-y-8 pb-20">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-black text-white">Dashboard Geral</h1>
                <p className="text-text-secondary">Visão administrativa global da plataforma.</p>
              </div>
              <button className="bg-primary text-background-dark font-bold px-6 py-2 rounded-lg hover:scale-105 transition-transform flex items-center gap-2 w-full sm:w-auto justify-center">
                <span className="material-symbols-outlined">download</span>
                Exportar Relatório
              </button>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'MRR Atual', val: 'R$ 45.870', change: '+5.2%', up: true },
                { label: 'Churn Rate', val: '2.1%', change: '-0.5%', up: false },
                { label: 'Novas Assinaturas', val: '123', change: '+10.1%', up: true },
                { label: 'Personal Trainers', val: '850', change: '+2.3%', up: true }
              ].map((kpi, i) => (
                <div key={i} className="bg-card-dark p-6 rounded-2xl border border-border-dark shadow-sm">
                  <p className="text-sm text-text-secondary mb-1">{kpi.label}</p>
                  <p className="text-3xl font-bold text-white mb-2">{kpi.val}</p>
                  <div className={`flex items-center gap-1 text-sm ${kpi.up ? 'text-primary' : 'text-red-400'}`}>
                    <span className="material-symbols-outlined text-sm">{kpi.up ? 'arrow_upward' : 'arrow_downward'}</span>
                    {kpi.change}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-card-dark p-6 rounded-2xl border border-border-dark h-auto min-h-[400px]">
                <h3 className="text-lg font-bold text-white mb-6">Crescimento do MRR</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={MOCK_MRR_DATA}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#13ec5b" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#13ec5b" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#3a5543" vertical={false} opacity={0.3} />
                      <XAxis dataKey="date" stroke="#a1bfaa" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#a1bfaa" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1a2c20', border: '1px solid #3a5543', borderRadius: '8px' }}
                        itemStyle={{ color: '#13ec5b' }}
                      />
                      <Area type="monotone" dataKey="value" stroke="#13ec5b" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-card-dark p-6 rounded-2xl border border-border-dark h-auto min-h-[400px]">
                <h3 className="text-lg font-bold text-white mb-6">Distribuição de Planos</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={PIE_DATA}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {PIE_DATA.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1a2c20', border: '1px solid #3a5543', borderRadius: '8px', color: '#fff' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="bg-card-dark rounded-2xl border border-border-dark overflow-hidden shadow-sm">
              <div className="p-6 border-b border-border-dark flex justify-between items-center bg-white/5">
                <h3 className="text-lg font-bold text-white">Últimos Logs de Atividade</h3>
                <button className="text-primary text-sm font-bold hover:underline">Ver todos</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-background-dark/50 text-text-secondary text-xs uppercase tracking-widest">
                    <tr>
                      <th className="px-6 py-4 font-bold">Usuário</th>
                      <th className="px-6 py-4 font-bold">Ação</th>
                      <th className="px-6 py-4 font-bold hidden sm:table-cell">Data/Hora</th>
                      <th className="px-6 py-4 font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-dark">
                    {[
                      { user: 'personal.trainer@email.com', action: 'Cadastro de Aluno', time: '15/07/2024 14:35', status: 'Sucesso', sColor: 'bg-green-500/20 text-green-400' },
                      { user: 'master.admin@starfit.com', action: 'Alteração de Plano', time: '15/07/2024 11:20', status: 'Concluído', sColor: 'bg-blue-500/20 text-blue-400' },
                      { user: 'outro.personal@email.com', action: 'Exclusão de Treino', time: '14/07/2024 09:15', status: 'Pendente', sColor: 'bg-yellow-500/20 text-yellow-400' }
                    ].map((log, i) => (
                      <tr key={i} className="hover:bg-white/5 transition-colors cursor-default">
                        <td className="px-6 py-4 text-white font-medium">{log.user}</td>
                        <td className="px-6 py-4 text-text-secondary">{log.action}</td>
                        <td className="px-6 py-4 text-text-secondary text-sm hidden sm:table-cell">{log.time}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${log.sColor}`}>
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          )}
          {activeTab === 'users' && <AdminTrainers />}
          {activeTab === 'plans' && <AdminPlans />}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
