
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useSearchParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import AdminTrainers from '../components/AdminTrainers';
import AdminPlans from '../components/AdminPlans';
import AdminReports from '../components/AdminReports';
import AdminSupport from '../components/AdminSupport';
import AdminSecurity from '../components/AdminSecurity';
import AdminSettings from '../components/AdminSettings';
import { User } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { MOCK_MRR_DATA } from '../constants';
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
}

const COLORS = ['#13ec5b', '#00C49F', '#FFBB28', '#FF8042'];

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout }) => {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'dashboard';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const [stats, setStats] = useState({
    trainers: 0,
    students: 0,
    subscriptions: 0,
    mrr: 0
  });
  const [pendingTickets, setPendingTickets] = useState(0);

  useEffect(() => {
    // Listen for Trainer count
    const qTrainers = query(collection(db, 'users'), where('role', '==', 'TRAINER'));
    const unsubTrainers = onSnapshot(qTrainers, (snapshot) => {
      setStats(prev => ({ ...prev, trainers: snapshot.size }));
    }, (error) => console.error("AdminDashboard trainers listener error: ", error));

    // Listen for Student count
    const qStudents = query(collection(db, 'users'), where('role', '==', 'STUDENT'));
    const unsubStudents = onSnapshot(qStudents, (snapshot) => {
      setStats(prev => ({ ...prev, students: snapshot.size }));
    }, (error) => console.error("AdminDashboard students listener error: ", error));

    // Listen for Pending Support Tickets
    const qSupport = query(collection(db, 'supportTickets'), where('status', '!=', 'resolvido'));
    const unsubSupport = onSnapshot(qSupport, (snapshot) => {
      setPendingTickets(snapshot.size);
    }, (error) => console.error("AdminDashboard support listener error: ", error));

    return () => {
      unsubTrainers();
      unsubStudents();
      unsubSupport();
    };
  }, []);

  const PIE_DATA = [
    { name: 'Personais', value: stats.trainers },
    { name: 'Alunos', value: stats.students },
  ];

  const kpis = [
    { label: 'MRR Atual', val: `R$ ${stats.mrr.toLocaleString()}`, change: '+0%', up: true },
    { label: 'Assinaturas Ativas', val: stats.students.toString(), change: '+0%', up: true },
    { label: 'Alunos Totais', val: stats.students.toString(), change: '+0%', up: true },
    { label: 'Personal Trainers', val: stats.trainers.toString(), change: '+0%', up: true }
  ];

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
          <motion.button 
            onClick={() => setActiveTab('support')}
            animate={pendingTickets > 0 ? {
              borderColor: ["rgba(34, 197, 94, 0)", "#22c55e", "rgba(34, 197, 94, 0)"],
              backgroundColor: ["rgba(34, 197, 94, 0)", "rgba(34, 197, 94, 0.1)", "rgba(34, 197, 94, 0)"],
            } : {}}
            transition={pendingTickets > 0 ? {
              repeat: Infinity,
              duration: 2,
            } : {}}
            className="relative p-2 text-text-secondary hover:text-white border border-transparent rounded-lg transition-all"
          >
            <span className="material-symbols-outlined">notifications</span>
            {pendingTickets > 0 && (
              <span className="absolute top-1 right-1 bg-red-500 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-background-dark">
                {pendingTickets}
              </span>
            )}
          </motion.button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-[calc(8rem+env(safe-area-inset-bottom))] md:pb-8">
          {activeTab === 'dashboard' && (
            <div className="max-w-7xl mx-auto space-y-8 pb-10">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-black text-white">Dashboard Geral</h1>
                <p className="text-text-secondary">Visão administrativa global da plataforma.</p>
              </div>
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <motion.button 
                  onClick={() => setActiveTab('support')}
                  animate={pendingTickets > 0 ? {
                    borderColor: ["rgba(34, 197, 94, 0.2)", "#22c55e", "rgba(34, 197, 94, 0.2)"],
                    backgroundColor: ["rgba(34, 197, 94, 0)", "rgba(34, 197, 94, 0.2)", "rgba(34, 197, 94, 0)"],
                  } : {}}
                  transition={pendingTickets > 0 ? {
                    repeat: Infinity,
                    duration: 1.5,
                  } : {}}
                  className="relative h-[52px] w-[52px] flex items-center justify-center bg-card-dark border border-border-dark rounded-xl text-text-secondary hover:text-white hover:border-primary transition-all group"
                  title="Chamados de Suporte"
                >
                  <span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">notifications</span>
                  {pendingTickets > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black min-w-[20px] h-5 rounded-full flex items-center justify-center border-2 border-background-dark animate-pulse">
                      {pendingTickets}
                    </span>
                  )}
                </motion.button>
                <button className="bg-primary text-background-dark font-bold px-6 h-[52px] rounded-xl hover:scale-105 transition-transform flex items-center gap-2 flex-1 sm:flex-none justify-center">
                  <span className="material-symbols-outlined">download</span>
                  Exportar Relatório
                </button>
              </div>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {kpis.map((kpi, i) => (
                <div key={i} className="bg-card-dark p-6 rounded-2xl border border-border-dark shadow-sm cursor-default select-none">
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
                  {stats.students === 0 && stats.trainers === 0 ? (
                    <div className="h-full flex items-center justify-center text-text-secondary">
                      Aguardando dados para gerar gráfico...
                    </div>
                  ) : (
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
                  )}
                </div>
              </div>

              <div className="bg-card-dark p-6 rounded-2xl border border-border-dark h-auto min-h-[400px]">
                <h3 className="text-lg font-bold text-white mb-6">Distribuição de Usuários</h3>
                <div className="h-[300px]">
                  {stats.students === 0 && stats.trainers === 0 ? (
                    <div className="h-full flex items-center justify-center text-text-secondary">
                      Nenhum usuário cadastrado.
                    </div>
                  ) : (
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
                  )}
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
                      <th className="px-6 py-4 font-bold">Papel</th>
                      <th className="px-6 py-4 font-bold">E-mail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-dark text-white">
                    {stats.students === 0 && stats.trainers === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-6 py-10 text-center text-text-secondary">
                          Nenhuma atividade recente registrada.
                        </td>
                      </tr>
                    ) : (
                      <tr className="transition-colors">
                        <td colSpan={3} className="px-6 py-4 text-center text-text-secondary">
                          Consulte a aba de usuários para mais detalhes.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          )}
          {activeTab === 'users' && <AdminTrainers />}
          {activeTab === 'plans' && <AdminPlans />}
          {activeTab === 'reports' && <AdminReports />}
          {activeTab === 'support' && <AdminSupport />}
          {activeTab === 'security' && <AdminSecurity />}
          {activeTab === 'settings' && <AdminSettings />}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
