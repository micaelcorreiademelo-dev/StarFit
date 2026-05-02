
import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { User } from '../types';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { MOCK_WEIGHT_DATA } from '../constants';
import { useNavigate } from 'react-router-dom';
import { dataService } from '../services/dataService';
import { db } from '../services/firebase';
import { doc, getDoc, query, collection, where, onSnapshot } from 'firebase/firestore';
import UserSupport from '../components/UserSupport';

interface StudentDashboardProps {
  user: User;
  onLogout: () => void;
}

interface ExerciseDetail {
  id: string;
  name: string;
  sets: string;
  reps: string;
  rest: string;
  notes: string;
  completed: boolean;
}

interface ChatMessage {
  id: string;
  sender: 'student' | 'trainer';
  text: string;
  time: string;
  avatar: string;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [workoutTab, setWorkoutTab] = useState<'upcoming' | 'history'>('upcoming');
  const [isTraining, setIsTraining] = useState(false);
  const [completedExercises, setCompletedExercises] = useState<string[]>(['ex3']);
  const [newMessage, setNewMessage] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Trainer Linkage State
  const [trainerLinkStatus, setTrainerLinkStatus] = useState<'initial' | 'search' | 'pending' | 'linked' | 'none'>('initial');
  const [searchQuery, setSearchQuery] = useState('');
  const [foundTrainer, setFoundTrainer] = useState<any>(null);
  const [trainer, setTrainer] = useState<any>(null);

  // Data State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [studentStats, setStudentStats] = useState({
    weightHistory: [] as any[],
    fatHistory: [] as any[],
    lastWeight: 0,
    lastFat: 0
  });

  // Settings State
  const [notifications, setNotifications] = useState({
    workouts: true,
    messages: true,
    progress: false
  });
  const [privacy, setPrivacy] = useState({
    publicProfile: false
  });

  useEffect(() => {
    if (!user) return;

    const unsubWorkouts = dataService.subscribeToStudentWorkouts(user.id, setWorkouts);
    
    // Listen for progress data
    const qProgress = query(
      collection(db, 'progress'), 
      where('studentId', '==', user.id)
    );
    const unsubProgress = onSnapshot(qProgress, (snapshot) => {
      const history = snapshot.docs.map(doc => ({
        dateString: doc.data().date?.toDate().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) || '',
        weight: doc.data().weight,
        fat: doc.data().bodyFat,
        timestamp: doc.data().date?.toMillis() || 0
      })).sort((a, b) => a.timestamp - b.timestamp);

      if (history.length > 0) {
        const last = history[history.length - 1];
        setStudentStats({
          weightHistory: history.map(h => ({ date: h.dateString, value: h.weight })),
          fatHistory: history.map(h => ({ date: h.dateString, value: h.fat })),
          lastWeight: last.weight,
          lastFat: last.fat
        });
      }
    }, (error) => {
      console.error("Progress listener error: ", error);
    });

    // Check for linked trainer
    let unsubTrainer: () => void = () => {};
    let unsubRequests: () => void = () => {};

    if (user.trainerId) {
      setTrainerLinkStatus('linked');
      unsubTrainer = dataService.subscribeToUserById(user.trainerId, setTrainer);
    } else {
      // Check if there's a pending request
      unsubRequests = dataService.subscribeToStudentLinkRequests(user.id, (requests) => {
        if (requests.length > 0) {
          setTrainerLinkStatus('pending');
          dataService.getUserById(requests[0].trainerId).then(t => setFoundTrainer(t));
        } else {
          setTrainerLinkStatus('none');
        }
      });
    }

    return () => {
      unsubWorkouts();
      unsubProgress();
      unsubTrainer();
      unsubRequests();
    };
  }, [user]);

  const handleSearchTrainer = async () => {
    if (!searchQuery.trim()) return;
    try {
      const result = await dataService.searchTrainerByCode(searchQuery);
      setFoundTrainer(result);
      if (result) setTrainerLinkStatus('search');
    } catch (error) {
      console.error("Trainer not found");
      setFoundTrainer(null);
    }
  };

  const handleRequestLink = async () => {
    if (!foundTrainer || !user) return;
    try {
      await dataService.requestLink(user.id, foundTrainer.id);
      setTrainerLinkStatus('pending');
    } catch (error) {
      console.error("Error requesting link:", error);
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    const msg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'student',
      text: newMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      avatar: user.avatar
    };
    setMessages([...messages, msg]);
    setNewMessage('');
  };

  const workoutExercises: ExerciseDetail[] = [
    {
      id: 'ex1',
      name: 'Supino Reto com Barra',
      sets: '3',
      reps: '10-12',
      rest: '60s',
      notes: 'Mantenha a postura correta, controle a descida da barra até o peito.',
      completed: completedExercises.includes('ex1')
    },
    {
      id: 'ex2',
      name: 'Crucifixo Inclinado com Halteres',
      sets: '3',
      reps: '12',
      rest: '45s',
      notes: 'Concentre o movimento no peitoral, evitando forçar os ombros.',
      completed: completedExercises.includes('ex2')
    },
    {
      id: 'ex3',
      name: 'Tríceps na Polia Alta',
      sets: '4',
      reps: '15',
      rest: '60s',
      notes: 'Mantenha os cotovelos fixos ao lado do corpo durante todo o movimento.',
      completed: completedExercises.includes('ex3')
    },
    {
      id: 'ex4',
      name: 'Mergulho nas Paralelas',
      sets: '3',
      reps: 'Até a falha',
      rest: '90s',
      notes: '',
      completed: completedExercises.includes('ex4')
    }
  ];

  const toggleExercise = (id: string) => {
    setCompletedExercises(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const renderDashboard = () => {
    if (trainerLinkStatus !== 'linked') {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-card-light dark:bg-card-dark rounded-2xl border border-border-light dark:border-border-dark shadow-xl max-w-2xl mx-auto mt-10">
          <div className="bg-primary/10 p-6 rounded-full mb-6">
            <span className="material-symbols-outlined text-primary text-6xl">person_search</span>
          </div>
          <h2 className="text-3xl font-black text-text-light-primary dark:text-text-dark-primary mb-4">Bem-vindo ao FitLife!</h2>
          <p className="text-text-light-secondary dark:text-text-dark-secondary text-lg mb-8 max-w-md">
            Para começar sua jornada, você precisa vincular sua conta ao seu Personal Trainer. peça o código exclusivo dele.
          </p>
          
          {trainerLinkStatus === 'pending' ? (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6 w-full flex flex-col items-center">
              <span className="material-symbols-outlined text-yellow-500 text-4xl mb-2">pending</span>
              <p className="text-yellow-600 dark:text-yellow-400 font-bold mb-1">Solicitação Enviada!</p>
              <p className="text-text-light-secondary dark:text-text-dark-secondary text-sm">Aguardando aprovação de {foundTrainer?.name || 'seu treinador'}.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 w-full max-w-md">
              <div className="relative">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ex: PUMP-123"
                  className="w-full bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-xl py-4 px-6 text-text-light-primary dark:text-text-dark-primary focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-mono tracking-widest uppercase"
                />
                <button 
                  onClick={handleSearchTrainer}
                  className="absolute right-2 top-2 bottom-2 bg-primary text-background-dark font-bold px-6 rounded-lg hover:brightness-110 transition-all"
                >
                  Buscar
                </button>
              </div>

              {trainerLinkStatus === 'search' && foundTrainer && (
                <div className="animate-in fade-in zoom-in duration-300 mt-4 p-4 border border-primary/30 rounded-xl bg-primary/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={foundTrainer.avatar} alt="" className="size-12 rounded-full border-2 border-primary" />
                    <div className="text-left">
                      <p className="text-text-light-primary dark:text-text-dark-primary font-bold">{foundTrainer.name}</p>
                      <p className="text-text-light-secondary dark:text-text-dark-secondary text-xs">Personal Trainer</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleRequestLink}
                    className="bg-primary text-background-dark text-sm font-bold py-2 px-4 rounded-lg hover:brightness-110 transition-all border border-primary"
                  >
                    Vincular
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    const todayWorkout = workouts.length > 0 ? workouts[0] : null;

    return (
      <div className="pb-20">
        <div className="flex flex-wrap justify-between gap-3 mb-6">
          <div className="flex min-w-72 flex-col gap-2">
            <h1 className="text-text-light-primary dark:text-text-dark-primary text-4xl font-black leading-tight tracking-[-0.033em]">
              Olá, {user.name.split(' ')[0]}!
            </h1>
            <p className="text-text-light-secondary dark:text-text-dark-secondary text-base font-normal leading-normal">
              {todayWorkout ? 'Pronto para o treino de hoje?' : 'Aguardando seu treinador atribuir um treino.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="p-4 bg-card-light dark:bg-card-dark rounded-xl shadow-[0_0_12px_rgba(0,0,0,0.05)] border border-border-light dark:border-border-dark">
              <div className="flex flex-col items-stretch justify-start">
                <div 
                  className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-lg" 
                  style={{ backgroundImage: `url(${todayWorkout?.coverImage || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop'})` }}
                ></div>
                <div className="flex w-full flex-col items-stretch justify-center gap-1 py-4">
                  <p className="text-text-light-secondary dark:text-text-dark-secondary text-sm font-normal leading-normal">Treino do Dia</p>
                  <p className="text-text-light-primary dark:text-text-dark-primary text-xl font-bold leading-tight tracking-[-0.015em]">
                    {todayWorkout?.title || 'Nenhum treino hoje'}
                  </p>
                  <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3 justify-between mt-2">
                    <div className="flex flex-col gap-1">
                      <p className="text-text-light-secondary dark:text-text-dark-secondary text-base font-normal leading-normal">
                        {todayWorkout?.description || 'Curta seu dia de descanso ou faça uma atividade leve.'}
                      </p>
                      {todayWorkout && <p className="text-text-light-secondary dark:text-text-dark-secondary text-base font-normal leading-normal">{todayWorkout.exercises?.length || 0} exercícios</p>}
                    </div>
                    {todayWorkout && (
                      <button 
                        onClick={() => {
                          setActiveTab('my-workouts');
                          setIsTraining(true);
                        }}
                        className="flex min-w-[140px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-6 bg-primary text-background-dark text-sm font-bold leading-normal shadow-lg shadow-primary/30 hover:brightness-110 transition-all"
                      >
                        Iniciar Treino
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

          <h2 className="text-text-light-primary dark:text-text-dark-primary text-[22px] font-bold leading-tight tracking-[-0.015em] pt-2">
            Evolução Corporal
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2 rounded-xl border border-border-light dark:border-border-dark p-6 bg-card-light dark:bg-card-dark shadow-[0_0_12px_rgba(0,0,0,0.05)]">
              <p className="text-text-light-primary dark:text-text-dark-primary text-base font-medium leading-normal">Peso Corporal (kg)</p>
              <p className="text-text-light-primary dark:text-text-dark-primary tracking-light text-[32px] font-bold leading-tight truncate">
                {studentStats.lastWeight || '--'} kg
              </p>
              <div className="flex gap-1 items-center">
                <p className="text-text-light-secondary dark:text-text-dark-secondary text-sm font-normal leading-normal">Histórico Recente</p>
              </div>
              <div className="h-[180px] w-full mt-4">
                {studentStats.weightHistory.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={studentStats.weightHistory}>
                      <defs>
                        <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#13ec5b" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#13ec5b" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" hide />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1a2c20', border: 'none', borderRadius: '8px', color: '#fff' }}
                        itemStyle={{ color: '#13ec5b' }}
                      />
                      <Area type="monotone" dataKey="value" stroke="#13ec5b" strokeWidth={3} fillOpacity={1} fill="url(#colorWeight)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-text-light-secondary dark:text-text-dark-secondary text-xs opacity-50 text-center">
                    Aguardando primeiros dados de progresso...
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2 rounded-xl border border-border-light dark:border-border-dark p-6 bg-card-light dark:bg-card-dark shadow-[0_0_12px_rgba(0,0,0,0.05)]">
              <p className="text-text-light-primary dark:text-text-dark-primary text-base font-medium leading-normal">Gordura Corporal (%)</p>
              <p className="text-text-light-primary dark:text-text-dark-primary tracking-light text-[32px] font-bold leading-tight truncate">
                {studentStats.lastFat || '--'} %
              </p>
              <div className="flex gap-1 items-center">
                <p className="text-text-light-secondary dark:text-text-dark-secondary text-sm font-normal leading-normal">Histórico Recente</p>
              </div>
              <div className="h-[180px] w-full mt-4">
                {studentStats.fatHistory.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={studentStats.fatHistory}>
                      <defs>
                        <linearGradient id="colorFat" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#13ec5b" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#13ec5b" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" hide />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1a2c20', border: 'none', borderRadius: '8px', color: '#fff' }}
                        itemStyle={{ color: '#13ec5b' }}
                      />
                      <Area type="monotone" dataKey="value" stroke="#13ec5b" strokeWidth={3} fillOpacity={1} fill="url(#colorFat)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-text-light-secondary dark:text-text-dark-secondary text-xs opacity-50 text-center">
                    Aguardando primeiros dados de progresso...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="bg-card-light dark:bg-card-dark rounded-xl p-6 shadow-[0_0_12px_rgba(0,0,0,0.05)] border border-border-light dark:border-border-dark">
            <h3 className="text-text-light-primary dark:text-text-dark-primary text-lg font-bold leading-tight tracking-[-0.015em] mb-4">
              Histórico de Treinos
            </h3>
            <div className="flex flex-col gap-4">
              {[
                { name: 'Treino B - Costas e Bíceps', date: 'Ontem' },
                { name: 'Treino C - Pernas e Ombros', date: '2 dias atrás' },
                { name: 'Treino A - Peito e Tríceps', date: '4 dias atrás' }
              ].map((w, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/20 p-2 rounded-full">
                      <span className="material-symbols-outlined text-primary">fitness_center</span>
                    </div>
                    <div>
                      <p className="text-text-light-primary dark:text-text-dark-primary font-medium text-sm">{w.name}</p>
                      <p className="text-text-light-secondary dark:text-text-dark-secondary text-xs">{w.date}</p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-green-500 fill">check_circle</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card-light dark:bg-card-dark rounded-xl p-6 shadow-[0_0_12px_rgba(0,0,0,0.05)] border border-border-light dark:border-border-dark">
            <h3 className="text-text-light-primary dark:text-text-dark-primary text-lg font-bold leading-tight tracking-[-0.015em] mb-4">
              Falar com o Personal
            </h3>
            <p className="text-text-light-secondary dark:text-text-dark-secondary text-sm mb-4">
              Envie uma mensagem rápida para tirar suas dúvidas.
            </p>
            <textarea 
              className="w-full rounded-lg p-2 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-text-light-primary dark:text-text-dark-primary focus:ring-primary focus:border-primary text-sm" 
              placeholder="Digite sua mensagem aqui..." 
              rows={3}
              onClick={() => setActiveTab('messages')}
            ></textarea>
            <button 
              onClick={() => setActiveTab('messages')}
              className="w-full mt-4 flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-background-dark text-sm font-bold leading-normal shadow-lg shadow-primary/30 hover:brightness-110 transition-all"
            >
              <span className="truncate">Enviar Mensagem</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const renderWorkouts = () => (
    <div className="max-w-7xl mx-auto pb-20">
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-text-light-primary dark:text-text-dark-primary text-4xl font-black leading-tight tracking-[-0.033em]">Meus Treinos</h1>
        <p className="text-text-light-secondary dark:text-text-dark-secondary text-base font-normal leading-normal">Veja seus treinos atribuídos e seu histórico de atividades.</p>
      </div>
      
      <div className="flex border-b border-border-light dark:border-border-dark mb-6">
        <button 
          onClick={() => setWorkoutTab('upcoming')}
          className={`px-4 py-2 text-sm font-medium transition-all ${workoutTab === 'upcoming' ? 'text-primary border-b-2 border-primary' : 'text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary'}`}
        >
          Próximos Treinos
        </button>
        <button 
          onClick={() => setWorkoutTab('history')}
          className={`px-4 py-2 text-sm font-medium transition-all ${workoutTab === 'history' ? 'text-primary border-b-2 border-primary' : 'text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary'}`}
        >
          Histórico de Treinos
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {workouts.map((workout, idx) => (
          <div key={workout.id} className="flex items-center justify-between p-4 bg-card-light dark:bg-card-dark rounded-lg border border-border-light dark:border-border-dark shadow-sm">
            <div className="flex items-center gap-4">
              <div className="bg-primary/20 p-3 rounded-full hidden sm:block">
                <span className="material-symbols-outlined text-primary text-2xl">fitness_center</span>
              </div>
              <div>
                <h3 className="text-text-light-primary dark:text-text-dark-primary font-bold text-lg">{workout.title}</h3>
                <p className="text-text-light-secondary dark:text-text-dark-secondary text-sm">
                  Atribuído em {workout.createdAt?.toDate().toLocaleDateString() || 'Recentemente'}
                </p>
              </div>
            </div>
            <button 
              onClick={() => {
                // Set as active workout if needed
                setIsTraining(true);
              }}
              className="flex min-w-[120px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-6 bg-primary text-background-dark text-sm font-bold leading-normal shadow-lg shadow-primary/30 hover:brightness-110 transition-all"
            >
              Iniciar Treino
            </button>
          </div>
        ))}

        {workouts.length === 0 && (
          <div className="text-center py-20 opacity-50">
            <span className="material-symbols-outlined text-6xl mb-4">fitness_center</span>
            <p className="text-lg">Nenhum treino disponível no momento.</p>
          </div>
        )}
      </div>
    </div>
  );

  const handleTabChange = (tab: string) => {
    if (tab === activeTab && activeTab === 'my-workouts') {
      setIsTraining(false);
    }
    setActiveTab(tab);
  };

  const renderWorkoutDetails = () => (
    <div className="max-w-7xl mx-auto pb-20">
      <div className="flex items-center gap-4 mb-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-text-light-primary dark:text-text-dark-primary text-4xl font-black leading-tight tracking-[-0.033em]">
            {workouts[0]?.title || 'Treino não encontrado'}
          </h1>
          <p className="text-text-light-secondary dark:text-text-dark-secondary text-base font-normal leading-normal">
            Siga os exercícios abaixo para completar seu treino.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {(workouts[0]?.exercises || []).map((ex: any, index: number) => (
          <div 
            key={index} 
            className={`bg-card-light dark:bg-card-dark rounded-lg border border-border-light dark:border-border-dark shadow-sm p-6 flex flex-col gap-4 transition-opacity ${completedExercises.includes(index.toString()) ? 'opacity-60' : ''}`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-text-light-primary dark:text-text-dark-primary">{ex.name}</h2>
                <p className="text-text-light-secondary dark:text-text-dark-secondary text-sm mt-1">Exercício {index + 1} de {workouts[0].exercises.length}</p>
              </div>
              <button 
                onClick={() => {
                  const id = index.toString();
                  setCompletedExercises(prev => 
                    prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
                  );
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                  completedExercises.includes(index.toString())
                    ? 'bg-primary/20 text-primary cursor-default' 
                    : 'border border-primary text-primary hover:bg-primary/10'
                }`}
              >
                <span className={`material-symbols-outlined ${completedExercises.includes(index.toString()) ? 'fill' : ''}`}>
                  {completedExercises.includes(index.toString()) ? 'check_circle' : 'check'}
                </span>
                {completedExercises.includes(index.toString()) ? 'Concluído' : 'Marcar como concluído'}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">Séries</p>
                <p className="text-lg font-bold text-text-light-primary dark:text-text-dark-primary">{ex.sets}</p>
              </div>
              <div>
                <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">Repetições</p>
                <p className="text-lg font-bold text-text-light-primary dark:text-text-dark-primary">{ex.reps}</p>
              </div>
              <div>
                <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">Descanso</p>
                <p className="text-lg font-bold text-text-light-primary dark:text-text-dark-primary">{ex.rest}</p>
              </div>
            </div>

            {ex.notes && (
              <div className="border-t border-border-light dark:border-border-dark pt-4 space-y-2">
                <p className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">Observações do Personal:</p>
                <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">{ex.notes}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderMessages = () => (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full pb-8">
      <div className="flex items-center gap-4 pb-4 border-b border-border-light dark:border-border-dark shrink-0">
        <div className="relative">
          <div 
            className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-12" 
            style={{ backgroundImage: `url(${trainer?.avatar || 'https://images.unsplash.com/photo-1594381898411-846e7d193883?q=80&w=1974&auto=format&fit=crop'})` }}
          ></div>
          <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-card-light dark:ring-card-dark"></span>
        </div>
        <div className="flex flex-col">
          <h2 className="text-text-light-primary dark:text-text-dark-primary text-xl font-bold">{trainer?.name || 'Seu Personal'}</h2>
          <p className="text-text-light-secondary dark:text-text-dark-secondary text-sm font-mono tracking-tight uppercase text-[10px]">@{trainer?.trainerCode || 'TRAINER'}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-6 space-y-6">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex items-start gap-3 ${msg.sender === 'student' ? 'justify-end' : ''}`}
          >
            {msg.sender === 'trainer' && (
              <div 
                className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-8 shrink-0" 
                style={{ backgroundImage: `url(${msg.avatar})` }}
              ></div>
            )}
            <div className={`flex flex-col gap-1 ${msg.sender === 'student' ? 'items-end' : ''}`}>
              <div 
                className={`rounded-xl p-3 max-w-lg ${
                  msg.sender === 'student' 
                    ? 'bg-primary text-background-dark rounded-tr-none' 
                    : 'bg-card-light dark:bg-card-dark text-text-light-primary dark:text-text-dark-primary rounded-tl-none border border-border-light dark:border-border-dark shadow-sm'
                }`}
              >
                <p className="text-sm leading-relaxed">{msg.text}</p>
              </div>
              <span className="text-text-light-secondary dark:text-text-dark-secondary text-xs px-2">{msg.time}</span>
            </div>
            {msg.sender === 'student' && (
              <div 
                className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-8 shrink-0" 
                style={{ backgroundImage: `url(${msg.avatar})` }}
              ></div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-auto pt-4 border-t border-border-light dark:border-border-dark shrink-0">
        <div className="relative">
          <input 
            className="w-full rounded-full py-3 pl-4 pr-12 bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark text-text-light-primary dark:text-text-dark-primary focus:ring-primary focus:border-primary transition-colors text-sm" 
            placeholder="Digite sua mensagem aqui..." 
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <button 
            onClick={handleSendMessage}
            className="absolute inset-y-0 right-0 flex items-center justify-center bg-primary text-background-dark rounded-full w-10 h-10 m-1.5 hover:brightness-110 transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-xl">send</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderProgress = () => (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      <div className="flex flex-wrap justify-between gap-4 items-center mb-6">
        <div className="flex flex-col gap-1">
          <p className="text-text-light-primary dark:text-text-dark-primary text-4xl font-black leading-tight tracking-[-0.033em]">Meu Progresso</p>
          <p className="text-text-light-secondary dark:text-text-dark-secondary text-base font-normal leading-normal">Acompanhe sua evolução e mantenha-se motivado.</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="rounded-lg border border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark text-text-light-primary dark:text-text-dark-primary text-sm focus:ring-primary focus:border-primary px-4 py-2 cursor-pointer transition-colors">
            <option>Últimos 30 dias</option>
            <option>Últimos 3 meses</option>
            <option>Últimos 6 meses</option>
            <option>Todo o período</option>
          </select>
          <button className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 gap-2 bg-primary text-background-dark text-sm font-bold leading-normal shadow-lg shadow-primary/30 hover:brightness-110 transition-all">
            <span className="material-symbols-outlined text-base">add</span>
            <span className="truncate">Adicionar Medida</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="flex flex-col gap-4 rounded-xl border border-border-light dark:border-border-dark p-6 bg-card-light dark:bg-card-dark shadow-[0_0_12px_rgba(0,0,0,0.05)]">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-text-light-primary dark:text-text-dark-primary text-lg font-bold leading-tight tracking-[-0.015em]">Peso Corporal (kg)</p>
                <p className="text-text-light-secondary dark:text-text-dark-secondary text-sm">Evolução do seu peso</p>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-text-light-primary dark:text-text-dark-primary tracking-light text-2xl font-bold leading-tight truncate">82.5 kg</p>
                <p className="text-red-500 dark:text-red-400 text-sm font-medium leading-normal flex items-center gap-1"><span className="material-symbols-outlined text-base">arrow_downward</span>-1.5kg</p>
              </div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={MOCK_WEIGHT_DATA}>
                  <defs>
                    <linearGradient id="colorWeightProg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#13ec5b" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#13ec5b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1a2c20', border: 'none', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#13ec5b' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#13ec5b" strokeWidth={3} fillOpacity={1} fill="url(#colorWeightProg)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-xl border border-border-light dark:border-border-dark p-6 bg-card-light dark:bg-card-dark shadow-[0_0_12px_rgba(0,0,0,0.05)]">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-text-light-primary dark:text-text-dark-primary text-lg font-bold leading-tight tracking-[-0.015em]">Gordura Corporal (%)</p>
                <p className="text-text-light-secondary dark:text-text-dark-secondary text-sm">Percentual de gordura</p>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-text-light-primary dark:text-text-dark-primary tracking-light text-2xl font-bold leading-tight truncate">18.2 %</p>
                <p className="text-green-500 dark:text-green-400 text-sm font-medium leading-normal flex items-center gap-1"><span className="material-symbols-outlined text-base">arrow_downward</span>-0.8%</p>
              </div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={MOCK_WEIGHT_DATA.map(d => ({ ...d, value: 18 + (d.value - 82) }))}>
                  <defs>
                    <linearGradient id="colorFatProg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#13ec5b" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#13ec5b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1a2c20', border: 'none', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#13ec5b' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#13ec5b" strokeWidth={3} fillOpacity={1} fill="url(#colorFatProg)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-card-light dark:bg-card-dark rounded-xl p-6 shadow-[0_0_12px_rgba(0,0,0,0.05)] border border-border-light dark:border-border-dark">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-text-light-primary dark:text-text-dark-primary text-xl font-bold leading-tight tracking-[-0.015em]">Medidas Corporais (cm)</h2>
            <button className="flex items-center gap-2 text-primary font-medium text-sm hover:brightness-125 transition-all">
              <span>Ver Histórico</span>
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: 'Peito', val: '102', change: '+2cm', up: true },
              { label: 'Cintura', val: '85', change: '-1cm', up: false },
              { label: 'Quadril', val: '98', change: '--', up: null },
              { label: 'Braço D.', val: '38', change: '+0.5cm', up: true },
              { label: 'Coxa E.', val: '61', change: '+1cm', up: true },
              { label: 'Pant. D.', val: '40', change: '--', up: null },
            ].map((m, i) => (
              <div key={i} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-background-light dark:bg-background-dark">
                <p className="text-text-light-secondary dark:text-text-dark-secondary text-sm">{m.label}</p>
                <p className="text-text-light-primary dark:text-text-dark-primary text-2xl font-bold">{m.val}</p>
                {m.up !== null ? (
                  <p className={`${m.up ? 'text-green-500' : 'text-red-500'} text-xs font-medium flex items-center gap-0.5`}>
                    <span className="material-symbols-outlined text-xs">{m.up ? 'arrow_upward' : 'arrow_downward'}</span>
                    {m.change}
                  </p>
                ) : (
                  <p className="text-text-light-secondary dark:text-text-dark-secondary text-xs font-medium">--</p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card-light dark:bg-card-dark rounded-xl p-6 shadow-[0_0_12px_rgba(0,0,0,0.05)] border border-border-light dark:border-border-dark">
          <h2 className="text-text-light-primary dark:text-text-dark-primary text-xl font-bold leading-tight tracking-[-0.015em] mb-4">Comparativo de Métricas</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-text-light-secondary dark:text-text-dark-secondary text-sm">Métrica 1</label>
              <select className="rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-light-primary dark:text-text-dark-primary text-sm focus:ring-primary focus:border-primary p-2 cursor-pointer">
                <option defaultValue="Peso Corporal">Peso Corporal</option>
                <option>Gordura Corporal</option>
                <option>Massa Muscular</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-text-light-secondary dark:text-text-dark-secondary text-sm">Métrica 2</label>
              <select className="rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-light-primary dark:text-text-dark-primary text-sm focus:ring-primary focus:border-primary p-2 cursor-pointer">
                <option>Peso Corporal</option>
                <option defaultValue="Gordura Corporal">Gordura Corporal</option>
                <option>Massa Muscular</option>
              </select>
            </div>
            <div className="md:self-end">
              <button className="w-full flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 gap-2 bg-primary/20 text-primary text-sm font-bold leading-normal hover:bg-primary/30 transition-all">
                <span className="material-symbols-outlined text-base">compare_arrows</span>
                <span className="truncate">Comparar</span>
              </button>
            </div>
          </div>
          <div className="mt-6 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={MOCK_WEIGHT_DATA}>
                 <CartesianGrid strokeDasharray="3 3" stroke="#3a5543" vertical={false} opacity={0.3} />
                 <XAxis dataKey="date" hide />
                 <YAxis hide />
                 <Area type="monotone" dataKey="value" stroke="#13ec5b" fill="#13ec5b" fillOpacity={0.1} strokeWidth={2} />
               </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSubscription = () => (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Breadcrumbs & Heading */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-sm">
          <button onClick={() => setActiveTab('dashboard')} className="text-text-secondary hover:text-primary transition-colors">Dashboard</button>
          <span className="text-white/40">/</span>
          <span className="text-white font-medium">Assinatura</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mt-2">
          <div className="flex flex-col gap-1">
            <h1 className="text-white text-3xl md:text-4xl font-black tracking-tight">Meus Planos e Assinatura</h1>
            <p className="text-text-secondary text-base font-light">Gerencie sua assinatura, métodos de pagamento e histórico.</p>
          </div>
        </div>
      </div>

      {/* Section: Current Plan */}
      <section className="bg-card-dark rounded-2xl p-1 shadow-lg ring-1 ring-white/5 relative overflow-hidden group border border-border-dark">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all duration-700"></div>
        <div className="bg-[#152a1d] rounded-xl p-6 md:p-8 flex flex-col md:flex-row gap-8 relative z-10">
          <div className="flex-1 flex flex-col justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-1 rounded">Plano Ativo</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Renovação Automática
                </span>
              </div>
              <h2 className="text-3xl font-bold text-white mb-1">Plano Pro</h2>
              <p className="text-text-secondary">Próxima cobrança em <span className="text-white font-medium">15 Out, 2024</span></p>
            </div>
            <div className="flex items-center gap-4 text-sm text-white/80">
              <div className="flex items-center gap-2 bg-black/20 px-3 py-2 rounded-lg border border-white/5">
                <span className="material-symbols-outlined text-primary text-[20px]">credit_card</span>
                <span>Mastercard •••• 4242</span>
              </div>
            </div>
          </div>
          <div className="w-full md:w-auto md:min-w-[280px] flex flex-col gap-3 justify-center border-t md:border-t-0 md:border-l border-white/10 pt-6 md:pt-0 md:pl-8">
            <div className="flex flex-col gap-1 mb-2">
              <span className="text-text-secondary text-sm">Valor Mensal</span>
              <span className="text-2xl font-bold text-white">R$ 89,90</span>
            </div>
            <button 
              onClick={() => navigate('/subscription-management')}
              className="w-full bg-primary hover:bg-primary/90 text-background-dark font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
            >
              <span className="material-symbols-outlined text-[20px] fill">settings</span>
              Gerenciar Assinatura
            </button>
            <button className="w-full bg-transparent hover:bg-white/5 text-text-secondary hover:text-white font-medium py-2 px-4 rounded-xl transition-all border border-transparent hover:border-white/10 text-sm">
              Cancelar Assinatura
            </button>
          </div>
        </div>
      </section>

      {/* Section: Available Plans */}
      <section>
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 px-2">
          <h2 className="text-white text-2xl font-bold tracking-tight">Planos Disponíveis</h2>
          <div className="flex items-center gap-2 bg-card-dark p-1 rounded-lg border border-border-dark w-fit mt-2 md:mt-0">
            <button className="px-3 py-1.5 rounded bg-primary/20 text-primary text-xs font-bold transition-all">Mensal</button>
            <button className="px-3 py-1.5 rounded hover:bg-white/5 text-text-secondary text-xs font-medium transition-all">Anual (-20%)</button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Starter Plan */}
          <div className="bg-card-dark border border-border-dark rounded-2xl p-6 flex flex-col hover:border-primary/30 transition-all duration-300 relative group shadow-sm">
            <div className="flex-1">
              <h3 className="text-white text-xl font-bold mb-2">Starter</h3>
              <p className="text-text-secondary text-sm mb-6 h-10">Para quem está começando sua jornada fitness.</p>
              <div className="flex items-end gap-1 mb-6">
                <span className="text-3xl font-bold text-white">R$ 59,90</span>
                <span className="text-text-secondary text-sm mb-1">/mês</span>
              </div>
              <ul className="flex flex-col gap-3 mb-8">
                <li className="flex items-start gap-3 text-sm text-white/90">
                  <span className="material-symbols-outlined text-primary text-[20px] fill">check_circle</span>
                  Acesso à academia
                </li>
                <li className="flex items-start gap-3 text-sm text-white/90">
                  <span className="material-symbols-outlined text-primary text-[20px] fill">check_circle</span>
                  App de treinos básico
                </li>
                <li className="flex items-start gap-3 text-sm text-white/40 line-through">
                  <span className="material-symbols-outlined text-white/20 text-[20px]">cancel</span>
                  Aulas coletivas
                </li>
                <li className="flex items-start gap-3 text-sm text-white/40 line-through">
                  <span className="material-symbols-outlined text-white/20 text-[20px]">cancel</span>
                  Nutricionista
                </li>
              </ul>
            </div>
            <button 
              onClick={() => navigate('/checkout')}
              className="w-full bg-background-dark border border-border-dark hover:border-primary/50 text-white font-bold py-3 rounded-xl transition-colors mt-auto"
            >
              Escolher Starter
            </button>
          </div>
          {/* Pro Plan */}
          <div className="bg-gradient-to-b from-[#1a2c20] to-[#102216] border border-primary/40 rounded-2xl p-6 flex flex-col shadow-2xl shadow-primary/5 relative transform md:-translate-y-2 z-10">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-background-dark text-[10px] font-bold px-3 py-1 rounded-full shadow-lg">
              MAIS POPULAR
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h3 className="text-white text-xl font-bold mb-2">Pro</h3>
                <span className="bg-primary/20 text-primary text-[10px] font-bold px-2 py-0.5 rounded">ATUAL</span>
              </div>
              <p className="text-text-secondary text-sm mb-6 h-10">Acesso total e aulas para turbinar resultados.</p>
              <div className="flex items-end gap-1 mb-6">
                <span className="text-4xl font-bold text-white">R$ 89,90</span>
                <span className="text-text-secondary text-sm mb-1">/mês</span>
              </div>
              <ul className="flex flex-col gap-3 mb-8">
                <li className="flex items-start gap-3 text-sm text-white">
                  <span className="material-symbols-outlined text-primary text-[20px] fill">check_circle</span>
                  Acesso ilimitado
                </li>
                <li className="flex items-start gap-3 text-sm text-white">
                  <span className="material-symbols-outlined text-primary text-[20px] fill">check_circle</span>
                  App de treinos Pro
                </li>
                <li className="flex items-start gap-3 text-sm text-white">
                  <span className="material-symbols-outlined text-primary text-[20px] fill">check_circle</span>
                  Aulas coletivas
                </li>
                <li className="flex items-start gap-3 text-sm text-white/40 line-through">
                  <span className="material-symbols-outlined text-white/20 text-[20px]">cancel</span>
                  Nutricionista
                </li>
              </ul>
            </div>
            <button className="w-full bg-white/5 text-white/50 font-bold py-3 rounded-xl cursor-default mt-auto border border-white/5">
              Plano Atual
            </button>
          </div>
          {/* Premium Plan */}
          <div className="bg-card-dark border border-border-dark rounded-2xl p-6 flex flex-col hover:border-primary/30 transition-all duration-300 relative shadow-sm">
            <div className="flex-1">
              <h3 className="text-white text-xl font-bold mb-2">Premium</h3>
              <p className="text-text-secondary text-sm mb-6 h-10">A experiência completa com acompanhamento.</p>
              <div className="flex items-end gap-1 mb-6">
                <span className="text-3xl font-bold text-white">R$ 119,90</span>
                <span className="text-text-secondary text-sm mb-1">/mês</span>
              </div>
              <ul className="flex flex-col gap-3 mb-8">
                <li className="flex items-start gap-3 text-sm text-white/90">
                  <span className="material-symbols-outlined text-primary text-[20px] fill">check_circle</span>
                  Acesso ilimitado VIP
                </li>
                <li className="flex items-start gap-3 text-sm text-white/90">
                  <span className="material-symbols-outlined text-primary text-[20px] fill">check_circle</span>
                  Todos os benefícios Pro
                </li>
                <li className="flex items-start gap-3 text-sm text-white/90">
                  <span className="material-symbols-outlined text-primary text-[20px] fill">check_circle</span>
                  Nutricionista mensal
                </li>
                <li className="flex items-start gap-3 text-sm text-white/90">
                  <span className="material-symbols-outlined text-primary text-[20px] fill">check_circle</span>
                  Avaliação física trimestral
                </li>
              </ul>
            </div>
            <button 
              onClick={() => navigate('/checkout')}
              className="w-full bg-primary text-background-dark font-bold py-3 rounded-xl hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 transition-all mt-auto shadow-sm"
            >
              Fazer Upgrade
            </button>
          </div>
        </div>
      </section>

      {/* Section: Billing History */}
      <section className="mt-4">
        <h2 className="text-white text-xl font-bold tracking-tight mb-4 px-2">Histórico de Pagamentos</h2>
        <div className="bg-card-dark border border-border-dark rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-white/80">
              <thead className="bg-white/5 text-text-secondary uppercase text-[10px] font-semibold">
                <tr>
                  <th className="px-6 py-4">Data</th>
                  <th className="px-6 py-4">Descrição</th>
                  <th className="px-6 py-4">Valor</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Fatura</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-dark">
                {[
                  { date: '15 Set, 2024', desc: 'Mensalidade Pro', price: 'R$ 89,90', status: 'Pago' },
                  { date: '15 Ago, 2024', desc: 'Mensalidade Pro', price: 'R$ 89,90', status: 'Pago' },
                  { date: '15 Jul, 2024', desc: 'Mensalidade Starter', price: 'R$ 59,90', status: 'Pago' }
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">{row.date}</td>
                    <td className="px-6 py-4 font-medium text-white">{row.desc}</td>
                    <td className="px-6 py-4">{row.price}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {row.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-text-secondary hover:text-primary transition-colors p-1 rounded-md hover:bg-primary/10">
                        <span className="material-symbols-outlined text-[20px]">download</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-border-dark bg-background-dark/30 flex justify-center">
            <button className="text-sm text-text-secondary hover:text-white transition-colors font-medium">Ver todo o histórico</button>
          </div>
        </div>
      </section>
    </div>
  );

  const renderSettings = () => (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="mb-8">
        <h1 className="text-text-light-primary dark:text-text-dark-primary text-3xl font-bold leading-tight tracking-[-0.015em]">Configurações</h1>
        <p className="text-text-light-secondary dark:text-text-dark-secondary text-base font-normal leading-normal mt-1">Gerencie suas informações de perfil, notificações e privacidade.</p>
      </div>

      {/* Personal Information Card */}
      <div className="bg-card-light dark:bg-card-dark rounded-xl shadow-[0_0_12px_rgba(0,0,0,0.05)] border border-border-light dark:border-border-dark">
        <div className="p-6 border-b border-border-light dark:border-border-dark">
          <h2 className="text-text-light-primary dark:text-text-dark-primary text-xl font-bold leading-tight tracking-[-0.015em]">Informações Pessoais</h2>
          <p className="text-text-light-secondary dark:text-text-dark-secondary text-sm mt-1">Atualize suas informações pessoais e foto de perfil.</p>
        </div>
        <div className="p-6">
          <div className="flex flex-col md:flex-row items-start gap-8">
            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                <div 
                  className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-24 border-2 border-primary/20" 
                  style={{ backgroundImage: `url(${user.avatar})` }}
                ></div>
                <button className="absolute bottom-0 right-0 flex items-center justify-center size-8 bg-primary rounded-full text-background-dark hover:brightness-110 transition-all shadow-md">
                  <span className="material-symbols-outlined text-lg">edit</span>
                </button>
              </div>
              <button className="text-sm text-primary hover:underline font-medium">Remover</button>
            </div>
            
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">Nome Completo</label>
                <input 
                  className="block w-full rounded-lg bg-background-light dark:bg-background-dark border-border-light dark:border-border-dark text-text-light-primary dark:text-text-dark-primary focus:ring-primary focus:border-primary px-4 py-2" 
                  type="text" 
                  defaultValue={user.name} 
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">E-mail</label>
                <input 
                  className="block w-full rounded-lg bg-background-light dark:bg-background-dark border-border-light dark:border-border-dark text-text-light-primary dark:text-text-dark-primary focus:ring-primary focus:border-primary px-4 py-2" 
                  type="email" 
                  defaultValue={user.email} 
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">Telefone</label>
                <input 
                  className="block w-full rounded-lg bg-background-light dark:bg-background-dark border-border-light dark:border-border-dark text-text-light-primary dark:text-text-dark-primary focus:ring-primary focus:border-primary px-4 py-2" 
                  type="tel" 
                  placeholder="(11) 98765-4321" 
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">Data de Nascimento</label>
                <input 
                  className="block w-full rounded-lg bg-background-light dark:bg-background-dark border-border-light dark:border-border-dark text-text-light-primary dark:text-text-dark-primary focus:ring-primary focus:border-primary px-4 py-2" 
                  type="date" 
                />
              </div>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 bg-background-light/50 dark:bg-background-dark/50 flex justify-end rounded-b-xl border-t border-border-light dark:border-border-dark">
          <button className="bg-primary text-background-dark font-bold h-10 px-6 rounded-lg shadow-lg shadow-primary/30 hover:brightness-110 transition-all text-sm">
            Salvar Alterações
          </button>
        </div>
      </div>

      {/* Notification Preferences Card */}
      <div className="bg-card-light dark:bg-card-dark rounded-xl shadow-[0_0_12px_rgba(0,0,0,0.05)] border border-border-light dark:border-border-dark">
        <div className="p-6 border-b border-border-light dark:border-border-dark">
          <h2 className="text-text-light-primary dark:text-text-dark-primary text-xl font-bold leading-tight tracking-[-0.015em]">Preferências de Notificação</h2>
          <p className="text-text-light-secondary dark:text-text-dark-secondary text-sm mt-1">Escolha como você quer ser notificado.</p>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <p className="font-medium text-text-light-primary dark:text-text-dark-primary">Lembretes de Treino</p>
              <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">Receber notificações para os treinos agendados.</p>
            </div>
            <button 
              onClick={() => setNotifications({...notifications, workouts: !notifications.workouts})}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${notifications.workouts ? 'bg-primary' : 'bg-border-light dark:bg-border-dark'}`}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${notifications.workouts ? 'translate-x-5' : 'translate-x-0'}`}></span>
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <p className="font-medium text-text-light-primary dark:text-text-dark-primary">Novas Mensagens</p>
              <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">Receber notificações quando seu personal te enviar uma mensagem.</p>
            </div>
            <button 
              onClick={() => setNotifications({...notifications, messages: !notifications.messages})}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${notifications.messages ? 'bg-primary' : 'bg-border-light dark:bg-border-dark'}`}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${notifications.messages ? 'translate-x-5' : 'translate-x-0'}`}></span>
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <p className="font-medium text-text-light-primary dark:text-text-dark-primary">Atualizações de Progresso</p>
              <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">Receber notificações sobre seu progresso e metas atingidas.</p>
            </div>
            <button 
              onClick={() => setNotifications({...notifications, progress: !notifications.progress})}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${notifications.progress ? 'bg-primary' : 'bg-border-light dark:bg-border-dark'}`}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${notifications.progress ? 'translate-x-5' : 'translate-x-0'}`}></span>
            </button>
          </div>
        </div>
      </div>

      {/* Privacy Card */}
      <div className="bg-card-light dark:bg-card-dark rounded-xl shadow-[0_0_12px_rgba(0,0,0,0.05)] border border-border-light dark:border-border-dark">
        <div className="p-6 border-b border-border-light dark:border-border-dark">
          <h2 className="text-text-light-primary dark:text-text-dark-primary text-xl font-bold leading-tight tracking-[-0.015em]">Privacidade</h2>
          <p className="text-text-light-secondary dark:text-text-dark-secondary text-sm mt-1">Controle a visibilidade das suas informações.</p>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <p className="font-medium text-text-light-primary dark:text-text-dark-primary">Perfil Público</p>
              <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">Permitir que outros alunos vejam seu perfil e progresso.</p>
            </div>
            <button 
              onClick={() => setPrivacy({publicProfile: !privacy.publicProfile})}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${privacy.publicProfile ? 'bg-primary' : 'bg-border-light dark:bg-border-dark'}`}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${privacy.publicProfile ? 'translate-x-5' : 'translate-x-0'}`}></span>
            </button>
          </div>
        </div>
      </div>

      {/* Personal Trainer Setting */}
      <div className="bg-card-light dark:bg-card-dark rounded-xl shadow-[0_0_12px_rgba(0,0,0,0.05)] border border-border-light dark:border-border-dark">
        <div className="p-6 border-b border-border-light dark:border-border-dark">
          <h2 className="text-text-light-primary dark:text-text-dark-primary text-xl font-bold leading-tight tracking-[-0.015em]">Personal Trainer</h2>
          <p className="text-text-light-secondary dark:text-text-dark-secondary text-sm mt-1">Gerencie seu vínculo com o personal trainer.</p>
        </div>
        <div className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <img src={trainer?.avatar || 'https://images.unsplash.com/photo-1594381898411-846e7d193883?q=80&w=1974&auto=format&fit=crop'} alt="Treinador" className="size-16 rounded-full border-2 border-primary/20 object-cover" />
            <div>
              <h3 className="font-bold text-text-light-primary dark:text-text-dark-primary text-lg">{trainer?.name || 'Ricardo "PUMP" Ferraz'}</h3>
              <p className="text-text-light-secondary dark:text-text-dark-secondary text-sm">@{trainer?.trainerCode || 'ricardopump'}</p>
              <span className="inline-flex items-center px-2 py-0.5 mt-1 rounded text-[10px] font-black uppercase tracking-wider bg-primary/10 text-primary">Vínculo Ativo</span>
            </div>
          </div>
          <button 
            onClick={() => {
              if (confirm('Tem certeza que deseja remover este vínculo? Você não terá mais acesso aos treinos deste personal.')) {
                setTrainerLinkStatus('search');
                setActiveTab('dashboard');
              }
            }}
            className="w-full md:w-auto px-6 py-2 rounded-lg border border-red-500/50 text-red-500 font-bold hover:bg-red-500/10 transition-all text-sm whitespace-nowrap"
          >
            Remover Vínculo
          </button>
        </div>
      </div>
    </div>
  );

  const renderLinkageFlow = () => {
    switch (trainerLinkStatus) {
      case 'initial':
        return (
          <div className="flex flex-col items-center justify-center h-full max-w-xl mx-auto text-center gap-8 animate-in fade-in zoom-in duration-500">
            <div className="size-24 rounded-full bg-primary/10 flex flex-col items-center justify-center text-primary mb-2 shadow-xl shadow-primary/20">
              <span className="material-symbols-outlined text-5xl">group_add</span>
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-text-light-primary dark:text-text-dark-primary mb-4 leading-tight">Você já possui um personal trainer?</h1>
              <p className="text-text-light-secondary dark:text-text-dark-secondary">Para montarmos seus treinos, precisamos saber se você já treina com alguém na StarFit.</p>
            </div>
            <div className="flex gap-4 w-full">
              <button 
                onClick={() => setTrainerLinkStatus('search')}
                className="flex-1 bg-primary text-background-dark font-bold py-4 rounded-xl hover:brightness-110 shadow-lg shadow-primary/20 transition-all text-lg"
              >
                Sim
              </button>
              <button 
                onClick={() => setTrainerLinkStatus('none')}
                className="flex-1 bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark text-text-light-primary dark:text-text-dark-primary font-bold py-4 rounded-xl hover:border-text-light-secondary dark:hover:border-text-dark-secondary transition-all text-lg"
              >
                Não
              </button>
            </div>
          </div>
        );
      case 'search':
        return (
          <div className="flex flex-col h-full max-w-xl mx-auto py-12 animate-in slide-in-from-right duration-500">
            <button 
              onClick={() => { setTrainerLinkStatus('initial'); setFoundTrainer(null); setSearchQuery(''); }}
              className="flex w-fit items-center gap-2 text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary transition-colors mb-8"
            >
              <span className="material-symbols-outlined">arrow_back</span>
              Voltar
            </button>
            <h1 className="text-3xl font-black text-text-light-primary dark:text-text-dark-primary mb-6">Buscar Personal</h1>
            
            <div className="relative mb-8">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-light-secondary dark:text-text-dark-secondary">search</span>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Digitar código ou username (ex: @flaylima)" 
                className="w-full bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-xl py-4 pl-12 pr-4 text-text-light-primary dark:text-text-dark-primary placeholder-text-light-secondary focus:ring-2 focus:ring-primary focus:border-primary transition-all font-medium"
              />
              <button 
                onClick={() => setFoundTrainer({ 
                  id: 't1', 
                  name: 'Alex Lima', 
                  username: '@flaylima', 
                  specialty: 'Musculação e Hipertrofia', 
                  desc: 'Com mais de 10 anos de experiência...', 
                  avatar: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?q=80&w=1974&auto=format&fit=crop'
                })}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary text-background-dark px-4 py-2 rounded-lg font-bold hover:brightness-110 transition-all text-sm"
              >
                Buscar
              </button>
            </div>

            {foundTrainer && (
              <div className="bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-2xl p-6 flex flex-col items-center text-center gap-4 animate-in zoom-in-95 duration-300">
                <img src={foundTrainer.avatar} alt="Trainer" className="size-24 rounded-full border-4 border-primary/20 shadow-lg object-cover" />
                <div>
                  <h2 className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">{foundTrainer.name}</h2>
                  <p className="text-primary font-semibold text-sm mb-2">{foundTrainer.specialty}</p>
                  <p className="text-text-light-secondary dark:text-text-dark-secondary text-sm px-4">{foundTrainer.desc}</p>
                </div>
                <button 
                  onClick={() => setTrainerLinkStatus('pending')}
                  className="w-full mt-4 bg-primary text-background-dark font-bold py-3 rounded-xl shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">person_add</span>
                  Solicitar vínculo
                </button>
              </div>
            )}
          </div>
        );
      case 'pending':
        return (
          <div className="flex flex-col items-center justify-center h-full max-w-xl mx-auto text-center gap-6 animate-in fade-in zoom-in duration-500">
            <div className="size-24 rounded-full bg-yellow-500/10 flex flex-col items-center justify-center text-yellow-500 mb-2 border border-yellow-500/20">
              <span className="material-symbols-outlined text-5xl">hourglass_empty</span>
            </div>
            <div>
              <h1 className="text-3xl font-black text-text-light-primary dark:text-text-dark-primary mb-4 leading-tight">Solicitação Enviada!</h1>
              <p className="text-text-light-secondary dark:text-text-dark-secondary px-8">
                Sua solicitação de vínculo foi enviada para o personal trainer. Aguarde a aprovação para começar seus treinos.
              </p>
            </div>
            <button 
              onClick={() => setTrainerLinkStatus('linked')} // Mocking approval for demo purposes if clicked, but let's just let it be pending or provide a way out
              className="mt-4 px-6 py-3 rounded-xl border border-border-light dark:border-border-dark hover:bg-card-light dark:hover:bg-card-dark transition-all text-text-light-secondary dark:text-text-dark-secondary font-medium"
            >
              Cancelar solicitação
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  const renderContent = () => {
    if (trainerLinkStatus === 'initial' || trainerLinkStatus === 'search' || trainerLinkStatus === 'pending') {
      return renderLinkageFlow();
    }
    
    if (isTraining && activeTab === 'my-workouts') return renderWorkoutDetails();
    
    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'my-workouts':
        return renderWorkouts();
      case 'messages':
        return renderMessages();
      case 'progress':
        return renderProgress();
      case 'subscription':
        return renderSubscription();
      case 'settings':
        return renderSettings();
      case 'support':
        return <UserSupport user={user} />;
      default:
        return <div className="p-8 text-center text-text-secondary">Página em construção...</div>;
    }
  };

  return (
    <div className="flex h-screen w-full bg-background-light dark:bg-background-dark overflow-hidden transition-colors">
      <Sidebar 
        user={user} 
        onLogout={onLogout} 
        activeTab={activeTab} 
        setActiveTab={handleTabChange} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between px-4 h-16 bg-white dark:bg-card-dark border-b border-border-light dark:border-border-dark shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 text-text-light-primary dark:text-text-dark-primary hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary fill">fitness_center</span>
              <span className="font-black text-xl tracking-tighter text-text-light-primary dark:text-text-dark-primary">StarFit</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 h-full">
          <div className="max-w-7xl mx-auto h-full">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
