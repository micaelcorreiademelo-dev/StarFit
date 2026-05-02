import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, Legend
} from 'recharts';
import { db } from '../services/firebase';
import { collection, onSnapshot, query, where, getDocs } from 'firebase/firestore';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const AdminReports: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [selectedEntityId, setSelectedEntityId] = useState<string>('');
  
  const [stats, setStats] = useState({
    activeStudents: 0,
    totalTrainers: 0,
    estimatedRevenue: 0,
    cardRevenue: 0,
    pixRevenue: 0,
  });
  const [trainers, setTrainers] = useState<any[]>([]);
  const [platformPlans, setPlatformPlans] = useState<any[]>([]);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Escutar os planos ativados para termos um pricing real
    const unsubPlans = onSnapshot(collection(db, 'platformPlans'), (snapshot) => {
      const plansList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPlatformPlans(plansList);
    });

    const qUsers = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(qUsers, (snapshot) => {
      const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      const trainersList = users.filter(doc => doc.role === 'TRAINER');
      const studentsList = users.filter(doc => doc.role === 'STUDENT');
      
      setTrainers(trainersList.map(t => {
        const tStudents = studentsList.filter(s => s.trainerId === t.id);
        // Calcular com base nos planos reais que temos carregado
        // Como o platformPlans é atualizado assincronamente, usamos um valor base se falhar
        const planObj = platformPlans.find(p => p.name === t.plan);
        const planPrice = planObj ? parseFloat(planObj.price.replace(/[^\d,]/g, '').replace(',', '.')) : 0;
        
        // Simular split determinístico
        const hash = t.id.charCodeAt(0) % 100;
        const cardPct = (hash < 30 ? 60 : hash > 70 ? 80 : 70) / 100;
        const cardVal = planPrice * cardPct;
        const pixVal = planPrice - cardVal;

        return {
          ...t,
          studentsCount: tStudents.length,
          revenue: planPrice,
          cardRevenue: cardVal,
          pixRevenue: pixVal
        };
      }));
    }, (error) => {
      console.error("AdminReports snapshot error:", error);
    });

    return () => {
      unsubPlans();
      unsubscribe();
    };
  }, [platformPlans]);

  // Recalcular stats quando array de personais mudar ou filtro de seleção
  useEffect(() => {
    let targetTrainers = trainers;
    if (selectedEntityId) {
      targetTrainers = trainers.filter(t => t.id === selectedEntityId);
    }

    const students = targetTrainers.reduce((acc, t) => acc + t.studentsCount, 0);
    const revenue = targetTrainers.reduce((acc, t) => acc + t.revenue, 0);
    const cardRevenue = targetTrainers.reduce((acc, t) => acc + t.cardRevenue, 0);
    const pixRevenue = targetTrainers.reduce((acc, t) => acc + t.pixRevenue, 0);

    setStats({
      activeStudents: students,
      totalTrainers: targetTrainers.length,
      estimatedRevenue: revenue,
      cardRevenue,
      pixRevenue
    });
  }, [trainers, selectedEntityId]);

  const currentEntityName = selectedEntityId 
    ? trainers.find(e => e.id === selectedEntityId)?.name 
    : '';

  // Adaptive data based on real stats (mocked history based on current stats)
  const REVENUE_DATA = [
    { month: 'Passado 3', revenue: stats.estimatedRevenue * 0.7, trainerRev: stats.estimatedRevenue * 0.7 },
    { month: 'Passado 2', revenue: stats.estimatedRevenue * 0.8, trainerRev: stats.estimatedRevenue * 0.8 },
    { month: 'Passado 1', revenue: stats.estimatedRevenue * 0.9, trainerRev: stats.estimatedRevenue * 0.9 },
    { month: 'Atual', revenue: stats.estimatedRevenue, trainerRev: stats.estimatedRevenue },
  ];

  const USER_GROWTH = [
    { day: 'Dia 1', active: Math.floor(stats.activeStudents * 0.6), new: 1 },
    { day: 'Dia 5', active: Math.floor(stats.activeStudents * 0.7), new: 2 },
    { day: 'Dia 10', active: Math.floor(stats.activeStudents * 0.8), new: 3 },
    { day: 'Dia 20', active: Math.floor(stats.activeStudents * 0.95), new: 4 },
    { day: 'Hoje', active: stats.activeStudents, new: 5 },
  ];

  const exportPDF = () => {
    if (reportRef.current) {
      html2canvas(reportRef.current, { backgroundColor: '#0a160d' }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save('relatorio_starfit.pdf');
      });
    }
  };

  const exportCSV = () => {
    import('papaparse').then(Papa => {
      const csvData = trainers.map(t => ({
        Personal: t.name,
        Email: t.email,
        AlunosAtivos: t.studentsCount,
        Plano: t.plan || 'Nenhum',
        Faturamento: `R$ ${t.revenue.toFixed(2)}`,
        Cartao: `R$ ${t.cardRevenue.toFixed(2)}`,
        Pix: `R$ ${t.pixRevenue.toFixed(2)}`
      }));
      const csv = Papa.unparse(csvData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', 'relatorio_personais.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

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
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <button onClick={exportCSV} className="bg-card-dark border border-border-dark text-white font-bold px-6 py-2 rounded-lg hover:bg-white/5 transition-all flex items-center gap-2 justify-center">
              <span className="material-symbols-outlined">table</span>
              CSV
            </button>
            <button onClick={exportPDF} className="bg-primary text-background-dark font-bold px-6 py-2 rounded-lg hover:scale-105 transition-transform flex items-center gap-2 justify-center">
              <span className="material-symbols-outlined">picture_as_pdf</span>
              PDF
            </button>
          </div>
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

          <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 gap-3">
          <select 
            value={selectedEntityId}
            onChange={(e) => setSelectedEntityId(e.target.value)}
            className="h-10 bg-background-dark border border-border-dark rounded-lg px-3 text-sm text-white focus:ring-primary focus:border-primary outline-none disabled:opacity-50"
          >
            <option value="">{selectedEntityId ? currentEntityName : 'Visão Geral (Todos)'}</option>
            {trainers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>

          {selectedEntityId && (
            <button 
              onClick={() => setSelectedEntityId('')}
              className="h-10 text-red-400 hover:text-red-300 transition-colors text-sm font-bold flex items-center gap-1 justify-center underline"
            >
              <span className="material-symbols-outlined text-sm">close</span>
              Limpar Filtro
            </button>
          )}
        </div>
      </div>
    </header>

    <div ref={reportRef} className="space-y-8 p-1">
      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-card-dark p-5 rounded-2xl border border-border-dark shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-2xl">group</span>
            </div>
            <span className="text-primary text-xs font-bold leading-none bg-primary/10 px-2 py-1 rounded-full">+100%</span>
          </div>
          <p className="text-sm text-text-secondary leading-none">Alunos Ativos</p>
          <p className="text-2xl font-black text-white mt-1">{stats.activeStudents}</p>
          <p className="text-[10px] text-text-secondary mt-1 uppercase font-bold tracking-wider">Total Relatório</p>
        </div>

        <div className="bg-card-dark p-5 rounded-2xl border border-border-dark shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-2xl">payments</span>
            </div>
            <span className="text-primary text-xs font-bold leading-none bg-primary/10 px-2 py-1 rounded-full">+100%</span>
          </div>
          <p className="text-sm text-text-secondary leading-none">Faturamento</p>
          <p className="text-2xl font-black text-white mt-1">R$ {stats.estimatedRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <p className="text-[10px] text-text-secondary mt-1 uppercase font-bold tracking-wider">Mês Atual</p>
        </div>

        {!selectedEntityId && (
          <div className="bg-card-dark p-5 rounded-2xl border border-border-dark shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-2xl">person_pin</span>
              </div>
            </div>
            <p className="text-sm text-text-secondary leading-none">Personal Trainers</p>
            <p className="text-2xl font-black text-white mt-1">{stats.totalTrainers}</p>
            <p className="text-[10px] text-text-secondary mt-1 uppercase font-bold tracking-wider">Cadastrados</p>
          </div>
        )}
      </div>

        {/* Análise Financeira Segmentada */}
        <div className="bg-card-dark p-6 rounded-2xl border border-border-dark">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h3 className="text-lg font-bold text-white leading-none">Faturamento Estimado</h3>
              <p className="text-sm text-text-secondary mt-1">Evolução de faturamento</p>
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
                  <Bar dataKey="trainerRev" name="Receita Sistema" fill="#22c55e" radius={[4, 4, 0, 0]} opacity={0.8} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="flex flex-col justify-center space-y-4">
              <div className="bg-background-dark p-5 rounded-2xl border border-border-dark">
                <div className="flex items-center gap-3 mb-4">
                  <div className="size-2 bg-primary/60 rounded-full"></div>
                  <p className="text-xs font-bold text-white uppercase tracking-widest">Faturamento</p>
                </div>
                <p className="text-2xl font-black text-white">R$ {stats.estimatedRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                <div className="flex items-center justify-between mt-2 text-xs">
                  <span className="text-text-secondary">Cartão: {stats.estimatedRevenue > 0 ? Math.round((stats.cardRevenue / stats.estimatedRevenue) * 100) : 0}%</span>
                  <span className="text-text-secondary">Pix: {stats.estimatedRevenue > 0 ? Math.round((stats.pixRevenue / stats.estimatedRevenue) * 100) : 0}%</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-primary text-sm">trending_up</span>
                  <p className="text-xs font-bold text-primary uppercase">Crescimento Mensal</p>
                </div>
                <p className="text-xl font-bold text-white">+11.1% <span className="text-xs font-normal text-text-secondary">vs mês anterior</span></p>
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
                <p className="text-xl font-black text-white mt-1">R$ {stats.cardRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                <p className="text-[10px] text-primary mt-1">{stats.estimatedRevenue > 0 ? Math.round((stats.cardRevenue / stats.estimatedRevenue) * 100) : 0}% do total</p>
              </div>
              <div className="bg-background-dark p-4 rounded-xl border border-border-dark flex flex-col items-center justify-center">
                <span className="material-symbols-outlined text-4xl text-orange-400 mb-2">qr_code_2</span>
                <p className="text-xs font-bold text-text-secondary uppercase">Pix</p>
                <p className="text-xl font-black text-white mt-1">R$ {stats.pixRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                <p className="text-[10px] text-primary mt-1">{stats.estimatedRevenue > 0 ? Math.round((stats.pixRevenue / stats.estimatedRevenue) * 100) : 0}% do total</p>
              </div>
            </div>
            <div className="mt-6 p-4 bg-primary/10 rounded-xl border border-primary/20 flex items-center justify-between">
              <p className="text-sm font-bold text-white">Lucro Líquido</p>
              <p className="text-lg font-black text-primary">R$ {stats.estimatedRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>

          <div className="bg-card-dark p-6 rounded-2xl border border-border-dark">
            <h3 className="text-lg font-bold text-white mb-6">Curva de Alunos</h3>
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

        {!selectedEntityId && (
          <div className="bg-card-dark rounded-2xl border border-border-dark overflow-hidden shadow-sm">
            <div className="p-6 border-b border-border-dark">
              <h3 className="text-lg font-bold text-white">Performance Individual dos Personais</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-background-dark/50 text-text-secondary text-xs uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4 font-bold">Personal</th>
                    <th className="px-6 py-4 font-bold text-center">Alunos Ativos</th>
                    <th className="px-6 py-4 font-bold">Plano</th>
                    <th className="px-6 py-4 font-bold">Faturamento (Plataforma)</th>
                    <th className="px-6 py-4 font-bold text-right text-transparent">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-dark">
                  {trainers.map((item) => (
                    <tr key={item.id} className="hover:bg-white/5 transition-colors cursor-default">
                      <td className="px-6 py-4 text-white font-medium">{item.name}</td>
                      <td className="px-6 py-4 text-center text-text-secondary">{item.studentsCount}</td>
                      <td className="px-6 py-4 text-primary font-medium">{item.plan || 'Sem plano'}</td>
                      <td className="px-6 py-4 text-white font-bold">R$ {item.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
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
                  {trainers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-text-secondary">Nenhum personal para exibir.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReports;

