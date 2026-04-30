import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, Legend
} from 'recharts';

const REVENUE_DATA = [
  { month: 'Jan', revenue: 12000, expenses: 8000, gymRev: 7200, trainerRev: 4800 },
  { month: 'Fev', revenue: 15000, expenses: 8500, gymRev: 9000, trainerRev: 6000 },
  { month: 'Mar', revenue: 18000, expenses: 9000, gymRev: 11000, trainerRev: 7000 },
  { month: 'Abr', revenue: 22000, expenses: 9500, gymRev: 13500, trainerRev: 8500 },
  { month: 'Mai', revenue: 25000, expenses: 10000, gymRev: 15000, trainerRev: 10000 },
  { month: 'Jun', revenue: 30000, expenses: 11000, gymRev: 18000, trainerRev: 12000 },
];

const USER_GROWTH = [
  { day: '01/04', active: 400, new: 100 },
  { day: '05/04', active: 450, new: 120 },
  { day: '10/04', active: 520, new: 150 },
  { day: '15/04', active: 600, new: 180 },
  { day: '20/04', active: 750, new: 210 },
  { day: '25/04', active: 850, new: 250 },
];

const AdminReports: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [viewType, setViewType] = useState<'ALL' | 'GYMS' | 'TRAINERS'>('ALL');
  const [selectedEntityId, setSelectedEntityId] = useState<string>('');

  const entities = {
    GYMS: [
      { id: 'g1', name: 'StarFit Matriz' },
      { id: 'g2', name: 'BlueFit Unidade 1' },
      { id: 'g3', name: 'SmartFit Centro' },
    ],
    TRAINERS: [
      { id: 't1', name: 'Carlos Sousa' },
      { id: 't2', name: 'Ana Silva' },
      { id: 't3', name: 'Mário Gomes' },
    ]
  };

  const currentEntityName = selectedEntityId 
    ? [...entities.GYMS, ...entities.TRAINERS].find(e => e.id === selectedEntityId)?.name 
    : '';

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      <header className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white">Relatórios Avançados</h1>
            <p className="text-text-secondary">
              {selectedEntityId ? `Análise individual: ${currentEntityName}` : 'Visão geral do ecossistema StarFit.'}
            </p>
          </div>
          <button className="bg-primary text-background-dark font-bold px-6 py-2 rounded-lg hover:scale-105 transition-transform flex items-center gap-2 w-full sm:w-auto justify-center">
            <span className="material-symbols-outlined">download</span>
            Exportar Relatório
          </button>
        </div>

        {/* Smart Filtering Bar */}
        <div className="bg-card-dark p-4 rounded-2xl border border-border-dark flex flex-wrap items-center gap-4">
          <div className="flex bg-background-dark p-1 rounded-xl border border-border-dark">
            {[
              { id: '7d', label: '7 dias' },
              { id: '30d', label: '30 dias' },
              { id: '12m', label: '1 ano' },
            ].map(p => (
              <button 
                key={p.id}
                onClick={() => setSelectedPeriod(p.id)}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${selectedPeriod === p.id ? 'bg-primary text-background-dark' : 'text-text-secondary hover:text-white'}`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="h-8 w-px bg-border-dark hidden md:block"></div>

          <div className="flex-grow grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select 
              value={viewType}
              onChange={(e) => {
                setViewType(e.target.value as any);
                setSelectedEntityId('');
              }}
              className="h-10 bg-background-dark border border-border-dark rounded-lg px-3 text-sm text-white focus:ring-primary focus:border-primary outline-none"
            >
              <option value="ALL">Todas as Categorias</option>
              <option value="GYMS">Apenas Academias</option>
              <option value="TRAINERS">Apenas Personais</option>
            </select>

            <select 
              value={selectedEntityId}
              onChange={(e) => setSelectedEntityId(e.target.value)}
              className="h-10 bg-background-dark border border-border-dark rounded-lg px-3 text-sm text-white focus:ring-primary focus:border-primary outline-none disabled:opacity-50"
            >
              <option value="">{viewType === 'ALL' ? 'Selecione uma categoria primeiro' : `Selecione um(a) ${viewType === 'GYMS' ? 'Academia' : 'Personal'}`}</option>
              {viewType === 'GYMS' && entities.GYMS.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              {viewType === 'TRAINERS' && entities.TRAINERS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>

            {selectedEntityId && (
              <button 
                onClick={() => setSelectedEntityId('')}
                className="h-10 text-red-400 hover:text-red-300 transition-colors text-sm font-bold flex items-center gap-1 justify-center underline"
              >
                <span className="material-symbols-outlined text-sm">close</span>
                Limpar Filtros Individuais
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card-dark p-5 rounded-2xl border border-border-dark shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-2xl">group</span>
            </div>
            <span className="text-primary text-xs font-bold leading-none bg-primary/10 px-2 py-1 rounded-full">+12%</span>
          </div>
          <p className="text-sm text-text-secondary leading-none">Alunos Ativos</p>
          <p className="text-2xl font-black text-white mt-1">{selectedEntityId ? '124' : '2.840'}</p>
          <p className="text-[10px] text-text-secondary mt-1 uppercase font-bold tracking-wider">
            {selectedEntityId ? `Vínculo: ${currentEntityName}` : viewType === 'ALL' ? 'Total Sistema' : viewType === 'GYMS' ? 'Em Academias' : 'Com Personais'}
          </p>
        </div>

        <div className="bg-card-dark p-5 rounded-2xl border border-border-dark shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-2xl">payments</span>
            </div>
            <span className="text-primary text-xs font-bold leading-none bg-primary/10 px-2 py-1 rounded-full">+5.4%</span>
          </div>
          <p className="text-sm text-text-secondary leading-none">Faturamento</p>
          <p className="text-2xl font-black text-white mt-1">{selectedEntityId ? 'R$ 15.200' : 'R$ 84.500'}</p>
          <p className="text-[10px] text-text-secondary mt-1 uppercase font-bold tracking-wider">Período Selecionado</p>
        </div>

        <div className="bg-card-dark p-5 rounded-2xl border border-border-dark shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-2xl">qr_code_2</span>
            </div>
            <span className="text-blue-400 text-xs font-bold leading-none bg-blue-400/10 px-2 py-1 rounded-full">PIX</span>
          </div>
          <p className="text-sm text-text-secondary leading-none">Pix Pendentes</p>
          <p className="text-2xl font-black text-white mt-1">{selectedEntityId ? '3' : '42'}</p>
          <p className="text-[10px] text-text-secondary mt-1 uppercase font-bold tracking-wider">Aguardando Confirmação</p>
        </div>

        <div className="bg-card-dark p-5 rounded-2xl border border-border-dark shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-2xl">trending_down</span>
            </div>
            <span className="text-red-400 text-xs font-bold leading-none bg-red-400/10 px-2 py-1 rounded-full">1.2%</span>
          </div>
          <p className="text-sm text-text-secondary leading-none">Taxa de Churn</p>
          <p className="text-2xl font-black text-white mt-1">0.8%</p>
          <p className="text-[10px] text-text-secondary mt-1 uppercase font-bold tracking-wider">Cancelamentos/Período</p>
        </div>
      </div>

      {/* Análise Financeira Segmentada */}
      <div className="bg-card-dark p-6 rounded-2xl border border-border-dark">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h3 className="text-lg font-bold text-white leading-none">Faturamento Separado</h3>
            <p className="text-sm text-text-secondary mt-1">Comparativo entre Academias e Personais Autônomos</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={REVENUE_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3a5543" vertical={false} opacity={0.3} />
                <XAxis dataKey="month" stroke="#a1bfaa" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#a1bfaa" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#102216', border: '1px solid #3a5543', borderRadius: '12px' }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Legend />
                {viewType !== 'TRAINERS' && (
                  <Bar dataKey="gymRev" name="Academias" fill="#13ec5b" radius={[4, 4, 0, 0]} stackId="a" />
                )}
                {viewType !== 'GYMS' && (
                  <Bar dataKey="trainerRev" name="Personais" fill="#22c55e" radius={[4, 4, 0, 0]} opacity={0.6} stackId="a" />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="flex flex-col justify-center space-y-4">
            <div className="bg-background-dark p-5 rounded-2xl border border-border-dark">
              <div className="flex items-center gap-3 mb-4">
                <div className="size-2 bg-primary rounded-full"></div>
                <p className="text-xs font-bold text-white uppercase tracking-widest">Faturamento Academias</p>
              </div>
              <p className="text-2xl font-black text-white">R$ 52.300,00</p>
              <div className="flex items-center justify-between mt-2 text-xs">
                <span className="text-text-secondary">Cartão: 82%</span>
                <span className="text-text-secondary">Pix: 18%</span>
              </div>
            </div>

            <div className="bg-background-dark p-5 rounded-2xl border border-border-dark opacity-80">
              <div className="flex items-center gap-3 mb-4">
                <div className="size-2 bg-primary/60 rounded-full"></div>
                <p className="text-xs font-bold text-white uppercase tracking-widest">Faturamento Personais</p>
              </div>
              <p className="text-2xl font-black text-white">R$ 32.200,50</p>
              <div className="flex items-center justify-between mt-2 text-xs">
                <span className="text-text-secondary">Cartão: 45%</span>
                <span className="text-text-secondary">Pix: 55%</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-primary text-sm">trending_up</span>
                <p className="text-xs font-bold text-primary uppercase">Crescimento Mensal</p>
              </div>
              <p className="text-xl font-bold text-white">+14.8% <span className="text-xs font-normal text-text-secondary">vs mês anterior</span></p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card-dark p-6 rounded-2xl border border-border-dark">
          <h3 className="text-lg font-bold text-white mb-6">Faturamento por Método</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-background-dark p-4 rounded-xl border border-border-dark flex flex-col items-center justify-center">
              <span className="material-symbols-outlined text-4xl text-blue-400 mb-2">credit_card</span>
              <p className="text-xs font-bold text-text-secondary uppercase">Cartão</p>
              <p className="text-xl font-black text-white mt-1">R$ 60.840</p>
              <p className="text-[10px] text-primary mt-1">72% do total</p>
            </div>
            <div className="bg-background-dark p-4 rounded-xl border border-border-dark flex flex-col items-center justify-center">
              <span className="material-symbols-outlined text-4xl text-orange-400 mb-2">qr_code_2</span>
              <p className="text-xs font-bold text-text-secondary uppercase">Pix</p>
              <p className="text-xl font-black text-white mt-1">R$ 23.660</p>
              <p className="text-[10px] text-primary mt-1">28% do total</p>
            </div>
          </div>
          <div className="mt-6 p-4 bg-primary/10 rounded-xl border border-primary/20 flex items-center justify-between">
            <p className="text-sm font-bold text-white">Lucro Líquido</p>
            <p className="text-lg font-black text-primary">R$ 73.500</p>
          </div>
        </div>

        <div className="bg-card-dark p-6 rounded-2xl border border-border-dark">
          <h3 className="text-lg font-bold text-white mb-6">Crescimento de Ativos</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={USER_GROWTH}>
                <defs>
                  <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#13ec5b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#13ec5b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#3a5543" vertical={false} opacity={0.3} />
                <XAxis dataKey="day" stroke="#a1bfaa" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#a1bfaa" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#102216', border: '1px solid #3a5543', borderRadius: '12px' }}
                />
                <Area type="monotone" dataKey="active" name="Alunos" stroke="#13ec5b" strokeWidth={3} fillOpacity={1} fill="url(#colorActive)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-card-dark rounded-2xl border border-border-dark overflow-hidden shadow-sm">
        <div className="p-6 border-b border-border-dark">
          <h3 className="text-lg font-bold text-white">Performance Individual</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-background-dark/50 text-text-secondary text-xs uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4 font-bold">Nome</th>
                <th className="px-6 py-4 font-bold">Tipo</th>
                <th className="px-6 py-4 font-bold text-center">Alunos Ativos</th>
                <th className="px-6 py-4 font-bold">Faturamento</th>
                <th className="px-6 py-4 font-bold">Crescimento</th>
                <th className="px-6 py-4 font-bold text-right text-transparent">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-dark">
              {[
                { id: 'g1', name: 'StarFit Matriz', type: 'Academia', students: 120, revenue: 'R$ 18.500', growth: '+12%', tColor: 'text-blue-400' },
                { id: 't1', name: 'Carlos Sousa', type: 'Personal', students: 45, revenue: 'R$ 12.500', growth: '+8%', tColor: 'text-primary' },
                { id: 't2', name: 'Ana Silva', type: 'Personal', students: 38, revenue: 'R$ 8.900', growth: '+15%', tColor: 'text-primary' },
                { id: 'g2', name: 'BlueFit Unidade 1', type: 'Academia', students: 210, revenue: 'R$ 24.200', growth: '+5%', tColor: 'text-blue-400' },
              ].filter(item => {
                if (viewType === 'GYMS') return item.type === 'Academia';
                if (viewType === 'TRAINERS') return item.type === 'Personal';
                return true;
              }).map((item) => (
                <tr key={item.id} className="hover:bg-white/5 transition-colors cursor-default">
                  <td className="px-6 py-4 text-white font-medium">{item.name}</td>
                  <td className={`px-6 py-4 text-xs font-bold uppercase tracking-wider ${item.tColor}`}>{item.type}</td>
                  <td className="px-6 py-4 text-center text-text-secondary">{item.students}</td>
                  <td className="px-6 py-4 text-white font-bold">{item.revenue}</td>
                  <td className="px-6 py-4 text-primary font-medium">{item.growth}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setSelectedEntityId(item.id)}
                      className="text-text-secondary hover:text-white text-xs font-bold uppercase tracking-tighter transition-colors"
                    >
                      Ver Detalhes
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;
