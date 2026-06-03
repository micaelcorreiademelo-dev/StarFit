
import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import { User, ChatMessage, Chat } from '../types';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { dataService } from '../services/dataService';
import { chatService } from '../services/chatService';
import { db, auth } from '../services/firebase';
import { updateProfile } from 'firebase/auth';
import { doc, getDoc, query, collection, where, onSnapshot } from 'firebase/firestore';

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

const StudentDashboard: React.FC<StudentDashboardProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [workoutTab, setWorkoutTab] = useState<'upcoming' | 'history'>('upcoming');
  const [isTraining, setIsTraining] = useState(false);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);
  const [completedExercises, setCompletedExercises] = useState<string[]>([]);
  const [selectedSubWorkoutIndex, setSelectedSubWorkoutIndex] = useState(0);
  const [newMessage, setNewMessage] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Trainer Linkage State
  const [trainerLinkStatus, setTrainerLinkStatus] = useState<'initial' | 'search' | 'pending' | 'linked' | 'none'>('initial');
  const effectiveLinkStatus = user.trainerId ? 'linked' : trainerLinkStatus;
  const [searchQuery, setSearchQuery] = useState('');
  const [foundTrainer, setFoundTrainer] = useState<any>(null);
  const [trainer, setTrainer] = useState<any>(null);
  const [trainerPlans, setTrainerPlans] = useState<any[]>([]);

  // Data State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chatInfo, setChatInfo] = useState<Chat | null>(null);
  const [chatContext, setChatContext] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const isSubscriptionExpired = user.subscriptionExpiry && new Date(user.subscriptionExpiry) < new Date();
  const hasActiveTrial = user.trialUntil && new Date() < (user.trialUntil?.toDate ? user.trialUntil.toDate() : new Date(user.trialUntil));
  const isAccessBlocked = user.trainerId && (user.status !== 'Ativa' || isSubscriptionExpired) && !hasActiveTrial;

  // Online Presence
  useEffect(() => {
    if (user?.id) {
       chatService.updatePresence(user.id, true);
       const handleBeforeUnload = () => chatService.updatePresence(user.id, false);
       window.addEventListener('beforeunload', handleBeforeUnload);
       return () => {
         chatService.updatePresence(user.id, false);
         window.removeEventListener('beforeunload', handleBeforeUnload);
       };
    }
  }, [user.id]);
  
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [studentStats, setStudentStats] = useState({
    weightHistory: [] as any[],
    fatHistory: [] as any[],
    lastWeight: 0,
    lastFat: 0,
    history: [] as any[]
  });

  const [showAddProgressModal, setShowAddProgressModal] = useState(false);
  const [addingProgress, setAddingProgress] = useState(false);
  const [compareMetric1, setCompareMetric1] = useState('weight');
  const [compareMetric2, setCompareMetric2] = useState('bodyFat');
  const [progressForm, setProgressForm] = useState({
    date: new Date().toISOString().split('T')[0],
    weight: '',
    bodyFat: '',
    chest: '',
    arms: '',
    waist: '',
    hips: '',
    thighs: '',
    calves: '',
    notes: ''
  });

  // Settings State
  const [profileSettings, setProfileSettings] = useState({
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    birthdate: user.birthdate || '',
  });
  const [savingSettings, setSavingSettings] = useState(false);

  const [notifications, setNotifications] = useState({
    workouts: user.notifications?.workouts ?? true,
    messages: user.notifications?.messages ?? true,
    progress: user.notifications?.progress ?? false
  });
  const [privacy, setPrivacy] = useState({
    publicProfile: user.privacy?.publicProfile ?? false
  });
  const [isConfirmingUnlink, setIsConfirmingUnlink] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    console.log("[DASHBOARD] Renderizando Dashboard do Aluno:", user.id);
    console.log("[FIRESTORE] Iniciando busca de treinos do aluno");

    const unsubWorkouts = dataService.subscribeToStudentWorkouts(user.id, (fetchedWorkouts) => {
      console.log("[FIRESTORE] Treinos recebidos:", fetchedWorkouts.length);
      setWorkouts(fetchedWorkouts);
    });
    
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
          lastFat: last.fat,
          history: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)).sort((a: any, b: any) => {
            const timeA = a.date?.toMillis ? a.date.toMillis() : a.date;
            const timeB = b.date?.toMillis ? b.date.toMillis() : b.date;
            return timeB - timeA; // descending
          })
        });
      } else {
        setStudentStats({
          weightHistory: [],
          fatHistory: [],
          lastWeight: 0,
          lastFat: 0,
          history: []
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
      unsubTrainer = dataService.subscribeToUserById(user.trainerId, (t) => {
        setTrainer(t);
        if (t) {
          dataService.getTrainerPlans(t.id).then(plans => {
            setTrainerPlans(plans);
          });
        }
      });
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

    const setupChat = async () => {
      if (user.trainerId) {
        const chatId = await chatService.getOrCreateChat(user.trainerId, user.id);
        setActiveChatId(chatId);
      }
    };
    setupChat();

    return () => {
      unsubWorkouts();
      unsubProgress();
      unsubTrainer();
      unsubRequests();
    };
  }, [user]);

  useEffect(() => {
    if (!activeChatId || !user.id) return;
    
    const unsubInfo = chatService.subscribeToChatInfo(activeChatId, setChatInfo);

    const unsubMessages = chatService.subscribeToMessages(activeChatId, (msgs) => {
      setMessages(msgs);
      chatService.markAsRead(activeChatId, user.id);
    });

    return () => {
       unsubMessages();
       unsubInfo();
    };
  }, [activeChatId, user.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, chatInfo?.typingState]);

  const handleSearchTrainer = async () => {
    if (!searchQuery.trim()) return;
    try {
      const result = await dataService.searchTrainerByUsername(searchQuery);
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
      await dataService.createLinkRequest({
        studentId: user.id,
        trainerId: foundTrainer.id,
        studentName: user.name,
        studentAvatar: user.avatar,
        status: 'pending',
        goal: 'Emagrecimento', // Default for now
        experience: 'Iniciante'
      });
      setTrainerLinkStatus('pending');
    } catch (error) {
      console.error("Error requesting link:", error);
      alert("Erro ao enviar solicitação.");
    }
  };

  const handleCancelRequest = async () => {
    if (!user) return;
    try {
      await dataService.cancelLinkRequest(user.id);
      setTrainerLinkStatus('none');
      setFoundTrainer(null);
    } catch (error) {
      console.error("Error cancelling request:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeChatId || !user.trainerId) return;
    const text = newMessage;
    const ctx = chatContext;
    setNewMessage('');
    setChatContext(null);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      chatService.setTypingStatus(activeChatId, user.id, false);
    }
    
    await chatService.sendMessage(activeChatId, user.id, user.trainerId, text, ctx);
  };
  
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
       handleSendMessage();
       return;
    }
    
    if (activeChatId && user.id) {
      chatService.setTypingStatus(activeChatId, user.id, true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        chatService.setTypingStatus(activeChatId, user.id, false);
      }, 2000);
    }
  };

  const submitProgress = async () => {
    if (!progressForm.weight) {
      alert("O peso é obrigatório.");
      return;
    }
    setAddingProgress(true);
    try {
      const parts = progressForm.date.split('-');
      const dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      
      await dataService.addProgress({
        studentId: user.id,
        date: dateObj,
        weight: parseFloat(progressForm.weight),
        bodyFat: progressForm.bodyFat ? parseFloat(progressForm.bodyFat) : null,
        chest: progressForm.chest ? parseFloat(progressForm.chest) : null,
        arms: progressForm.arms ? parseFloat(progressForm.arms) : null,
        waist: progressForm.waist ? parseFloat(progressForm.waist) : null,
        hips: progressForm.hips ? parseFloat(progressForm.hips) : null,
        thighs: progressForm.thighs ? parseFloat(progressForm.thighs) : null,
        calves: progressForm.calves ? parseFloat(progressForm.calves) : null,
        notes: progressForm.notes
      });
      setShowAddProgressModal(false);
      setProgressForm({
        date: new Date().toISOString().split('T')[0],
        weight: '',
        bodyFat: '',
        chest: '',
        arms: '',
        waist: '',
        hips: '',
        thighs: '',
        calves: '',
        notes: ''
      });
    } catch (e) {
      console.error(e);
      alert("Erro ao salvar medidas.");
    } finally {
      setAddingProgress(false);
    }
  };

  const todayWorkout = workouts.length > 0 ? workouts[0] : null;

  const workoutExercises: ExerciseDetail[] = todayWorkout?.exercises?.map((ex: any, idx: number) => ({
    id: ex.id || `ex-${idx}`,
    name: ex.name,
    sets: ex.sets,
    reps: ex.reps,
    rest: ex.rest || '60s',
    notes: ex.notes || '',
    completed: completedExercises.includes(ex.id || `ex-${idx}`)
  })) || [];

  const toggleExercise = (id: string) => {
    setCompletedExercises(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const renderDashboard = () => {
    if (isAccessBlocked) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-card-light dark:bg-card-dark rounded-2xl border border-border-light dark:border-border-dark shadow-xl max-w-2xl mx-auto mt-10">
          <div className="bg-red-500/10 p-6 rounded-full mb-6">
            <span className="material-symbols-outlined text-red-500 text-6xl">payments</span>
          </div>
          <h2 className="text-3xl font-black text-text-light-primary dark:text-text-dark-primary mb-4">Acesso Bloqueado</h2>
          <p className="text-text-light-secondary dark:text-text-dark-secondary text-lg mb-8 max-w-md">
            Sua assinatura expirou ou o pagamento ainda não foi confirmado. Por favor, realize o pagamento para continuar acessando seus treinos e falando com seu personal.
          </p>
          <button 
            onClick={() => setActiveTab('subscription')}
            className="bg-primary text-background-dark font-bold py-4 px-8 rounded-xl hover:brightness-110 transition-all shadow-lg shadow-primary/30"
          >
            Ver Planos Disponíveis
          </button>
        </div>
      );
    }

    if (effectiveLinkStatus !== 'linked') {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-card-light dark:bg-card-dark rounded-2xl border border-border-light dark:border-border-dark shadow-xl max-w-2xl mx-auto mt-10">
          <div className="bg-primary/10 p-6 rounded-full mb-6">
            <span className="material-symbols-outlined text-primary text-6xl">person_search</span>
          </div>
          <h2 className="text-3xl font-black text-text-light-primary dark:text-text-dark-primary mb-4">Bem-vindo ao FitLife!</h2>
          <p className="text-text-light-secondary dark:text-text-dark-secondary text-lg mb-8 max-w-md">
            Para começar sua jornada, você precisa vincular sua conta ao seu Personal Trainer. Informe o nome de usuário dele.
          </p>
          
          {effectiveLinkStatus === 'pending' ? (
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
                  placeholder="Ex: @alexlima ou alexlima"
                  className="w-full bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-xl py-4 px-6 text-text-light-primary dark:text-text-dark-primary focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-mono tracking-widest uppercase"
                />
                <button 
                  onClick={handleSearchTrainer}
                  className="absolute right-2 top-2 bottom-2 bg-primary text-background-dark font-bold px-6 rounded-lg hover:brightness-110 transition-all"
                >
                  Buscar
                </button>
              </div>

              {effectiveLinkStatus === 'search' && foundTrainer && (
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

    return (
      <div className="pb-20">
        <div className="flex flex-wrap justify-between gap-3 mb-6">
          <div className="flex min-w-72 flex-col gap-2">
            <h1 className="text-text-light-primary dark:text-text-dark-primary text-4xl font-black leading-tight tracking-[-0.033em]">
              Olá, {(user.name || 'Aluno').split(' ')[0]}!
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
              {workouts.filter(w => w.completed).length > 0 ? (
                workouts.filter(w => w.completed).slice(0, 3).map((w, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/20 p-2 rounded-full">
                        <span className="material-symbols-outlined text-primary">fitness_center</span>
                      </div>
                      <div>
                        <p className="text-text-light-primary dark:text-text-dark-primary font-medium text-sm">{w.title}</p>
                        <p className="text-text-light-secondary dark:text-text-dark-secondary text-xs">Concluído</p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-green-500 fill">check_circle</span>
                  </div>
                ))
              ) : (
                <p className="text-text-light-secondary dark:text-text-dark-secondary text-sm italic py-4">Nenhum treino concluído recentemente.</p>
              )}
            </div>
          </div>

          {user.trainerId && (
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
              value={newMessage || ''}
              onChange={(e) => setNewMessage(e.target.value)}
            ></textarea>
              <button 
                onClick={() => {
                  if (newMessage.trim()) {
                    handleSendMessage();
                  }
                  setActiveTab('chat');
                }}
                className="w-full mt-4 flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-background-dark text-sm font-bold leading-normal shadow-lg shadow-primary/30 hover:brightness-110 transition-all"
              >
                <span className="truncate">Enviar Mensagem</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

  const renderWorkouts = () => {
    if (isAccessBlocked) {
      return (
        <div className="max-w-4xl mx-auto flex flex-col items-center justify-center p-12 bg-card-light dark:bg-card-dark rounded-2xl border border-dashed border-border-light dark:border-border-dark text-center">
          <div className="size-20 bg-amber-500/10 rounded-full flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-4xl text-amber-500">lock_clock</span>
          </div>
          <h2 className="text-2xl font-black text-text-light-primary dark:text-text-dark-primary mb-4 uppercase italic">Prazo de Acesso Expirado</h2>
          <p className="text-text-light-secondary dark:text-text-dark-secondary max-w-md mb-8 leading-relaxed">
            Seu prazo de 24 horas para adquirir um plano expirou. Adquira um plano com seu personal para continuar acessando seus treinos e suporte.
          </p>
          <button 
            onClick={() => setActiveTab('subscription')}
            className="px-8 h-12 bg-primary text-background-dark rounded-xl text-sm font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
          >
            Ver Planos Disponíveis
          </button>
        </div>
      );
    }

    const filteredWorkouts = workouts.filter((workout) => {
      const isSelfFinalized = workout.studentStatuses?.[user.id] === "Finalizado";
      
      let isExpired = false;
      if (workout.periodization?.type === "data") {
        const limitDate = new Date(workout.periodization.value);
        limitDate.setHours(23, 59, 59, 999);
        isExpired = new Date() > limitDate;
      } else if (workout.periodization?.type === "sessoes") {
        const sessionsDone = workout.completedSessionsCount?.[user.id] || 0;
        const sessionsTotal = parseInt(workout.periodization.value, 10) || 0;
        isExpired = sessionsTotal > 0 && sessionsDone >= sessionsTotal;
      }

      const isCompletedGlobally = workout.completed === true;
      const isHistory = isSelfFinalized || isExpired || isCompletedGlobally;

      return workoutTab === 'upcoming' ? !isHistory : isHistory;
    });

    return (
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
        {filteredWorkouts.map((workout, idx) => {
          const isSelfFinalized = workout.studentStatuses?.[user.id] === "Finalizado";
          let isExpired = false;
          let isDatePeriodization = workout.periodization?.type === "data";
          let isSessionsPeriodization = workout.periodization?.type === "sessoes";
          let sessionsDone = workout.completedSessionsCount?.[user.id] || 0;
          let sessionsTotal = 0;

          if (isDatePeriodization) {
            const limitDate = new Date(workout.periodization.value);
            limitDate.setHours(23, 59, 59, 999);
            isExpired = new Date() > limitDate;
          } else if (isSessionsPeriodization) {
            sessionsTotal = parseInt(workout.periodization.value, 10) || 0;
            isExpired = sessionsTotal > 0 && sessionsDone >= sessionsTotal;
          }

          const isHistorical = isSelfFinalized || isExpired || workout.completed === true;

          return (
            <div key={workout.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark shadow-sm gap-4 transition-all hover:bg-white/[0.01]">
              <div className="flex items-start sm:items-center gap-4 min-w-0 w-full sm:w-auto">
                <div className={`p-3 rounded-xl hidden sm:flex items-center justify-center shrink-0 ${isHistorical ? 'bg-zinc-500/10 text-zinc-400' : 'bg-primary/10 text-primary'}`}>
                  <span className="material-symbols-outlined text-2xl">fitness_center</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-text-light-primary dark:text-text-dark-primary font-bold text-lg truncate flex items-center gap-2">
                    {workout.title || workout.name}
                    {workout.isModelLinked && (
                      <span className="inline-flex size-2 rounded-full bg-primary" title="Ficha Modelo"></span>
                    )}
                  </h3>
                  <p className="text-text-light-secondary dark:text-text-dark-secondary text-xs mt-0.5">
                    Atribuído em {workout.createdAt?.toDate ? workout.createdAt.toDate().toLocaleDateString("pt-BR") : workout.createdAt ? new Date(workout.createdAt).toLocaleDateString("pt-BR") : 'Recentemente'}
                  </p>
                  
                  {/* Periodization Details */}
                  <div className="flex flex-wrap gap-2 mt-2.5">
                    {workout.periodization?.type && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-lg border font-black uppercase tracking-wider flex items-center gap-1 shrink-0 ${
                        isExpired
                          ? "bg-red-500/10 text-red-500 border-red-500/20"
                          : "bg-blue-500/10 text-blue-500 border-blue-500/20 dark:text-blue-400"
                      }`}>
                        <span className="material-symbols-outlined text-[12px]">
                          {workout.periodization.type === "data" ? "date_range" : "calendar_today"}
                        </span>
                        {workout.periodization.type === "data" 
                          ? `Prazo: ${new Date(workout.periodization.value).toLocaleDateString("pt-BR")}`
                          : `Ciclo: ${sessionsDone} / ${sessionsTotal} Treinos Realizados`
                        }
                      </span>
                    )}
                    {isSelfFinalized && (
                      <span className="text-[10px] bg-zinc-500/10 text-zinc-400 border border-zinc-500/20 px-2 py-0.5 rounded-lg font-black uppercase tracking-wider">
                        Finalizado Manualmente
                      </span>
                    )}
                    {isExpired && !isSelfFinalized && (
                      <span className="text-[10px] bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-0.5 rounded-lg font-black uppercase tracking-wider">
                        Expirado
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => {
                  setSelectedWorkoutId(workout.id);
                  setSelectedSubWorkoutIndex(0);
                  setIsTraining(true);
                }}
                className="w-full sm:w-auto flex min-w-[130px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-11 px-6 bg-primary text-background-dark text-sm font-black uppercase tracking-wider shadow-lg shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all"
              >
                {isHistorical ? "Ver Ficha" : "Iniciar Treino"}
              </button>
            </div>
          );
        })}

        {filteredWorkouts.length === 0 && (
          <div className="text-center py-20 bg-card-light dark:bg-card-dark rounded-xl border border-dashed border-border-light dark:border-border-dark opacity-60">
            <span className="material-symbols-outlined text-6xl mb-4 text-text-secondary select-none">fitness_center</span>
            <p className="text-lg font-bold text-text-light-primary dark:text-text-dark-primary">
              {workoutTab === 'upcoming' 
                ? "Nenhum treino prescrito ou disponível." 
                : "Seu histórico de treinos concluídos está vazio."
              }
            </p>
            <p className="text-text-light-secondary dark:text-text-dark-secondary text-sm mt-1">
              {workoutTab === 'upcoming' 
                ? "Seu personal trainer disponibilizará seus treinos aqui." 
                : "Quando você finalizar seus ciclos de treino, eles virão para cá."
              }
            </p>
          </div>
        )}
      </div>
    </div>
    );
  };

  const handleTabChange = (tab: string) => {
    if (tab === activeTab && activeTab === 'my-workouts') {
      setIsTraining(false);
    }
    setActiveTab(tab);
  };

  const renderWorkoutDetails = () => {
    const activeWorkout = workouts.find(w => w.id === selectedWorkoutId) || workouts.find(w => !w.completed) || workouts[0];
    if (!activeWorkout) return <div className="p-8 text-center text-text-secondary">Nenhum treino disponível.</div>;

    const currentSubWorkout = activeWorkout.subWorkouts && activeWorkout.subWorkouts.length > 0
      ? activeWorkout.subWorkouts[selectedSubWorkoutIndex]
      : null;

    const displayExercises = currentSubWorkout
      ? (currentSubWorkout.exercises || [])
      : (activeWorkout.exercises || []);

    const isSelfFinalized = activeWorkout.studentStatuses?.[user.id] === 'Finalizado';
    let isExpired = false;
    let sessionsDone = activeWorkout.completedSessionsCount?.[user.id] || 0;
    let sessionsTotal = 0;

    if (activeWorkout.periodization?.type === 'data') {
      const limitDate = new Date(activeWorkout.periodization.value);
      limitDate.setHours(23, 59, 59, 999);
      isExpired = new Date() > limitDate;
    } else if (activeWorkout.periodization?.type === 'sessoes') {
      sessionsTotal = parseInt(activeWorkout.periodization.value, 10) || 0;
      isExpired = sessionsTotal > 0 && sessionsDone >= sessionsTotal;
    }
    const isFinished = isSelfFinalized || isExpired || activeWorkout.completed === true;

    return (
      <div className="max-w-7xl mx-auto pb-20 animate-in fade-in duration-300">
        {/* Title & Back nav Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-text-light-primary dark:text-text-dark-primary text-4xl font-black leading-tight tracking-[-0.033em] flex flex-wrap items-center gap-2.5">
              {activeWorkout.title || activeWorkout.name}
              {activeWorkout.periodization?.type && (
                <span className={`text-xs px-2.5 py-1 rounded-full border font-black uppercase tracking-wider inline-flex items-center gap-1 shrink-0 ${
                  isExpired
                    ? "bg-red-500/10 text-red-500 border-red-500/20"
                    : "bg-blue-500/10 text-blue-500 border-blue-500/20 dark:text-blue-400"
                }`}>
                  <span className="material-symbols-outlined text-sm">
                    {activeWorkout.periodization.type === "data" ? "date_range" : "calendar_today"}
                  </span>
                  {activeWorkout.periodization.type === "data"
                    ? `Prazo: ${new Date(activeWorkout.periodization.value).toLocaleDateString("pt-BR")}`
                    : `Sessões: ${sessionsDone} / ${sessionsTotal}`
                  }
                </span>
              )}
            </h1>
            <p className="text-text-light-secondary dark:text-text-dark-secondary text-sm font-medium">
              Siga os parâmetros prescritos pelo seu personal trainer abaixo.
            </p>
          </div>
          <button 
            onClick={() => {
              setIsTraining(false);
              setCompletedExercises([]);
            }}
            className="flex self-start md:self-center items-center gap-2 px-4 py-2 rounded-xl bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark text-text-light-secondary dark:text-text-dark-secondary hover:text-primary transition-colors font-bold text-sm"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            Voltar
          </button>
        </div>

        {/* Dynamic subworkouts tabs (Treino A, Treino B, etc.) */}
        {activeWorkout.subWorkouts && activeWorkout.subWorkouts.length > 0 && (
          <div className="flex flex-wrap gap-2.5 mb-8 bg-card-light dark:bg-card-dark p-2 rounded-2xl border border-border-light dark:border-border-dark shadow-inner">
            {activeWorkout.subWorkouts.map((sw: any, idx: number) => (
              <button
                key={sw.id || idx}
                onClick={() => {
                  setSelectedSubWorkoutIndex(idx);
                  setCompletedExercises([]);
                }}
                className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl text-center font-black text-sm transition-all focus:outline-none ${
                  selectedSubWorkoutIndex === idx
                    ? "bg-primary text-background-dark shadow-lg shadow-primary/20 scale-[1.01]"
                    : "text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary hover:bg-background-light dark:hover:bg-background-dark"
                }`}
              >
                {sw.name}
              </button>
            ))}
          </div>
        )}

        {/* Exercises Loop */}
        <div className="space-y-6">
          {displayExercises.map((ex: any, index: number) => {
            const isFullExCompleted = completedExercises.includes(`full-${index}`);
            return (
              <div 
                key={index} 
                className={`bg-card-light dark:bg-card-dark rounded-2xl border border-border-light dark:border-border-dark shadow-sm p-6 flex flex-col gap-4 transition-all duration-200 ${isFullExCompleted ? 'opacity-55' : ''}`}
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="min-w-0">
                    {ex.isSpecial && (
                      <span className="inline-flex px-2 py-0.5 rounded-md text-[9px] font-black tracking-widest uppercase bg-primary/20 text-primary mb-2 border border-primary/20 animate-pulse">Série Especial</span>
                    )}
                    <h2 className="text-xl font-black tracking-tight text-text-light-primary dark:text-text-dark-primary truncate">{ex.name}</h2>
                    <p className="text-text-light-secondary dark:text-text-dark-secondary text-[11px] font-bold uppercase tracking-wider mt-1">{ex.category || "GERAL"} • Exercício {index + 1} de {displayExercises.length}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                    <button
                      onClick={() => {
                        const id = `full-${index}`;
                        setCompletedExercises(prev => 
                          prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
                        );
                      }}
                      className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4.5 py-2.5 rounded-xl transition-all text-sm font-black ${
                        isFullExCompleted
                          ? 'bg-primary/20 text-primary border border-transparent' 
                          : 'border border-primary text-primary hover:bg-primary/10'
                      }`}
                    >
                      <span className={`material-symbols-outlined ${isFullExCompleted ? 'fill' : ''}`}>
                        {isFullExCompleted ? 'check_circle' : 'check'}
                      </span>
                      {isFullExCompleted ? 'Concluído' : 'Concluir'}
                    </button>
                    <button
                      onClick={() => {
                        setChatContext({ type: 'exercise', id: index.toString(), name: ex.name });
                        setActiveTab('chat');
                      }}
                      className="size-11 flex items-center justify-center border border-border-light dark:border-border-dark text-text-light-secondary dark:text-text-dark-secondary rounded-xl hover:text-primary hover:border-primary transition-colors hover:bg-white/5"
                      title="Tirar Dúvida com o Personal"
                    >
                      <span className="material-symbols-outlined text-lg">chat</span>
                    </button>
                  </div>
                </div>

                {/* Highly structured detailed series vs fallback */}
                {ex.series && ex.series.length > 0 ? (
                  <div className="border border-border-light dark:border-border-dark rounded-xl overflow-hidden bg-background-light/30 dark:bg-background-dark/30 font-sans">
                    <div className="grid grid-cols-4 gap-2 bg-background-light dark:bg-background-dark p-3 text-[10px] font-black uppercase text-text-light-secondary dark:text-text-dark-secondary border-b border-border-light dark:border-border-dark text-center tracking-wider">
                      <span>Série</span>
                      <span>Objetivo ({ex.seriesForm === "Minuto" ? "Tempo" : "Reps"})</span>
                      <span>Carga ({ex.loadConfig || "Kg"})</span>
                      <span>Marcar</span>
                    </div>
                    <div className="divide-y divide-border-light dark:divide-border-dark">
                      {ex.series.map((s: any, sIdx: number) => {
                        const keyId = `set-${index}-${sIdx}`;
                        const isSetCompleted = completedExercises.includes(keyId);
                        return (
                          <div 
                            key={s.id || sIdx} 
                            className={`grid grid-cols-4 gap-2 p-3 text-sm items-center text-center transition-all ${isSetCompleted ? 'bg-primary/5 line-through opacity-55' : ''}`}
                          >
                            <span className="font-extrabold text-text-light-primary dark:text-text-dark-primary text-xs">A{sIdx + 1}</span>
                            <span className="font-bold text-text-light-secondary dark:text-text-dark-secondary">{s.reps || "10"} {ex.seriesForm === "Minuto" ? "min" : ex.seriesForm === "Segundo" ? "seg" : "reps"}</span>
                            <span className="font-black text-primary font-mono text-xs">{s.weight ? `${s.weight} ${ex.loadConfig || "Kg"}` : "Peso Corporal"}</span>
                            <div className="flex items-center justify-center">
                              <button
                                onClick={() => {
                                  setCompletedExercises(prev => 
                                    prev.includes(keyId) ? prev.filter(item => item !== keyId) : [...prev, keyId]
                                  );
                                }}
                                className={`size-6 rounded-md flex items-center justify-center transition-all border ${
                                  isSetCompleted 
                                    ? 'bg-primary border-primary text-background-dark' 
                                    : 'border-border-light dark:border-border-dark hover:border-primary text-text-light-secondary dark:text-text-dark-secondary hover:bg-white/5'
                                }`}
                              >
                                <span className="material-symbols-outlined text-[14px] font-black">{isSetCompleted ? 'check' : ''}</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-background-light dark:bg-background-dark p-3 rounded-xl border border-border-light dark:border-border-dark">
                      <p className="text-[10px] uppercase font-bold text-text-light-secondary dark:text-text-dark-secondary mb-1">Séries</p>
                      <p className="text-xl font-black text-primary">{ex.sets || "3"}</p>
                    </div>
                    <div className="bg-background-light dark:bg-background-dark p-3 rounded-xl border border-border-light dark:border-border-dark">
                      <p className="text-[10px] uppercase font-bold text-text-light-secondary dark:text-text-dark-secondary mb-1">Reps</p>
                      <p className="text-xl font-black text-primary">{ex.reps || "10"}</p>
                    </div>
                    <div className="bg-background-light dark:bg-background-dark p-3 rounded-xl border border-border-light dark:border-border-dark">
                      <p className="text-[10px] uppercase font-bold text-text-light-secondary dark:text-text-dark-secondary mb-1">Pausa</p>
                      <p className="text-xl font-black text-primary">{ex.rest || "60"}s</p>
                    </div>
                  </div>
                )}

                {/* Rest / Pausa live and video demonstrative watch link if registered */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-3.5 border-t border-dashed border-border-light dark:border-border-dark">
                  <div className="flex items-center gap-1.5 text-[11px] text-text-light-secondary dark:text-text-dark-secondary font-extrabold uppercase tracking-wider">
                    <span className="material-symbols-outlined text-[17px] text-primary">timer</span>
                    <span>Descanso Recomendado: {ex.rest >= 60 ? `${Math.floor(ex.rest / 60)}m ${ex.rest % 60}s` : `${ex.rest}s`}</span>
                  </div>
                  
                  {ex.videoUrl && (
                    <a 
                      href={ex.videoUrl} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="flex items-center gap-1.5 text-xs text-secondary hover:underline font-black uppercase tracking-wider"
                    >
                      <span className="material-symbols-outlined text-[17px]">play_circle</span>
                      <span>Assistir Vídeo de Execução</span>
                    </a>
                  )}
                </div>

                {ex.notes && (
                  <div className="bg-background-light/40 dark:bg-background-dark/40 border border-border-light dark:border-border-dark p-4 rounded-xl">
                    <p className="text-xs font-black uppercase tracking-widest text-text-light-primary dark:text-text-dark-primary mb-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-primary">tips_and_updates</span>
                      Instruções Técnicas:
                    </p>
                    <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary leading-relaxed whitespace-pre-line">{ex.notes}</p>
                  </div>
                )}
              </div>
            );
          })}

          {displayExercises.length === 0 && (
            <div className="py-16 text-center bg-card-light dark:bg-card-dark rounded-2xl border border-border-light dark:border-border-dark">
              <span className="material-symbols-outlined text-5xl text-text-secondary mb-3 font-light animate-bounce">fitness_center</span>
              <p className="text-text-light-secondary dark:text-text-dark-secondary font-bold text-lg">Nenhum exercício cadastrado no {currentSubWorkout?.name || "Treino"}.</p>
              <p className="text-text-light-secondary dark:text-text-dark-secondary text-xs mt-1">Fale com seu personal trainer para prescrever exercícios a você.</p>
            </div>
          )}
        </div>

        {/* Finish workout button */}
        <div className="mt-12 flex flex-col items-center gap-4">
           <button 
            disabled={isFinished}
            onClick={async () => {
              if (activeWorkout.id) {
                await dataService.completeWorkout(user.id, activeWorkout.id);
                setIsTraining(false);
                setCompletedExercises([]);
              }
            }}
            className="w-full max-w-sm h-14 bg-primary text-background-dark font-black text-lg rounded-2xl shadow-xl shadow-primary/30 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {isFinished ? 'Treino / Ciclo Concluído' : 'Finalizar Sessão de Treino'}
          </button>
        </div>
      </div>
    );
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return '';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const renderChat = () => {
    if (isAccessBlocked) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-12 bg-card-light dark:bg-card-dark rounded-2xl border border-dashed border-border-light dark:border-border-dark text-center h-full">
          <div className="size-16 bg-amber-500/10 rounded-full flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-3xl text-amber-500">chat_error</span>
          </div>
          <h2 className="text-xl font-black text-text-light-primary dark:text-text-dark-primary mb-2 uppercase">Chat Bloqueado</h2>
          <p className="text-text-light-secondary dark:text-text-dark-secondary text-sm max-w-sm mb-6">
            O acesso ao chat foi suspenso devido à expiração do prazo de 24h. Regularize seu plano para voltar a falar com seu personal.
          </p>
          <button 
            onClick={() => setActiveTab('subscription')}
            className="px-6 py-3 bg-primary text-background-dark rounded-xl text-sm font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
          >
            Ver Planos Disponíveis
          </button>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full w-full bg-background-light dark:bg-[#121212] overflow-hidden relative">
        <header className="flex flex-col gap-1 px-4 py-3 border-b border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark shrink-0 z-20 shadow-sm w-full">
          <div className="flex items-center gap-3 overflow-hidden max-w-4xl mx-auto w-full">
            <div className="relative shrink-0">
              <div 
                className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-10 w-10 border border-border-light dark:border-border-dark" 
                style={{ backgroundImage: `url(${trainer?.avatar || 'https://images.unsplash.com/photo-1594381898411-846e7d193883?q=80&w=1974&auto=format&fit=crop'})` }}
              ></div>
              <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-card-light dark:ring-card-dark"></span>
            </div>
            <div className="flex flex-col min-w-0">
              <h2 className="text-text-light-primary dark:text-white text-base font-bold truncate leading-tight">{trainer?.name || 'Seu Personal'}</h2>
              <p className="text-text-light-secondary dark:text-text-dark-secondary text-[11px] leading-tight font-medium uppercase truncate tracking-wide mt-0.5">@{trainer?.trainerCode || 'TRAINER'}</p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 w-full custom-scrollbar relative" ref={scrollRef}>
          <div className="flex flex-col gap-4 max-w-4xl mx-auto min-h-full pb-4">
            {messages.length > 0 ? (
              messages.map((msg) => {
                const isMe = msg.senderId === user.id;
                return (
                  <div 
                    key={msg.id} 
                    className={`flex flex-col w-full max-w-[85%] md:max-w-[70%] lg:max-w-[65%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}
                  >
                    {msg.context?.type === 'exercise' && (
                       <div className={`text-[10px] uppercase font-bold px-3 py-1.5 rounded-t-lg mb-0.5 border ${
                         isMe ? 'bg-primary/20 text-primary border-primary/30 ml-auto' : 'bg-card-light dark:bg-card-dark text-text-light-secondary dark:text-text-dark-secondary border-border-light dark:border-border-dark mr-auto'
                       }`}>
                          Dúvida: {msg.context.name}
                       </div>
                    )}
                    <div className={`relative px-4 py-2.5 rounded-2xl text-[15px] leading-relaxed shadow-sm break-words flex flex-col w-full ${
                      isMe 
                        ? 'bg-primary text-background-dark rounded-br-sm' 
                        : 'bg-white dark:bg-card-dark text-text-light-primary dark:text-white rounded-bl-sm border border-border-light/50 dark:border-border-dark'
                    }`}>
                      <span className="whitespace-pre-wrap">{msg.text}</span>
                      
                      <div className={`flex items-center justify-end gap-1 mt-1 shrink-0 ${isMe ? 'text-background-dark/70' : 'text-text-light-secondary dark:text-text-dark-secondary'}`}>
                        <span className="text-[10px] right-0 translate-y-0.5 leading-none">
                          {formatTimestamp(msg.timestamp)}
                        </span>
                        {isMe && (
                           <span className="material-symbols-outlined text-[14px] leading-none">
                             {msg.readAt ? 'done_all' : 'check'}
                           </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center opacity-50 m-auto mt-20 gap-3">
                 <span className="material-symbols-outlined text-[48px] text-text-light-secondary dark:text-text-dark-secondary">forum</span>
                 <p className="text-text-light-primary dark:text-white text-sm font-medium bg-card-light dark:bg-card-dark px-4 py-2 rounded-full border border-border-light dark:border-border-dark">Nenhuma mensagem ainda. Envie a primeira mensagem.</p>
              </div>
            )}
            
            {chatInfo?.typingState?.[trainer?.id || ''] && (
               <div className="flex self-start max-w-[85%]">
                 <div className="px-4 py-3 bg-white dark:bg-card-dark rounded-2xl rounded-bl-sm border border-border-light/50 dark:border-border-dark flex items-center gap-1.5 opacity-80 shadow-sm">
                   <span className="w-1.5 h-1.5 bg-text-light-secondary dark:bg-text-dark-secondary rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
                   <span className="w-1.5 h-1.5 bg-text-light-secondary dark:bg-text-dark-secondary rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                   <span className="w-1.5 h-1.5 bg-text-light-secondary dark:bg-text-dark-secondary rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
                 </div>
               </div>
            )}
            
            <div className="h-1 w-full shrink-0" />
          </div>
        </div>

        <footer className="shrink-0 bg-background-light dark:bg-card-dark px-4 py-3 sm:px-6 w-full border-t border-border-light dark:border-border-dark z-20">
          <div className="max-w-4xl mx-auto w-full flex flex-col">
            {chatContext && (
               <div className="flex justify-between items-center bg-card-light dark:bg-background-dark px-3 py-2 rounded-xl mb-3 border border-border-light/50 dark:border-border-dark/50 text-xs">
                 <span className="text-text-light-secondary dark:text-text-dark-secondary flex items-center gap-2">
                   <span className="material-symbols-outlined text-[14px]">info</span>
                   Contexto da mensagem: <strong className="text-primary">{chatContext.name}</strong>
                 </span>
                 <button onClick={() => setChatContext(null)} className="text-text-light-secondary dark:text-text-dark-secondary hover:text-red-500 transition-colors">
                   <span className="material-symbols-outlined text-[16px]">close</span>
                 </button>
               </div>
            )}
            <div className="flex items-end gap-2 sm:gap-3 w-full">
              <button className="flex items-center justify-center size-12 shrink-0 rounded-full hover:bg-white/50 dark:hover:bg-white/5 text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-white transition-colors" title="Anexar arquivo">
                <span className="material-symbols-outlined text-2xl">attach_file</span>
              </button>
              <div className="flex-1 bg-white dark:bg-background-dark border border-border-light dark:border-border-dark rounded-3xl min-h-[48px] max-h-[140px] flex items-center focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/30 transition-all shadow-inner overflow-hidden">
                <textarea 
                  className="w-full bg-transparent border-none focus:ring-0 text-text-light-primary dark:text-white placeholder:text-text-light-secondary/70 dark:placeholder:text-text-dark-secondary/70 resize-none px-5 py-3 max-h-[140px] text-[15px] leading-relaxed custom-scrollbar outline-none" 
                  placeholder="Digite uma mensagem..." 
                  rows={1}
                  value={newMessage || ''}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
                  }}
                  onKeyDown={(e) => {
                     if (e.key === 'Enter' && !e.shiftKey) {
                       e.preventDefault();
                       handleSendMessage();
                       e.currentTarget.style.height = 'auto';
                     } else {
                       handleInputKeyDown(e as any);
                     }
                  }}
                />
              </div>
              <button 
                onClick={() => {
                   handleSendMessage();
                   const ta = document.querySelector('textarea');
                   if(ta) ta.style.height = 'auto';
                }}
                disabled={!newMessage.trim()}
                className="flex items-center justify-center size-12 shrink-0 rounded-full bg-primary text-background-dark shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:shadow-none transition-all"
              >
                <span className="material-symbols-outlined fill text-xl ml-0.5">send</span>
              </button>
            </div>
          </div>
        </footer>
      </div>
    );
  };

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
          <button 
            onClick={() => {
              setShowAddProgressModal(true);
            }}
            className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 gap-2 bg-primary text-background-dark text-sm font-bold leading-normal shadow-lg shadow-primary/30 hover:brightness-110 transition-all"
          >
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
                <p className="text-text-light-primary dark:text-text-dark-primary tracking-light text-2xl font-bold leading-tight truncate">{studentStats.lastWeight ? `${studentStats.lastWeight} kg` : '--'}</p>
                {studentStats.weightHistory.length > 1 && (
                  <p className={`${(studentStats.weightHistory[studentStats.weightHistory.length - 1].value - studentStats.weightHistory[0].value) <= 0 ? 'text-green-500' : 'text-red-500'} text-sm font-medium leading-normal flex items-center gap-1`}>
                    <span className="material-symbols-outlined text-base">{(studentStats.weightHistory[studentStats.weightHistory.length - 1].value - studentStats.weightHistory[0].value) <= 0 ? 'arrow_downward' : 'arrow_upward'}</span>
                    {Math.abs(studentStats.weightHistory[studentStats.weightHistory.length - 1].value - studentStats.weightHistory[0].value).toFixed(1)}kg
                  </p>
                )}
              </div>
            </div>
            <div className="h-64 w-full">
              {studentStats.weightHistory.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={studentStats.weightHistory}>
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
              ) : (
                <div className="h-full flex items-center justify-center text-text-light-secondary opacity-50 italic">
                  Sem dados históricos suficientes.
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-xl border border-border-light dark:border-border-dark p-6 bg-card-light dark:bg-card-dark shadow-[0_0_12px_rgba(0,0,0,0.05)]">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-text-light-primary dark:text-text-dark-primary text-lg font-bold leading-tight tracking-[-0.015em]">Gordura Corporal (%)</p>
                <p className="text-text-light-secondary dark:text-text-dark-secondary text-sm">Percentual de gordura</p>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-text-light-primary dark:text-text-dark-primary tracking-light text-2xl font-bold leading-tight truncate">{studentStats.lastFat ? `${studentStats.lastFat} %` : '--'}</p>
                 {studentStats.fatHistory.length > 1 && (
                  <p className={`${(studentStats.fatHistory[studentStats.fatHistory.length - 1].value - studentStats.fatHistory[0].value) <= 0 ? 'text-green-500' : 'text-red-500'} text-sm font-medium leading-normal flex items-center gap-1`}>
                    <span className="material-symbols-outlined text-base">{(studentStats.fatHistory[studentStats.fatHistory.length - 1].value - studentStats.fatHistory[0].value) <= 0 ? 'arrow_downward' : 'arrow_upward'}</span>
                    {Math.abs(studentStats.fatHistory[studentStats.fatHistory.length - 1].value - studentStats.fatHistory[0].value).toFixed(1)}%
                  </p>
                )}
              </div>
            </div>
            <div className="h-64 w-full">
              {studentStats.fatHistory.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={studentStats.fatHistory}>
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
              ) : (
                <div className="h-full flex items-center justify-center text-text-light-secondary opacity-50 italic">
                  Sem dados históricos suficientes.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-card-light dark:bg-card-dark rounded-xl p-6 shadow-[0_0_12_rgba(0,0,0,0.05)] border border-border-light dark:border-border-dark overflow-hidden">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-text-light-primary dark:text-text-dark-primary text-xl font-bold leading-tight tracking-[-0.015em]">Medidas Corporais e Bioimpedância</h2>
          </div>
          {studentStats.history.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="border-b border-border-light dark:border-border-dark text-text-light-secondary dark:text-text-dark-secondary text-sm">
                    <th className="py-2 px-4">Data</th>
                    <th className="py-2 px-4">Peso</th>
                    <th className="py-2 px-4">% Gordura</th>
                    <th className="py-2 px-4">Peito (cm)</th>
                    <th className="py-2 px-4">Braços (cm)</th>
                    <th className="py-2 px-4">Cintura (cm)</th>
                    <th className="py-2 px-4">Quadril (cm)</th>
                    <th className="py-2 px-4">Coxas (cm)</th>
                    <th className="py-2 px-4">Panturrilhas (cm)</th>
                  </tr>
                </thead>
                <tbody>
                  {studentStats.history.map((record: any, idx: number) => (
                    <tr key={record.id || idx} className="border-b border-border-light/50 dark:border-border-dark/50 text-text-light-primary dark:text-text-dark-primary text-sm hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 font-bold">{record.date?.toDate ? record.date.toDate().toLocaleDateString('pt-BR') : new Date(record.date).toLocaleDateString('pt-BR')}</td>
                      <td className="py-3 px-4 font-bold text-primary">{record.weight ? `${record.weight}kg` : '-'}</td>
                      <td className="py-3 px-4">{record.bodyFat ? `${record.bodyFat}%` : '-'}</td>
                      <td className="py-3 px-4">{record.chest || '-'}</td>
                      <td className="py-3 px-4">{record.arms || '-'}</td>
                      <td className="py-3 px-4">{record.waist || '-'}</td>
                      <td className="py-3 px-4">{record.hips || '-'}</td>
                      <td className="py-3 px-4">{record.thighs || '-'}</td>
                      <td className="py-3 px-4">{record.calves || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-text-light-secondary dark:text-text-dark-secondary italic text-sm py-4 text-center">
              Nenhuma medida registrada. Adicione sua primeira medida!
            </p>
          )}
        </div>

        <div className="bg-card-light dark:bg-card-dark rounded-xl p-6 shadow-[0_0_12px_rgba(0,0,0,0.05)] border border-border-light dark:border-border-dark">
          <h2 className="text-text-light-primary dark:text-text-dark-primary text-xl font-bold leading-tight tracking-[-0.015em] mb-4">Comparativo de Métricas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-text-light-secondary dark:text-text-dark-secondary text-sm">Métrica 1</label>
              <select 
                value={compareMetric1}
                onChange={e => setCompareMetric1(e.target.value)}
                className="rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-light-primary dark:text-text-dark-primary text-sm focus:ring-primary focus:border-primary p-2 cursor-pointer"
              >
                <option value="weight">Peso Corporal (kg)</option>
                <option value="bodyFat">Gordura Corporal (%)</option>
                <option value="chest">Peito (cm)</option>
                <option value="arms">Braços (cm)</option>
                <option value="waist">Cintura (cm)</option>
                <option value="hips">Quadril (cm)</option>
                <option value="thighs">Coxas (cm)</option>
                <option value="calves">Panturrilhas (cm)</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-text-light-secondary dark:text-text-dark-secondary text-sm">Métrica 2</label>
              <select 
                value={compareMetric2}
                onChange={e => setCompareMetric2(e.target.value)}
                className="rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-light-primary dark:text-text-dark-primary text-sm focus:ring-primary focus:border-primary p-2 cursor-pointer"
              >
                <option value="none">Nenhuma</option>
                <option value="weight">Peso Corporal (kg)</option>
                <option value="bodyFat">Gordura Corporal (%)</option>
                <option value="chest">Peito (cm)</option>
                <option value="arms">Braços (cm)</option>
                <option value="waist">Cintura (cm)</option>
                <option value="hips">Quadril (cm)</option>
                <option value="thighs">Coxas (cm)</option>
                <option value="calves">Panturrilhas (cm)</option>
              </select>
            </div>
          </div>
          <div className="mt-6 h-72 w-full flex items-center justify-center">
            {studentStats.history && studentStats.history.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[...studentStats.history].reverse()}>
                  <defs>
                    <linearGradient id="colorM1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#13ec5b" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#13ec5b" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorM2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="date" tickFormatter={(v) => { try { return new Date(v?.toDate ? v.toDate() : v).toLocaleDateString('pt-BR'); }catch{return ''}}} stroke="#888" tickMargin={10} minTickGap={30}/>
                  <YAxis yAxisId="left" stroke="#13ec5b" width={40} />
                  {compareMetric2 !== 'none' && <YAxis yAxisId="right" orientation="right" stroke="#8b5cf6" width={40} />}
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1a2c20', border: 'none', borderRadius: '8px', color: '#fff' }}
                    labelFormatter={(v) => { try { return new Date(v?.toDate ? v.toDate() : v).toLocaleDateString('pt-BR'); }catch{return ''}}}
                  />
                  <Area yAxisId="left" type="monotone" dataKey={compareMetric1} stroke="#13ec5b" strokeWidth={3} fillOpacity={1} fill="url(#colorM1)" activeDot={{ r: 6 }} />
                  {compareMetric2 !== 'none' && <Area yAxisId="right" type="monotone" dataKey={compareMetric2} stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorM2)" activeDot={{ r: 6 }} />}
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex items-center justify-center text-text-light-secondary opacity-50 italic border border-dashed border-border-light dark:border-border-dark rounded-xl">
               Gráficos comparativos estarão disponíveis com pelo menos duas medidas registradas.
              </div>
            )}
          </div>
        </div>
      </div>

      {showAddProgressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between p-4 border-b border-border-light dark:border-border-dark">
              <h3 className="text-text-light-primary dark:text-text-dark-primary font-bold tracking-tight">Adicionar Medida</h3>
              <button 
                onClick={() => setShowAddProgressModal(false)}
                className="text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary transition-colors"
                disabled={addingProgress}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-bold text-text-light-secondary dark:text-text-dark-secondary uppercase tracking-widest mb-1 block">
                    Data da Medição
                  </label>
                  <input 
                    type="date"
                    value={progressForm.date}
                    onChange={e => setProgressForm({...progressForm, date: e.target.value})}
                    className="w-full bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-xl px-4 py-2 text-text-light-primary dark:text-text-dark-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-text-light-secondary dark:text-text-dark-secondary uppercase tracking-widest mb-1 block">
                    Peso (kg) *
                  </label>
                  <input 
                    type="number"
                    step="0.1"
                    value={progressForm.weight}
                    onChange={e => setProgressForm({...progressForm, weight: e.target.value})}
                    placeholder="Ex: 75.5"
                    className="w-full bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-xl px-4 py-2 text-text-light-primary dark:text-text-dark-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-text-light-secondary dark:text-text-dark-secondary uppercase tracking-widest mb-1 block">
                    % Gordura
                  </label>
                  <input 
                    type="number"
                    step="0.1"
                    value={progressForm.bodyFat}
                    onChange={e => setProgressForm({...progressForm, bodyFat: e.target.value})}
                    placeholder="Ex: 15.2"
                    className="w-full bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-xl px-4 py-2 text-text-light-primary dark:text-text-dark-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-text-light-secondary dark:text-text-dark-secondary uppercase tracking-widest mb-1 block">
                    Peito (cm)
                  </label>
                  <input 
                    type="number"
                    step="0.1"
                    value={progressForm.chest}
                    onChange={e => setProgressForm({...progressForm, chest: e.target.value})}
                    className="w-full bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-xl px-4 py-2 text-text-light-primary dark:text-text-dark-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-text-light-secondary dark:text-text-dark-secondary uppercase tracking-widest mb-1 block">
                    Braços (cm)
                  </label>
                  <input 
                    type="number"
                    step="0.1"
                    value={progressForm.arms}
                    onChange={e => setProgressForm({...progressForm, arms: e.target.value})}
                    className="w-full bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-xl px-4 py-2 text-text-light-primary dark:text-text-dark-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-text-light-secondary dark:text-text-dark-secondary uppercase tracking-widest mb-1 block">
                    Cintura (cm)
                  </label>
                  <input 
                    type="number"
                    step="0.1"
                    value={progressForm.waist}
                    onChange={e => setProgressForm({...progressForm, waist: e.target.value})}
                    className="w-full bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-xl px-4 py-2 text-text-light-primary dark:text-text-dark-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-text-light-secondary dark:text-text-dark-secondary uppercase tracking-widest mb-1 block">
                    Quadril (cm)
                  </label>
                  <input 
                    type="number"
                    step="0.1"
                    value={progressForm.hips}
                    onChange={e => setProgressForm({...progressForm, hips: e.target.value})}
                    className="w-full bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-xl px-4 py-2 text-text-light-primary dark:text-text-dark-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-text-light-secondary dark:text-text-dark-secondary uppercase tracking-widest mb-1 block">
                    Coxas (cm)
                  </label>
                  <input 
                    type="number"
                    step="0.1"
                    value={progressForm.thighs}
                    onChange={e => setProgressForm({...progressForm, thighs: e.target.value})}
                    className="w-full bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-xl px-4 py-2 text-text-light-primary dark:text-text-dark-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-text-light-secondary dark:text-text-dark-secondary uppercase tracking-widest mb-1 block">
                    Panturrilhas (cm)
                  </label>
                  <input 
                    type="number"
                    step="0.1"
                    value={progressForm.calves}
                    onChange={e => setProgressForm({...progressForm, calves: e.target.value})}
                    className="w-full bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-xl px-4 py-2 text-text-light-primary dark:text-text-dark-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowAddProgressModal(false)}
                  disabled={addingProgress}
                  className="px-4 py-2 rounded-lg font-bold text-text-light-secondary dark:text-text-dark-secondary border border-border-light dark:border-border-dark hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={submitProgress}
                  disabled={addingProgress || !progressForm.weight}
                  className="px-6 py-2 bg-primary text-background-dark rounded-lg font-bold hover:brightness-110 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  {addingProgress ? (
                    <span className="material-symbols-outlined animate-spin">refresh</span>
                  ) : (
                    <span className="material-symbols-outlined">save</span>
                  )}
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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

      <section className="bg-card-dark rounded-2xl p-1 shadow-lg ring-1 ring-white/5 relative overflow-hidden group border border-border-dark">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all duration-700"></div>
        <div className="bg-[#152a1d] rounded-xl p-6 md:p-8 flex flex-col md:flex-row gap-8 relative z-10">
          <div className="flex-1 flex flex-col justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-1 rounded">Plano Ativo</span>
                {user.paymentStatus === 'paid' && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Ativo
                  </span>
                )}
              </div>
              <h2 className="text-3xl font-bold text-white mb-1 uppercase">{user.plan || 'Aguardando Atribuição'}</h2>
              <p className="text-text-secondary font-medium">Expira em: <span className="text-white">{user.subscriptionExpiry ? new Date(user.subscriptionExpiry).toLocaleDateString() : 'A definir'}</span></p>
            </div>
            <div className="flex items-center gap-4 text-sm text-white/80">
              <div className="flex items-center gap-2 bg-black/20 px-3 py-2 rounded-lg border border-white/5">
                <span className="material-symbols-outlined text-primary text-[20px]">payments</span>
                <span>Pagamento: <span className={user.paymentStatus === 'paid' ? 'text-primary font-bold' : 'text-yellow-500 font-bold'}>{user.paymentStatus === 'paid' ? 'Confirmado' : 'Pendente'}</span></span>
              </div>
            </div>
          </div>
          <div className="w-full md:w-auto md:min-w-[280px] flex flex-col gap-3 justify-center border-t md:border-t-0 md:border-l border-white/10 pt-6 md:pt-0 md:pl-8">
            <div className="flex flex-col gap-1 mb-2">
              <span className="text-text-secondary text-sm">Próximo Vencimento</span>
              <span className="text-2xl font-bold text-white">{user.subscriptionExpiry ? new Date(user.subscriptionExpiry).toLocaleDateString() : '--'}</span>
            </div>
            <button 
              onClick={() => {
                if (trainer) {
                  navigate(`/@${trainer.username?.replace('@', '') || trainer.trainerCode || ''}#planos`);
                } else {
                  alert("Vincule um Personal Trainer primeiro para ver os planos disponíveis.");
                }
              }}
              className="w-full bg-primary hover:bg-primary/90 text-background-dark font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
            >
              <span className="material-symbols-outlined text-[20px] fill">refresh</span>
              Pagar Mensalidade
            </button>
          </div>
        </div>
      </section>

      {trainerPlans.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-white">Planos do seu Personal</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trainerPlans.filter(p => !p.hiddenGlobal).map((plan) => (
              <div 
                key={plan.id}
                className={`bg-card-dark rounded-2xl p-6 border transition-all flex flex-col ${plan.isPopular ? 'border-primary shadow-lg shadow-primary/5' : 'border-border-dark'}`}
              >
                {plan.isPopular && (
                  <span className="bg-primary text-background-dark text-[10px] font-black px-2 py-1 rounded w-fit mb-4 uppercase tracking-wider">Mais Popular</span>
                )}
                <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                <div className="my-4">
                  <span className="text-3xl font-black text-white">{plan.price}</span>
                  <span className="text-text-secondary text-sm"> / {plan.durationDays} dias</span>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f: string, i: number) => (
                    <li key={i} className="flex items-center gap-2 text-text-secondary text-sm">
                      <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <button 
                  onClick={() => {
                     navigate(`/@${trainer.username?.replace('@', '') || trainer.trainerCode || ''}?plan=${encodeURIComponent(plan.name)}#planos`);
                  }}
                  className={`w-full py-3 rounded-xl font-bold transition-all ${plan.isPopular ? 'bg-primary text-background-dark shadow-lg shadow-primary/20' : 'bg-white/5 text-white border border-white/10 hover:bg-white/10'}`}
                >
                  Escolher Plano
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Section: Help */}
      <section className="bg-card-dark rounded-2xl p-8 border border-border-dark flex flex-col items-center text-center gap-4">
          <div className="bg-primary/10 p-4 rounded-full">
            <span className="material-symbols-outlined text-primary text-3xl">help_outline</span>
          </div>
          <h3 className="text-white text-xl font-bold">Dúvida sobre sua assinatura?</h3>
          <p className="text-text-secondary max-w-md">Para questões sobre pagamentos, renovações ou mudança de plano, entre em contato diretamente com seu personal trainer via chat.</p>
          <button 
            onClick={() => setActiveTab('chat')}
            className="text-primary font-bold hover:underline"
          >
            Falar com meu Personal
          </button>
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
                  value={profileSettings.name || ''}
                  onChange={(e) => setProfileSettings({ ...profileSettings, name: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">E-mail</label>
                <input 
                  className="block w-full rounded-lg bg-background-light dark:bg-background-dark border-border-light dark:border-border-dark text-text-light-primary dark:text-text-dark-primary focus:ring-primary focus:border-primary px-4 py-2 disabled:opacity-50" 
                  type="email" 
                  value={profileSettings.email || ''}
                  disabled
                  onChange={(e) => setProfileSettings({ ...profileSettings, email: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">Telefone</label>
                <input 
                  className="block w-full rounded-lg bg-background-light dark:bg-background-dark border-border-light dark:border-border-dark text-text-light-primary dark:text-text-dark-primary focus:ring-primary focus:border-primary px-4 py-2" 
                  type="tel" 
                  placeholder="(11) 98765-4321" 
                  value={profileSettings.phone || ''}
                  onChange={(e) => setProfileSettings({ ...profileSettings, phone: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">Data de Nascimento</label>
                <input 
                  className="block w-full rounded-lg bg-background-light dark:bg-background-dark border-border-light dark:border-border-dark text-text-light-primary dark:text-text-dark-primary focus:ring-primary focus:border-primary px-4 py-2" 
                  type="date" 
                  value={profileSettings.birthdate || ''}
                  onChange={(e) => setProfileSettings({ ...profileSettings, birthdate: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 bg-background-light/50 dark:bg-background-dark/50 flex justify-end rounded-b-xl border-t border-border-light dark:border-border-dark">
          <button 
            disabled={savingSettings}
            onClick={async () => {
               setSavingSettings(true);
               try {
                 await dataService.updateUser(user.id, {
                   name: profileSettings.name,
                   phone: profileSettings.phone,
                   birthdate: profileSettings.birthdate,
                 });
                 if (auth.currentUser) {
                   await updateProfile(auth.currentUser, { displayName: profileSettings.name });
                 }
                 alert("Informações salvas com sucesso!");
               } catch (e) {
                 console.error("Error saving settings", e);
                 alert("Erro ao salvar as informações.");
               } finally {
                 setSavingSettings(false);
               }
            }}
            className="bg-primary text-background-dark font-bold h-10 px-6 rounded-lg shadow-lg shadow-primary/30 hover:brightness-110 transition-all text-sm disabled:opacity-50"
          >
            {savingSettings ? 'Salvando...' : 'Salvar Alterações'}
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
              onClick={async () => {
                const newVal = !notifications.workouts;
                setNotifications({...notifications, workouts: newVal});
                await dataService.updateUser(user.id, { 'notifications.workouts': newVal });
              }}
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
              onClick={async () => {
                const newVal = !notifications.messages;
                setNotifications({...notifications, messages: newVal});
                await dataService.updateUser(user.id, { 'notifications.messages': newVal });
              }}
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
              onClick={async () => {
                const newVal = !notifications.progress;
                setNotifications({...notifications, progress: newVal});
                await dataService.updateUser(user.id, { 'notifications.progress': newVal });
              }}
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
              onClick={async () => {
                const newVal = !privacy.publicProfile;
                setPrivacy({publicProfile: newVal});
                await dataService.updateUser(user.id, { 'privacy.publicProfile': newVal });
              }}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${privacy.publicProfile ? 'bg-primary' : 'bg-border-light dark:bg-border-dark'}`}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${privacy.publicProfile ? 'translate-x-5' : 'translate-x-0'}`}></span>
            </button>
          </div>
        </div>
      </div>

      {/* Personal Trainer Setting */}
      {user.trainerId && (
        <div className="bg-card-light dark:bg-card-dark rounded-xl shadow-[0_0_12px_rgba(0,0,0,0.05)] border border-border-light dark:border-border-dark">
          <div className="p-6 border-b border-border-light dark:border-border-dark">
            <h2 className="text-text-light-primary dark:text-text-dark-primary text-xl font-bold leading-tight tracking-[-0.015em]">Personal Trainer</h2>
            <p className="text-text-light-secondary dark:text-text-dark-secondary text-sm mt-1">Gerencie seu vínculo com o personal trainer.</p>
          </div>
          <div className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 w-full md:w-auto">
              {trainer ? (
                <>
                  <img src={trainer.avatar || 'https://images.unsplash.com/photo-1594381898411-846e7d193883?q=80&w=1974&auto=format&fit=crop'} alt="Treinador" className="size-16 rounded-full border-2 border-primary/20 object-cover" />
                  <div>
                    <h3 className="font-bold text-text-light-primary dark:text-text-dark-primary text-lg">{trainer.name}</h3>
                    <p className="text-text-light-secondary dark:text-text-dark-secondary text-sm">@{trainer.trainerCode || 'sem_codigo'}</p>
                    <span className="inline-flex items-center px-2 py-0.5 mt-1 rounded text-[10px] font-black uppercase tracking-wider bg-primary/10 text-primary">Vínculo Ativo</span>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-4 animate-pulse">
                  <div className="size-16 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                </div>
              )}
            </div>
            {!isConfirmingUnlink ? (
              <button 
                onClick={() => setIsConfirmingUnlink(true)}
                className="w-full md:w-auto px-6 py-2 rounded-lg border border-red-500/50 text-red-500 font-bold hover:bg-red-500/10 transition-all text-sm whitespace-nowrap"
              >
                Remover Vínculo
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-sm text-text-light-secondary dark:text-text-dark-secondary font-medium">Tem certeza?</span>
                <button 
                  onClick={async () => {
                    console.log("Unlinking confirmed for user:", user.id);
                    try {
                      await dataService.updateUser(user.id, { trainerId: null });
                      setTrainer(null);
                      setTrainerLinkStatus('search');
                      setActiveTab('dashboard');
                      setIsConfirmingUnlink(false);
                      console.log("Unlink successful");
                    } catch(e) {
                      console.error("Error unlinking trainer", e);
                      alert("Erro ao remover vínculo. Tente novamente.");
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-bold hover:brightness-110 transition-all"
                >
                  Confirmar
                </button>
                <button 
                  onClick={() => setIsConfirmingUnlink(false)}
                  className="px-4 py-2 rounded-lg bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark text-text-light-primary dark:text-text-dark-primary text-sm font-medium hover:brightness-110 transition-all"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Danger Zone */}
      <div className="bg-red-500/5 dark:bg-red-500/10 rounded-xl shadow-[0_0_12px_rgba(0,0,0,0.05)] border border-red-500/20">
        <div className="p-6 border-b border-red-500/20">
          <h2 className="text-red-600 dark:text-red-400 text-xl font-bold leading-tight tracking-[-0.015em]">Zona de Perigo</h2>
          <p className="text-red-500/80 text-sm mt-1">Ações irreversíveis para sua conta.</p>
        </div>
        <div className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-bold text-text-light-primary dark:text-text-dark-primary">Excluir Conta</h3>
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mt-1 max-w-md">Ao excluir sua conta, você perderá acesso ao aplicativo e todo o seu histórico de treinos será apagado. Esta ação não pode ser desfeita.</p>
          </div>
          <button 
            onClick={async () => {
              if (confirm("Você tem A ABSOLUTA CERTEZA que deseja excluir sua conta permanentemente? Esta ação é irreversível.")) {
                try {
                  await dataService.deleteUser(user.id);
                  onLogout();
                } catch(e) {
                  console.error("Error deleting account", e);
                  alert("Erro ao excluir conta.");
                }
              }
            }}
            className="px-6 py-3 rounded-xl bg-red-500 text-white font-bold hover:brightness-110 shadow-lg shadow-red-500/20 transition-all shrink-0"
          >
            Excluir Conta
          </button>
        </div>
      </div>
    </div>
  );

  const renderLinkageFlow = () => {
    switch (effectiveLinkStatus) {
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
                value={searchQuery || ''}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchTrainer()}
                placeholder="Digitar código ou username (ex: @treinador)" 
                className="w-full bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-xl py-4 pl-12 pr-4 text-text-light-primary dark:text-text-dark-primary placeholder-text-light-secondary focus:ring-2 focus:ring-primary focus:border-primary transition-all font-medium"
              />
              <button 
                onClick={handleSearchTrainer}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary text-background-dark px-4 py-2 rounded-lg font-bold hover:brightness-110 transition-all text-sm"
              >
                Buscar
              </button>
            </div>

            {foundTrainer && (
              <div className="bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-2xl p-6 flex flex-col items-center text-center gap-4 animate-in zoom-in-95 duration-300">
                <img src={foundTrainer.avatar || 'https://images.unsplash.com/photo-1594381898411-846e7d193883?q=80&w=1974&auto=format&fit=crop'} alt="Trainer" className="size-24 rounded-full border-4 border-primary/20 shadow-lg object-cover" />
                <div>
                  <h2 className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">{foundTrainer.name}</h2>
                  <p className="text-primary font-semibold text-sm mb-2">{foundTrainer.specialty || 'Personal Trainer'}</p>
                  <p className="text-text-light-secondary dark:text-text-dark-secondary text-sm px-4">{foundTrainer.desc || 'Sem biografia disponível.'}</p>
                </div>
                <button 
                  onClick={handleRequestLink}
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
              onClick={async () => {
                await dataService.cancelLinkRequest(user.id);
                setTrainerLinkStatus('initial');
              }}
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
    // Allow settings and subscription even if blocked
    const isPublicTab = activeTab === 'settings' || activeTab === 'subscription';

    if (isAccessBlocked && !isPublicTab) {
      if (activeTab === 'my-workouts') return renderWorkouts();
      if (activeTab === 'chat') return renderChat();
      return renderDashboard(); // renderDashboard already handles blocked UI
    }

    if (effectiveLinkStatus === 'initial' || effectiveLinkStatus === 'search' || effectiveLinkStatus === 'pending') {
      return renderLinkageFlow();
    }
    
    if (isTraining && activeTab === 'my-workouts') return renderWorkoutDetails();
    
    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'my-workouts':
        return renderWorkouts();
      case 'chat':
        return renderChat();
      case 'progress':
        return renderProgress();
      case 'subscription':
        return renderSubscription();
      case 'settings':
        return renderSettings();
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
          <div className="flex items-center gap-2">
            <button
                className="p-2 text-text-light-primary dark:text-text-dark-primary hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
                title="Notificações"
            >
                <span className="material-symbols-outlined">notifications</span>
            </button>
            <button
                className="p-2 text-text-light-primary dark:text-text-dark-primary hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
                title="Chat"
                onClick={() => setActiveTab('chat')}
            >
                <span className="material-symbols-outlined">chat</span>
            </button>
          </div>
        </header>

        <div className={`flex-1 overflow-hidden flex flex-col h-full ${activeTab === 'chat' ? 'p-0 pb-[84px] md:pb-0' : 'overflow-y-auto p-4 md:p-8 pb-[calc(8rem+env(safe-area-inset-bottom))] md:pb-8'}`}>
          <div className={`${activeTab === 'chat' ? 'w-full h-full' : 'max-w-7xl mx-auto h-full'}`}>
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
