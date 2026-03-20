
import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { User } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import TrainerChat from './TrainerChat';
import TrainerLandingPage from './TrainerLandingPage';

interface TrainerDashboardProps {
  user: User;
  onLogout: () => void;
}

interface ExerciseEntry {
  id: string;
  name: string;
  sets: string;
  reps: string;
  rest: string;
  notes: string;
}

interface LibraryExercise {
  id: string;
  name: string;
  category: string;
  difficulty: 'Iniciante' | 'Intermediário' | 'Avançado';
  imageUrl: string;
}

const GROWTH_DATA = [
  { month: 'Jan', value: 30 },
  { month: 'Fev', value: 35 },
  { month: 'Mar', value: 32 },
  { month: 'Abr', value: 38 },
  { month: 'Mai', value: 42 },
  { month: 'Jun', value: 40 },
];

const LIBRARY_EXERCISES: LibraryExercise[] = [
  { id: '1', name: 'Supino Reto com Barra', category: 'Peito', difficulty: 'Avançado', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAEuvqhS1E53noe84Ef3h3Vr-vZkFCgGr7pmcVmawNqmcnoVHJglkIWOkH_vaYHVJkyi8y3v89nTTQWeOB9FV134NXHlTkeKUBnkLm3L1Pi8Xo5s-8LSW1gdT8SF4uVfC6Ok9DFnlFYol0qprahGqy_JBM9QgT0HmgF3z3inkS3L8ur6OtxBrNc3VX2fW-BgY9UkDdzC0_6uVnZZkNwvV9Pt5DoobE4uPQB8NrO38hwxKGjOPnPfYY8mb_lL9-xWr8CyHsaaUVDbvc' },
  { id: '2', name: 'Agachamento Livre', category: 'Pernas', difficulty: 'Avançado', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAUOIw88-8-gpilKFj0k_wUq90Wu4fBC93PIEdGXumJNTHE6kjVi1UUR929T0ob5dbnxLR7kbpr8hLXm0MpqNgzewg1anLOMj06V4Y9z4Llh8EcYXrz0BP3XTuJ9_l0F9dNMHiuSDH7L5_WVxZNkV9qvo-Wl_N2VhDfMTt1ODZ0f7kkNRediJfVjGWZ12p0pCOGbz66542BAmafChpYJKRfcAd_sJETRjUuQymDFiR61PPq8UjZdjoGqHbId8qn2xauQdIjnJi4VBk' },
  { id: '3', name: 'Remada Curvada', category: 'Costas', difficulty: 'Intermediário', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDo2jRkTkjObRspOxbdyZHz_B8XCpr4dqtSTZrCGpwNVTNlQWOq-VQX3ECpyqxrzEZII217dq7voJSdw_DbCzV4vriHBOBa689qN3Y7gTC5aTd0theL7XlxZCjqXbqh_tkNctms7AaOJgQV1-zDudOIz0WaM7tyu2bt3tbFDNkQeBsrkZrLp5lhssvmLSQ0vr-Bq2dtmj1IqCsXL3gcg8pBPVDxue-tQKV_6BjOz067eTJKSkWXMHyphD4BxtmZWKo2eeOu6KT_J7c' },
  { id: '4', name: 'Levantamento Terra', category: 'Costas', difficulty: 'Avançado', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDuvcVEIfJ8aBCmTuaqJUajtHQ7SE1QSV6DI65P-STsg71qFSpH5g9wN8f0Z1rAWDCnm0SX3cXgTPKP_K8BOFCzUPqKczml85p0gSiqiIb9Qjr2vUlRAw6zPDat5SMkwnqVqMAbEVAjA7GbY5CMp18_h4VJsYbhz9tNu4gm6oGjO9rPY21poazH2bTwauVw1q2tRRaiY0OmnIsVZvzy5MikL6WjWVgLnumXREpUZtbM89Szj0LKV20W_afilr2nRPlWBDs7RIX203E' },
  { id: '5', name: 'Desenvolvimento de Ombros', category: 'Ombros', difficulty: 'Intermediário', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBCFqIbf4khIg7jNUk16gFD_oZ3_OFM4_AsTorw33XGe3_YdGIR6Hzvc53C9KHMx8pQJDbuaIJ0XGdyJsTUz-wKedlLh5PgSfJxk3m-BVv44Fi-Te-AYi906FtDrYBVbWgMRUCU7WcVhScK6xpCf0I3bRMY6GYBhGrR6Gk4qqlZwINbTbHLpfnoDqo6jcpcbdMaXQ2To1NxLXIY1PJ22QEpmIb4B8InfJS2ogGi-EZ_rsPMrmrYpkpGlqbYHXd0xLioUm7MkdRYhsE' },
  { id: '6', name: 'Flexão de Braço', category: 'Peito', difficulty: 'Iniciante', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBBh3JRSHlzm1k6N7DPwxS4sk7ZSIwpa34rO9x7f2MK9pZoU846mdhOLSBpkFm48XDMO2st6KOxx1eknXMGyqv0Hqzw_WdWD8l3uv0zVPVyMEayvzgc7wY7Tnkn3cKald2nq7sMsD4P3_HRsMwXRqg6_cDzFgqMCaoav8NC23n2BHUP-Bzygh3VMpuyjyZg9VPBB3gzDGYD33r62PkjVwHkJRhj_SVW-sn__hvtsvQKKbS2ldeuDZ8RMp8zd2w01acbOAGdMGtA_jE' },
  { id: '7', name: 'Puxada Alta', category: 'Costas', difficulty: 'Iniciante', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDmDcPghcMo4tfxbig5ATIDXz6RFyz1gMHuzOlLMSzK10iSK3mCkria9XzVLXywKYqWWPXB1bfEzPoQGJFDi8nyqbIkrj8nzJIn4mrqM_4EmreqiQabHeHaaHxhbKZU_zoLq_NDYube9KLsYtTOUHmSAQkQT4aG_Oh4TyD-iuaIw7XxYboBGZE3h4T9qII0r5pdtdrFOVwSI4n3JeWiDpgjFP4CB6v1j8_LRwnphkd_2-qY7w07d8x_uoMsu8AyByY2B3hF4hauKHs' },
  { id: '8', name: 'Afundo com Halteres', category: 'Pernas', difficulty: 'Intermediário', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDLzIWmq8uV6tUMRkkeAibsmdToX7ifa8Zm2tCPMJ4c5plqpvSKn2aeAOGlsWRyIxPhU_oHAkWE7aaBN112kRC2yYL6iufIrYAr80QlKA7MuqIwhIZY1qQPxIi8MIlgjfGuwouQ4j90T-SYobfbI1IDR2_8SaTCHJxWnf9auyjC3vgBnWCKZEasjfvW1KaRrlXQksgxK72IzCpEnOL9x4tVoizqpg4VugA90ssqYA2s_OdlFGey-RxWUdx_QDN2Nwy9lepuVqS7YJc' },
  { id: '9', name: 'Rosca Direta', category: 'Bíceps', difficulty: 'Iniciante', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBI8cesI2BXLe0HtcSl-uyY0xGqtHAxjrbBGmAjaHlYgnyvEWwtFlH6YnQxkadPCtdi2wL5D8LAmuWvLiaW3e9PYAlzKimp64AiA_g49WupR6ZY1Q6kyGqg-ULhnxeIqSpMVuEH0QQSNQgeG5lVkR9nKMN3og3m_5c0rlhUoWU3AeAFOdDSLP4LDki9q4C_UhfJpJ6NWdLrMnYmudcg6DfCh_fARYK28uH_2_Ktdo6E-lvu0tlShfuSX3ukYoh5WTFTF62lWNt_d4E' },
  { id: '10', name: 'Tríceps na Polia', category: 'Tríceps', difficulty: 'Iniciante', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCWiaN4zGH9R50V5BeVxo4uS5Udkw35uuIFo9NMFEDep9bqkx-8YvzBewMSRvHFvTG1rMYi6c26ttZP_owcUAKtwVA-UCfgJ-k2bv0xIb58fczXQiyX4KDFlaYJgs1f36AuqczXhX8CoMM38dTXKNyDsBOfwPAQKx-I9hyvcSJQwVeTfklPc3odmMJYZ4cBRgCL_MYiggQgHh9jPvqPdIZ44mMRYvas-U9YdeYbQS_0pJcvMOQAV3OwbfI3LQubQxeU0IDiw04xXB8' },
];

const TrainerDashboard: React.FC<TrainerDashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todas');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Estados para o Criador de Treinos
  const [activeWorkoutTab, setActiveWorkoutTab] = useState('A');
  const [workoutName, setWorkoutName] = useState('');
  const [exercises, setExercises] = useState<ExerciseEntry[]>([
    { id: '1', name: 'Supino Reto (Barra)', sets: '4', reps: '8-10', rest: '60', notes: 'Focar na execução lenta e controlada na fase excêntrica.' },
    { id: '2', name: 'Crucifixo Inclinado (Halteres)', sets: '3', reps: '12', rest: '45', notes: '' }
  ]);

  // Estado para Agenda
  const [agendaView, setAgendaView] = useState<'Mês' | 'Semana'>('Semana');

  const addExercise = () => {
    const newEx: ExerciseEntry = {
      id: Date.now().toString(),
      name: 'Novo Exercício',
      sets: '3',
      reps: '12',
      rest: '60',
      notes: ''
    };
    setExercises([...exercises, newEx]);
  };

  const removeExercise = (id: string) => {
    setExercises(exercises.filter(ex => ex.id !== id));
  };

  const renderDashboard = () => (
    <div className="flex flex-col gap-6 pb-20">
      {/* Header Section */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-white text-3xl font-bold tracking-tight">Painel</p>
          <p className="text-text-secondary text-base font-normal">Bem-vindo de volta, Treinador!</p>
        </div>
        <button 
          onClick={() => setActiveTab('add-student')}
          className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-background-dark text-sm font-bold gap-2 hover:brightness-110 transition-all shadow-lg shadow-primary/20"
        >
          <span className="material-symbols-outlined text-base">add</span>
          <span className="truncate">Adicionar Aluno</span>
        </button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Alunos Ativos', value: '42', detail: '+2 esta semana', color: 'text-primary' },
          { label: 'Novas Alunos (Mês)', value: '5', detail: '+5%', color: 'text-primary' },
          { label: 'Inativos/Cancelados', value: '2', detail: '+1 este mês', color: 'text-red-400' },
          { label: 'Receita Estimada', value: 'R$4.250', detail: '+R$500', color: 'text-primary' }
        ].map((kpi, idx) => (
          <div key={idx} className="flex flex-col gap-2 rounded-xl p-6 border border-border-dark bg-card-dark shadow-sm">
            <p className="text-text-secondary text-base font-medium">{kpi.label}</p>
            <p className="text-white tracking-light text-3xl font-bold">{kpi.value}</p>
            <p className={`${kpi.color} text-sm font-medium`}>{kpi.detail}</p>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <h2 className="text-white text-xl font-bold tracking-tight">Evolução Geral</h2>
          <div className="flex flex-col gap-2 rounded-xl border border-border-dark p-6 bg-card-dark">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <p className="text-text-secondary text-base font-medium">Crescimento de Alunos</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-white tracking-light text-2xl font-bold">42 Alunos</p>
                  <p className="text-primary text-sm font-medium">+15%</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="text-xs font-bold rounded-md px-3 py-1 bg-primary/20 text-primary border border-primary/30">6 meses</button>
                <button className="text-xs font-bold rounded-md px-3 py-1 bg-background-dark text-text-secondary border border-border-dark hover:text-white transition-colors">1 ano</button>
              </div>
            </div>
            <div className="h-[250px] w-full py-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={GROWTH_DATA}>
                  <defs>
                    <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#13ec5b" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#13ec5b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3a5543" vertical={false} opacity={0.2} />
                  <XAxis dataKey="month" stroke="#a1bfaa" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1a2c20', border: '1px solid #3a5543', borderRadius: '8px' }}
                    itemStyle={{ color: '#13ec5b' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#13ec5b" strokeWidth={3} fillOpacity={1} fill="url(#colorGrowth)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Warnings Section */}
        <div className="flex flex-col gap-4">
          <h2 className="text-white text-xl font-bold tracking-tight">Avisos Importantes</h2>
          <div className="flex flex-col gap-4 rounded-xl border border-border-dark p-6 bg-card-dark h-full">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center size-10 rounded-full bg-orange-500/10 shrink-0">
                <span className="material-symbols-outlined text-orange-400">hourglass_top</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold truncate">Pagamento de Maria Silva</p>
                <p className="text-orange-400 text-sm">Vence em 3 dias</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center size-10 rounded-full bg-red-500/10 shrink-0">
                <span className="material-symbols-outlined text-red-400">warning</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold truncate">Plano de João Pedro</p>
                <p className="text-red-400 text-sm">Vencido há 2 dias</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center size-10 rounded-full bg-blue-500/10 shrink-0">
                <span className="material-symbols-outlined text-blue-400">chat_bubble</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold truncate">Nova mensagem de Ana</p>
                <p className="text-text-secondary text-sm truncate">"Olá, podemos remarcar?"</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activities Section */}
      <div className="flex flex-col gap-4">
        <h2 className="text-white text-xl font-bold tracking-tight">Últimas Atividades dos Alunos</h2>
        <div className="rounded-xl border border-border-dark bg-card-dark overflow-hidden">
          <ul className="divide-y divide-border-dark">
            {[
              { name: 'João Silva', action: 'completou o Treino A.', time: 'Hoje, 14:30', img: 'https://i.pravatar.cc/150?u=1' },
              { name: 'Maria Santos', action: 'enviou uma mensagem.', time: 'Hoje, 11:15', img: 'https://i.pravatar.cc/150?u=2' },
              { name: 'Carlos Pereira', action: 'atingiu um novo recorde.', time: 'Ontem, 18:00', img: 'https://i.pravatar.cc/150?u=3' },
              { name: 'Ana Ferreira', action: 'registrou uma nova avaliação.', time: '2 dias atrás', img: 'https://i.pravatar.cc/150?u=4' }
            ].map((activity, idx) => (
              <li key={idx} className="p-4 flex items-center justify-between gap-4 hover:bg-white/5 transition-colors cursor-pointer group">
                <div className="flex items-center gap-4">
                  <img className="size-10 rounded-full object-cover border border-border-dark" src={activity.img} alt={activity.name} />
                  <div>
                    <p className="font-semibold text-white">{activity.name} <span className="font-normal text-text-secondary">{activity.action}</span></p>
                    <p className="text-sm text-text-secondary">{activity.time}</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-text-secondary group-hover:text-primary transition-colors">chevron_right</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );

  const renderAgenda = () => (
    <div className="flex flex-col xl:flex-row w-full gap-8 animate-in fade-in duration-500 pb-20">
      {/* Main Agenda Section */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="flex flex-wrap justify-between gap-3 pb-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-white text-4xl font-black leading-tight tracking-[-0.033em]">Agenda</h1>
            <p className="text-text-secondary text-base font-normal leading-normal">Gerencie seus compromissos e sessões.</p>
          </div>
          <button className="flex h-10 items-center justify-center overflow-hidden rounded-lg px-4 bg-primary text-background-dark text-sm font-bold leading-normal shadow-lg shadow-primary/20 hover:brightness-110 transition-all">
            Adicionar Sessão
          </button>
        </header>

        {/* View Toggle */}
        <div className="flex pb-4">
          <div className="flex h-10 w-full max-w-xs items-center justify-center rounded-lg bg-card-dark border border-border-dark p-1">
            <button 
              onClick={() => setAgendaView('Mês')}
              className={`flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-lg px-2 text-sm font-medium transition-all ${agendaView === 'Mês' ? 'bg-background-dark text-white shadow-sm' : 'text-text-secondary hover:text-white'}`}
            >
              Mês
            </button>
            <button 
              onClick={() => setAgendaView('Semana')}
              className={`flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-lg px-2 text-sm font-medium transition-all ${agendaView === 'Semana' ? 'bg-background-dark text-white shadow-sm' : 'text-text-secondary hover:text-white'}`}
            >
              Semana
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex-grow rounded-xl bg-card-dark border border-border-dark p-4">
          <div className="flex items-center p-1 justify-between mb-4">
            <button className="flex size-10 items-center justify-center rounded-full hover:bg-white/10 text-white transition-colors">
              <span className="material-symbols-outlined text-lg">chevron_left</span>
            </button>
            <p className="text-white text-base font-bold leading-tight">20 — 26 Outubro, 2024</p>
            <button className="flex size-10 items-center justify-center rounded-full hover:bg-white/10 text-white transition-colors">
              <span className="material-symbols-outlined text-lg">chevron_right</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-7 gap-px bg-border-dark border border-border-dark rounded-lg overflow-hidden">
            {/* Days */}
            {[
              { day: 'Dom 20', events: [] },
              { day: 'Seg 21', events: [{ title: 'Ana Beatriz', time: '09:00 - 10:00', color: 'bg-blue-900/50 text-blue-200' }] },
              { day: 'Ter 22', events: [{ title: 'Juliano Souza', time: '14:00 - 15:00', color: 'bg-purple-900/50 text-purple-200' }] },
              { day: 'Qua 23', events: [] },
              { day: 'Qui 24', isToday: true, events: [
                  { title: 'Ana Beatriz', time: '09:00 - 10:00', color: 'bg-blue-900/50 text-blue-200' },
                  { title: 'Grupo Fitness', time: '18:00 - 19:00', color: 'bg-orange-900/50 text-orange-200' }
                ] 
              },
              { day: 'Sex 25', events: [] },
              { day: 'Sáb 26', events: [] }
            ].map((col, idx) => (
              <div key={idx} className={`bg-background-dark p-2 min-h-[120px] ${col.isToday ? 'bg-card-dark' : ''}`}>
                <div className="text-center mb-2">
                  <p className={`text-xs ${col.isToday ? 'text-primary font-bold' : 'text-text-secondary'}`}>{col.day}</p>
                </div>
                <div className="space-y-2">
                  {col.events.map((evt, i) => (
                    <div key={i} className={`${evt.color} p-2 rounded-lg text-left border border-white/5 shadow-sm`}>
                      <p className="text-xs font-bold truncate">{evt.title}</p>
                      <p className="text-[10px] opacity-80">{evt.time}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Side Panel */}
      <aside className="w-full xl:w-80 flex flex-col gap-6">
        {/* Mini Calendar */}
        <div className="rounded-xl bg-card-dark border border-border-dark p-4">
          <div className="flex items-center justify-between mb-4">
            <button className="flex size-8 items-center justify-center rounded-full hover:bg-white/10 text-white transition-colors">
              <span className="material-symbols-outlined text-base">chevron_left</span>
            </button>
            <p className="text-white text-sm font-bold">Outubro 2024</p>
            <button className="flex size-8 items-center justify-center rounded-full hover:bg-white/10 text-white transition-colors">
              <span className="material-symbols-outlined text-base">chevron_right</span>
            </button>
          </div>
          <div className="grid grid-cols-7 gap-y-2 gap-x-1 text-center">
            {['D','S','T','Q','Q','S','S'].map((d, i) => (
              <p key={i} className="text-text-secondary text-xs font-bold">{d}</p>
            ))}
            {/* Mock days for mini calendar */}
            {Array.from({length: 31}, (_, i) => i + 1).map(day => (
              <button key={day} className={`h-8 w-full text-xs font-medium rounded-full flex items-center justify-center transition-colors ${day === 24 ? 'bg-primary text-background-dark font-bold' : 'text-text-primary hover:bg-white/10'}`}>
                {day}
              </button>
            ))}
          </div>
        </div>

        {/* Reminders */}
        <div>
          <h3 className="text-white text-lg font-bold mb-4">Lembretes</h3>
          <div className="space-y-3">
            {[
              { title: 'Sessão com Ana Beatriz', subtitle: 'Hoje às 09:00', icon: 'notifications', color: 'text-primary' },
              { title: 'Grupo Fitness', subtitle: 'Hoje às 18:00', icon: 'fitness_center', color: 'text-primary' },
              { title: 'Pagamento Pendente', subtitle: 'Juliano Souza', icon: 'payments', color: 'text-orange-400' }
            ].map((rem, i) => (
              <div key={i} className="flex gap-3 bg-card-dark border border-border-dark p-3 rounded-lg items-center">
                <div className={`bg-white/5 rounded-full size-10 flex-shrink-0 flex items-center justify-center ${rem.color}`}>
                  <span className="material-symbols-outlined">{rem.icon}</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <p className="text-sm font-medium text-white truncate">{rem.title}</p>
                  <p className="text-sm text-text-secondary">{rem.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );

  const renderStudents = () => (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500 pb-20">
      {/* Page Heading */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div className="flex min-w-72 flex-col gap-2">
          <p className="text-white text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">Gestão de Alunos</p>
          <p className="text-text-secondary text-base font-normal leading-normal">Gerencie os planos e o status de pagamento de seus alunos.</p>
        </div>
        <button 
          onClick={() => setActiveTab('add-student')}
          className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 gap-2 bg-primary text-background-dark text-sm font-bold leading-normal shadow-lg shadow-primary/20 hover:brightness-110 transition-all"
        >
          <span className="material-symbols-outlined text-base">add</span>
          <span className="truncate">Adicionar Assinatura</span>
        </button>
      </div>

      {/* Toolbar & Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="flex w-full items-stretch rounded-lg h-12 bg-card-dark border border-border-dark">
            <div className="text-text-secondary flex items-center justify-center pl-4">
              <span className="material-symbols-outlined">search</span>
            </div>
            <input 
              className="flex w-full min-w-0 flex-1 bg-transparent border-none focus:ring-0 text-white placeholder:text-text-secondary/50 px-4 text-base font-normal leading-normal" 
              placeholder="Buscar aluno por nome..." 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 shrink-0">
          {['Todas', 'Ativa', 'Vencida', 'Cancelada'].map((filter) => (
            <button 
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`flex h-12 shrink-0 items-center justify-center gap-x-2 rounded-lg px-4 transition-all ${
                statusFilter === filter 
                  ? 'bg-primary/20 text-primary border border-primary/30' 
                  : 'bg-card-dark text-text-secondary border border-border-dark hover:text-white'
              }`}
            >
              <p className="text-sm font-medium leading-normal">{filter}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Table Container */}
      <div className="flex flex-col overflow-hidden rounded-xl border border-border-dark bg-card-dark">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border-dark">
            <thead className="bg-background-dark/50">
              <tr>
                <th className="py-3.5 px-6 text-left text-xs font-medium text-text-secondary uppercase tracking-wider" scope="col">Aluno</th>
                <th className="py-3.5 px-6 text-left text-xs font-medium text-text-secondary uppercase tracking-wider hidden md:table-cell" scope="col">Plano Atual</th>
                <th className="py-3.5 px-6 text-left text-xs font-medium text-text-secondary uppercase tracking-wider" scope="col">Status</th>
                <th className="py-3.5 px-6 text-left text-xs font-medium text-text-secondary uppercase tracking-wider hidden lg:table-cell" scope="col">Vencimento</th>
                <th className="relative py-3.5 px-6 text-right" scope="col">
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-dark">
              {[
                { name: 'Ana Beatriz', status: 'Ativa', plan: 'Plano Premium Mensal', vencimento: '25/12/2024', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDq9Y3K_8j4mXCO9yLEon9jWQasYzWTwdDNMyolL5wSMb0gEcsFaEBLbw-5dClOs8cY2ZRN_7jNzOHxQd9S6arle1Uwpt8ZiXN8hWssfX_w8_y8RIAaRfBrMwbyP3OmS-u7irdsDdGpwthobADynTEojbEM5qjhkKnAvlhj0a7nZUXFxlP0tD64ddm6RtYEFZqukYYKlB1t2sA9GTIWoppzp2KOQhr3ndYKIyEHk6zg-1kmHvrB_3aXU6_1AqNwVIdyoGv_KkylAdo' },
                { name: 'Carlos Silva', status: 'Vencida', plan: 'Consultoria Trimestral', vencimento: '30/11/2024', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCKml4Lh9q6qx_fB2O34cbfMM1adYhNMYVDIxwIaSDA9Ir-7T-Mw91BLMb310wE2d8jCxam0E7FNNef1_1q-Ph-kyFi8f-7dxo1svu8Ov_xZcPs5olbO4F1icCY9jMsjRSrhJd5ZA0tqdECn7gJxY6-AzT_q5hBWHuptw_sjU8pEmHNJFxzL251eWoRFVPfz1seIwUEi7G3vY5-QiItAgDMCICxNmXDmDX7y5jvzfP0rtAZrErj2mvxXy3pAFkb4LraDBKWnB6XQCs' },
                { name: 'Juliana Ferreira', status: 'Ativa', plan: 'Plano Básico Mensal', vencimento: '10/01/2025', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDsCHiLgVvlKcSw9NBqj9Cl6my6opdwluzUB3GRMOMjG3h35_Q-XZklPG40OafsIc_y9KowVVh_ahahMb1h6j1D9xtwU32WxnLQAD8zB3WS65GwPz4fLZdNxpGjrIuDTa02YFhQ4QIPSfpBn3EHYgrwBhaDh1kQiCqJwMC5stOf4KPsZVSB5trCenKFMtGbOFlLsLNpZ_gics-F7Mf5w2xou389F_5lP8A0gL4brsM97KfgyZR1ILzNcHqKVY3Ur3wdrO4DOHBKOx8' },
                { name: 'Marcos Oliveira', status: 'Cancelada', plan: 'Plano Premium Mensal', vencimento: '15/11/2024', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCnhL2HoqlkbuANj1WakFsqbjUPblxY2ualVeOxKK4ONQHuwCzhR642eBMa1paRtBwwlkrJ-aE9f_Y6ABTbXDfdfrOqOlyc3f4BKvbwK0UU3UmrsuN--GT6ki4zqGZ6PbRo8jseFzR9IxGAIFi4k4qYlJLnWmF8l0E5zGx7GK-PtHOkZyt3LhMZXjE3rHGJewwdE5a0wfrYO3SwFk40YKmBKzedyAqkvBqVPdaOdVs5yJgODyco8chVmwYvxpxkxkkQ8azEGe08fvk' },
                { name: 'Rafaela Costa', status: 'Ativa', plan: 'Consultoria Trimestral', vencimento: '05/12/2024', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBjnHpprZvL_2awfgTck-M4npFnl8lw7XmB72vpPsYlKVGYIgalsyZuoiiC_UlBecnlYoCe56r19JTKQebpI9k51JUK4HRp9P_STerYSfQIosz-COYcAtGfNPnpomZ0BTAB3ojtAOmT0sq2gxmr3V_93boft9E_REPVN8fC1epKDU5AKa46kUwK_8wxn0qoJnwQXuN_UortbG6H4FNXmGG5SqVRrublRUZNUbhd9XgsXrgs-YKzatB7liPoKanb8n8XkAO67RLPG3Q' }
              ].filter(s => {
                const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesStatus = statusFilter === 'Todas' || s.status === statusFilter;
                return matchesSearch && matchesStatus;
              }).map((student, i) => (
                <tr key={i} className="hover:bg-white/5 transition-colors group cursor-pointer">
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <div className="flex items-center gap-3">
                      <img className="size-10 rounded-full object-cover border border-border-dark" src={student.img} alt={student.name} />
                      <div className="flex flex-col">
                        <span className="font-bold text-white group-hover:text-primary transition-colors">{student.name}</span>
                        <span className="text-xs text-text-secondary md:hidden">{student.plan}</span>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-text-secondary hidden md:table-cell">{student.plan}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${
                      student.status === 'Ativa' ? 'bg-green-500/10 text-primary' :
                      student.status === 'Vencida' ? 'bg-red-500/10 text-red-400' :
                      'bg-white/10 text-text-secondary'
                    }`}>
                      {student.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-text-secondary hidden lg:table-cell">{student.vencimento}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-right">
                    <button className="p-2 rounded-full hover:bg-white/10 text-text-secondary transition-colors">
                      <span className="material-symbols-outlined">more_vert</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Container */}
      <div className="flex items-center justify-between border-t border-border-dark px-4 py-4 sm:px-6 mt-4">
        <div className="flex flex-1 justify-between sm:hidden">
          <button className="relative inline-flex items-center rounded-md border border-border-dark bg-card-dark px-4 py-2 text-sm font-medium text-text-secondary hover:text-white transition-colors">Anterior</button>
          <button className="relative ml-3 inline-flex items-center rounded-md border border-border-dark bg-card-dark px-4 py-2 text-sm font-medium text-text-secondary hover:text-white transition-colors">Próximo</button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-text-secondary">
              Mostrando <span className="font-medium text-white">1</span> a <span className="font-medium text-white">5</span> de <span className="font-medium text-white">23</span> resultados
            </p>
          </div>
          <div>
            <nav aria-label="Pagination" className="isolate inline-flex -space-x-px rounded-md shadow-sm">
              <button className="relative inline-flex items-center rounded-l-md px-2 py-2 text-text-secondary ring-1 ring-inset ring-border-dark hover:bg-white/5 focus:z-20 transition-all">
                <span className="material-symbols-outlined !text-[18px]">chevron_left</span>
              </button>
              <button className="relative z-10 inline-flex items-center bg-primary/20 px-4 py-2 text-sm font-semibold text-primary focus:z-20 border border-primary/30">1</button>
              <button className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-text-secondary ring-1 ring-inset ring-border-dark hover:bg-white/5 focus:z-20 transition-all">2</button>
              <button className="relative hidden items-center px-4 py-2 text-sm font-semibold text-text-secondary ring-1 ring-inset ring-border-dark hover:bg-white/5 focus:z-20 transition-all md:inline-flex">3</button>
              <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-text-secondary ring-1 ring-inset ring-border-dark">...</span>
              <button className="relative inline-flex items-center rounded-r-md px-2 py-2 text-text-secondary ring-1 ring-inset ring-border-dark hover:bg-white/5 focus:z-20 transition-all">
                <span className="material-symbols-outlined !text-[18px]">chevron_right</span>
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAddStudent = () => (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      {/* Page Heading */}
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-white text-4xl font-black leading-tight tracking-[-0.033em]">Cadastrar Novo Aluno</h1>
        <p className="text-text-secondary text-base font-normal leading-normal">Preencha as informações abaixo para adicionar um novo aluno à sua base.</p>
      </div>

      {/* Form Container */}
      <div className="bg-card-dark rounded-2xl p-6 md:p-8 border border-border-dark shadow-2xl">
        <form className="flex flex-col gap-8" onSubmit={(e) => { e.preventDefault(); setActiveTab('students'); }}>
          {/* Section: Informações Pessoais */}
          <div>
            <h3 className="text-white text-lg font-bold leading-tight tracking-[-0.015em] pb-4 border-b border-border-dark">Informações Pessoais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6 pt-6">
              <label className="flex flex-col flex-1">
                <p className="text-text-primary text-base font-medium leading-normal pb-2">Nome completo</p>
                <input required className="w-full rounded-lg text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-border-dark bg-background-dark h-14 placeholder:text-text-secondary/50 px-4 transition-all" placeholder="Digite o nome completo do aluno" type="text" />
              </label>
              <label className="flex flex-col flex-1">
                <p className="text-text-primary text-base font-medium leading-normal pb-2">CPF (Opcional)</p>
                <input className="w-full rounded-lg text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-border-dark bg-background-dark h-14 placeholder:text-text-secondary/50 px-4 transition-all" placeholder="000.000.000-00" type="text" />
              </label>
              <label className="flex flex-col flex-1">
                <p className="text-text-primary text-base font-medium leading-normal pb-2">E-mail</p>
                <input required className="w-full rounded-lg text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-border-dark bg-background-dark h-14 placeholder:text-text-secondary/50 px-4 transition-all" placeholder="exemplo@email.com" type="email" />
              </label>
              <label className="flex flex-col flex-1">
                <p className="text-text-primary text-base font-medium leading-normal pb-2">Telefone</p>
                <input required className="w-full rounded-lg text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-border-dark bg-background-dark h-14 placeholder:text-text-secondary/50 px-4 transition-all" placeholder="(00) 00000-0000" type="tel" />
              </label>
              <label className="flex flex-col flex-1">
                <p className="text-text-primary text-base font-medium leading-normal pb-2">Data de nascimento</p>
                <input required className="w-full rounded-lg text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-border-dark bg-background-dark h-14 placeholder:text-text-secondary/50 px-4 transition-all" placeholder="DD/MM/AAAA" type="text" />
              </label>
            </div>
          </div>

          {/* Section: Dados Físicos e Metas */}
          <div>
            <h3 className="text-white text-lg font-bold leading-tight tracking-[-0.015em] pb-4 border-b border-border-dark">Dados Físicos e Metas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6 pt-6">
              <label className="flex flex-col flex-1">
                <p className="text-text-primary text-base font-medium leading-normal pb-2">Peso Inicial (kg)</p>
                <input className="w-full rounded-lg text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-border-dark bg-background-dark h-14 placeholder:text-text-secondary/50 px-4 transition-all" placeholder="Ex: 75.5" step="0.1" type="number" />
              </label>
              <label className="flex flex-col flex-1">
                <p className="text-text-primary text-base font-medium leading-normal pb-2">Altura Inicial (m)</p>
                <input className="w-full rounded-lg text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-border-dark bg-background-dark h-14 placeholder:text-text-secondary/50 px-4 transition-all" placeholder="Ex: 1.80" step="0.01" type="number" />
              </label>
              <label className="flex flex-col col-span-1 md:col-span-2">
                <p className="text-text-primary text-base font-medium leading-normal pb-2">Objetivo</p>
                <select className="w-full rounded-lg text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-border-dark bg-background-dark h-14 placeholder:text-text-secondary/50 px-4 transition-all cursor-pointer">
                  <option value="">Selecione um objetivo</option>
                  <option value="hipertrofia">Hipertrofia</option>
                  <option value="emagrecimento">Emagrecimento</option>
                  <option value="condicionamento">Condicionamento Físico</option>
                  <option value="reabilitacao">Reabilitação</option>
                </select>
              </label>
            </div>
          </div>

          {/* Section: Informações Adicionais */}
          <div>
            <h3 className="text-white text-lg font-bold leading-tight tracking-[-0.015em] pb-4 border-b border-border-dark">Informações Adicionais</h3>
            <div className="grid grid-cols-1 gap-6 pt-6">
              <label className="flex flex-col">
                <p className="text-text-primary text-base font-medium leading-normal pb-2">Restrições / Observações médicas</p>
                <textarea className="w-full rounded-lg text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-border-dark bg-background-dark min-h-32 placeholder:text-text-secondary/50 p-4 transition-all" placeholder="Descreva aqui qualquer informação médica relevante..."></textarea>
              </label>
              <div className="flex flex-col gap-3">
                <p className="text-text-primary text-base font-medium leading-normal">Status do Aluno</p>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input defaultChecked className="text-primary focus:ring-primary/50 bg-background-dark border-border-dark" name="status" type="radio" />
                    <span className="text-text-primary group-hover:text-primary transition-colors">Ativo</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input className="text-primary focus:ring-primary/50 bg-background-dark border-border-dark" name="status" type="radio" />
                    <span className="text-text-primary group-hover:text-primary transition-colors">Inativo</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end items-center gap-4 pt-6 border-t border-border-dark">
            <button 
              onClick={() => setActiveTab('students')}
              className="px-6 py-3 rounded-lg text-text-primary font-bold hover:bg-white/5 transition-all" 
              type="button"
            >
              Cancelar
            </button>
            <button className="px-8 py-3 bg-primary text-background-dark rounded-lg font-bold shadow-lg shadow-primary/20 hover:brightness-110 transition-all" type="submit">
              Salvar Aluno
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const renderWorkouts = () => (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 pb-24">
      <div className="flex flex-col gap-2">
        <h1 className="text-white text-4xl font-black leading-tight tracking-[-0.033em]">Gestão de Treinos</h1>
        <p className="text-text-secondary text-base font-normal leading-normal">Crie e organize as fichas de treino para seus alunos.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar de Treinos */}
        <div className="lg:col-span-1 flex flex-col gap-4">
           <div className="bg-card-dark rounded-xl border border-border-dark p-4 flex flex-col gap-4">
             <h3 className="text-white font-bold">Fichas Recentes</h3>
             {['Hipertrofia A - Peito', 'Hipertrofia B - Costas', 'Emagrecimento Fullbody', 'Adaptação Iniciante'].map((t, i) => (
               <button key={i} className="flex items-center justify-between p-3 rounded-lg bg-background-dark border border-border-dark hover:border-primary/50 transition-all text-left group">
                 <span className="text-sm text-text-primary group-hover:text-white">{t}</span>
                 <span className="material-symbols-outlined text-text-secondary text-sm">edit</span>
               </button>
             ))}
             <button className="w-full py-3 rounded-lg border border-dashed border-primary/30 text-primary font-bold text-sm hover:bg-primary/10 transition-colors flex items-center justify-center gap-2">
               <span className="material-symbols-outlined">add</span>
               Nova Ficha
             </button>
           </div>
        </div>

        {/* Editor de Treino */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-card-dark rounded-xl border border-border-dark p-6 shadow-sm">
             <div className="flex flex-col gap-4 mb-6">
               <label className="flex flex-col gap-2">
                 <span className="text-sm font-medium text-text-secondary">Nome do Treino</span>
                 <input 
                    type="text" 
                    value={workoutName} 
                    onChange={e => setWorkoutName(e.target.value)} 
                    placeholder="Ex: Treino A - Peito e Tríceps"
                    className="w-full bg-background-dark border border-border-dark rounded-lg px-4 py-2 text-white focus:ring-primary focus:border-primary"
                 />
               </label>
               <div className="flex gap-2">
                 {['A', 'B', 'C', 'D', 'E'].map(tab => (
                   <button
                     key={tab}
                     onClick={() => setActiveWorkoutTab(tab)}
                     className={`size-10 rounded-lg font-bold transition-all ${activeWorkoutTab === tab ? 'bg-primary text-background-dark' : 'bg-background-dark text-text-secondary border border-border-dark hover:text-white'}`}
                   >
                     {tab}
                   </button>
                 ))}
               </div>
             </div>

             <div className="flex flex-col gap-4">
               {exercises.map((ex, idx) => (
                 <div key={ex.id} className="p-4 bg-background-dark rounded-lg border border-border-dark relative group">
                   <button 
                     onClick={() => removeExercise(ex.id)}
                     className="absolute top-2 right-2 text-text-secondary hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                   >
                     <span className="material-symbols-outlined">delete</span>
                   </button>
                   <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
                     <div className="sm:col-span-5 flex flex-col gap-1">
                       <label className="text-xs text-text-secondary">Exercício</label>
                       <input 
                         type="text" 
                         defaultValue={ex.name}
                         className="w-full bg-transparent border-b border-border-dark focus:border-primary text-white text-sm py-1 focus:outline-none"
                       />
                     </div>
                     <div className="sm:col-span-2 flex flex-col gap-1">
                       <label className="text-xs text-text-secondary">Séries</label>
                       <input 
                         type="text" 
                         defaultValue={ex.sets}
                         className="w-full bg-transparent border-b border-border-dark focus:border-primary text-white text-sm py-1 focus:outline-none text-center"
                       />
                     </div>
                     <div className="sm:col-span-2 flex flex-col gap-1">
                       <label className="text-xs text-text-secondary">Reps</label>
                       <input 
                         type="text" 
                         defaultValue={ex.reps}
                         className="w-full bg-transparent border-b border-border-dark focus:border-primary text-white text-sm py-1 focus:outline-none text-center"
                       />
                     </div>
                     <div className="sm:col-span-3 flex flex-col gap-1">
                       <label className="text-xs text-text-secondary">Descanso (s)</label>
                       <input 
                         type="text" 
                         defaultValue={ex.rest}
                         className="w-full bg-transparent border-b border-border-dark focus:border-primary text-white text-sm py-1 focus:outline-none text-center"
                       />
                     </div>
                     <div className="sm:col-span-12 flex flex-col gap-1 mt-2">
                       <label className="text-xs text-text-secondary">Observações</label>
                       <input 
                         type="text" 
                         defaultValue={ex.notes}
                         placeholder="Opcional..."
                         className="w-full bg-transparent border-b border-border-dark focus:border-primary text-text-secondary text-xs py-1 focus:outline-none italic"
                       />
                     </div>
                   </div>
                 </div>
               ))}
               
               <button 
                 onClick={addExercise}
                 className="w-full py-3 rounded-lg border border-dashed border-primary/30 text-primary font-bold text-sm hover:bg-primary/10 transition-colors flex items-center justify-center gap-2"
               >
                 <span className="material-symbols-outlined">add_circle</span>
                 Adicionar Exercício
               </button>
             </div>

             <div className="flex justify-end pt-6 mt-6 border-t border-border-dark">
                <button className="px-6 py-2 bg-primary text-background-dark font-bold rounded-lg hover:brightness-110 transition-all shadow-lg shadow-primary/20">
                  Salvar Treino
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLibrary = () => (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 pb-24">
      <div className="flex flex-col gap-2">
        <h1 className="text-white text-4xl font-black leading-tight tracking-[-0.033em]">Biblioteca de Exercícios</h1>
        <p className="text-text-secondary text-base font-normal leading-normal">Explore e gerencie o banco de dados de exercícios.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {LIBRARY_EXERCISES.map((ex) => (
          <div key={ex.id} className="bg-card-dark rounded-xl border border-border-dark overflow-hidden group hover:border-primary/50 transition-all">
            <div className="aspect-video bg-background-dark relative overflow-hidden">
               <img src={ex.imageUrl} alt={ex.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
               <div className="absolute top-2 right-2 px-2 py-1 rounded bg-black/60 text-white text-[10px] font-bold uppercase backdrop-blur-sm">
                 {ex.category}
               </div>
            </div>
            <div className="p-4 flex flex-col gap-2">
              <h3 className="text-white font-bold text-lg leading-tight group-hover:text-primary transition-colors">{ex.name}</h3>
              <div className="flex items-center justify-between mt-2">
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  ex.difficulty === 'Iniciante' ? 'bg-green-500/20 text-green-400' :
                  ex.difficulty === 'Intermediário' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {ex.difficulty}
                </span>
                <button className="text-text-secondary hover:text-white transition-colors">
                  <span className="material-symbols-outlined">info</span>
                </button>
              </div>
            </div>
          </div>
        ))}
        <button className="bg-card-dark rounded-xl border-2 border-dashed border-border-dark flex flex-col items-center justify-center gap-4 min-h-[280px] hover:border-primary/50 hover:bg-primary/5 transition-all group">
          <div className="size-16 rounded-full bg-background-dark flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <span className="material-symbols-outlined text-3xl text-text-secondary group-hover:text-primary">add</span>
          </div>
          <span className="text-text-secondary font-bold group-hover:text-primary">Novo Exercício</span>
        </button>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'agenda':
        return renderAgenda();
      case 'students':
        return renderStudents();
      case 'add-student':
        return renderAddStudent();
      case 'workouts':
        return renderWorkouts();
      case 'library':
        return renderLibrary();
      case 'chat':
        return <TrainerChat />;
      case 'landing-page':
        return <TrainerLandingPage />;
      default:
        return <div className="text-center py-20 text-text-secondary">Página em construção...</div>;
    }
  };

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
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default TrainerDashboard;
