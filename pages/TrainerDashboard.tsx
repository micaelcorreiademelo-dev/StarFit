import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../components/Sidebar";
import { User } from "../types";
import { motion, AnimatePresence } from "motion/react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import TrainerChat from "./TrainerChat";
import TrainerLandingPage from "./TrainerLandingPage";
import TrainerSettings from "./TrainerSettings";
import TrainerPlans from "./TrainerPlans";
import UserSupport from "../components/UserSupport";
import { startOfMonth, endOfMonth, eachDayOfInterval, format, startOfWeek, endOfWeek, isSameMonth, isSameDay, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, startOfDay, isToday, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { dataService } from "../services/dataService";
import { trainerService } from "../services/trainerService";
import { chatService } from "../services/chatService";
import { db } from "../services/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { QRCodeSVG } from 'qrcode.react';

interface TrainerDashboardProps {
  user: User;
  onLogout: () => void;
}

interface AgendaEvent {
  id: string;
  title: string;
  type: string;
  date: Date;
  time: string;
  status: "Concluído" | "Cancelado" | "Agendado";
  color: string;
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
  difficulty: "Iniciante" | "Intermediário" | "Avançado";
  imageUrl: string;
}

const GROWTH_DATA = [
  { month: "Jan", value: 30 },
  { month: "Fev", value: 35 },
  { month: "Mar", value: 32 },
  { month: "Abr", value: 38 },
  { month: "Mai", value: 42 },
  { month: "Jun", value: 40 },
];

const LIBRARY_EXERCISES: LibraryExercise[] = [
  {
    id: "1",
    name: "Supino Reto com Barra",
    category: "Peito",
    difficulty: "Avançado",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAEuvqhS1E53noe84Ef3h3Vr-vZkFCgGr7pmcVmawNqmcnoVHJglkIWOkH_vaYHVJkyi8y3v89nTTQWeOB9FV134NXHlTkeKUBnkLm3L1Pi8Xo5s-8LSW1gdT8SF4uVfC6Ok9DFnlFYol0qprahGqy_JBM9QgT0HmgF3z3inkS3L8ur6OtxBrNc3VX2fW-BgY9UkDdzC0_6uVnZZkNwvV9Pt5DoobE4uPQB8NrO38hwxKGjOPnPfYY8mb_lL9-xWr8CyHsaaUVDbvc",
  },
  {
    id: "2",
    name: "Agachamento Livre",
    category: "Pernas",
    difficulty: "Avançado",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAUOIw88-8-gpilKFj0k_wUq90Wu4fBC93PIEdGXumJNTHE6kjVi1UUR929T0ob5dbnxLR7kbpr8hLXm0MpqNgzewg1anLOMj06V4Y9z4Llh8EcYXrz0BP3XTuJ9_l0F9dNMHiuSDH7L5_WVxZNkV9qvo-Wl_N2VhDfMTt1ODZ0f7kkNRediJfVjGWZ12p0pCOGbz66542BAmafChpYJKRfcAd_sJETRjUuQymDFiR61PPq8UjZdjoGqHbId8qn2xauQdIjnJi4VBk",
  },
  {
    id: "3",
    name: "Remada Curvada",
    category: "Costas",
    difficulty: "Intermediário",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDo2jRkTkjObRspOxbdyZHz_B8XCpr4dqtSTZrCGpwNVTNlQWOq-VQX3ECpyqxrzEZII217dq7voJSdw_DbCzV4vriHBOBa689qN3Y7gTC5aTd0theL7XlxZCjqXbqh_tkNctms7AaOJgQV1-zDudOIz0WaM7tyu2bt3tbFDNkQeBsrkZrLp5lhssvmLSQ0vr-Bq2dtmj1IqCsXL3gcg8pBPVDxue-tQKV_6BjOz067eTJKSkWXMHyphD4BxtmZWKo2eeOu6KT_J7c",
  },
  {
    id: "4",
    name: "Levantamento Terra",
    category: "Costas",
    difficulty: "Avançado",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDuvcVEIfJ8aBCmTuaqJUajtHQ7SE1QSV6DI65P-STsg71qFSpH5g9wN8f0Z1rAWDCnm0SX3cXgTPKP_K8BOFCzUPqKczml85p0gSiqiIb9Qjr2vUlRAw6zPDat5SMkwnqVqMAbEVAjA7GbY5CMp18_h4VJsYbhz9tNu4gm6oGjO9rPY21poazH2bTwauVw1q2tRRaiY0OmnIsVZvzy5MikL6WjWVgLnumXREpUZtbM89Szj0LKV20W_afilr2nRPlWBDs7RIX203E",
  },
  {
    id: "5",
    name: "Desenvolvimento de Ombros",
    category: "Ombros",
    difficulty: "Intermediário",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBCFqIbf4khIg7jNUk16gFD_oZ3_OFM4_AsTorw33XGe3_YdGIR6Hzvc53C9KHMx8pQJDbuaIJ0XGdyJsTUz-wKedlLh5PgSfJxk3m-BVv44Fi-Te-AYi906FtDrYBVbWgMRUCU7WcVhScK6xpCf0I3bRMY6GYBhGrR6Gk4qqlZwINbTbHLpfnoDqo6jcpcbdMaXQ2To1NxLXIY1PJ22QEpmIb4B8InfJS2ogGi-EZ_rsPMrmrYpkpGlqbYHXd0xLioUm7MkdRYhsE",
  },
  {
    id: "6",
    name: "Flexão de Braço",
    category: "Peito",
    difficulty: "Iniciante",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBBh3JRSHlzm1k6N7DPwxS4sk7ZSIwpa34rO9x7f2MK9pZoU846mdhOLSBpkFm48XDMO2st6KOxx1eknXMGyqv0Hqzw_WdWD8l3uv0zVPVyMEayvzgc7wY7Tnkn3cKald2nq7sMsD4P3_HRsMwXRqg6_cDzFgqMCaoav8NC23n2BHUP-Bzygh3VMpuyjyZg9VPBB3gzDGYD33r62PkjVwHkJRhj_SVW-sn__hvtsvQKKbS2ldeuDZ8RMp8zd2w01acbOAGdMGtA_jE",
  },
  {
    id: "7",
    name: "Puxada Alta",
    category: "Costas",
    difficulty: "Iniciante",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDmDcPghcMo4tfxbig5ATIDXz6RFyz1gMHuzOlLMSzK10iSK3mCkria9XzVLXywKYqWWPXB1bfEzPoQGJFDi8nyqbIkrj8nzJIn4mrqM_4EmreqiQabHeHaaHxhbKZU_zoLq_NDYube9KLsYtTOUHmSAQkQT4aG_Oh4TyD-iuaIw7XxYboBGZE3h4T9qII0r5pdtdrFOVwSI4n3JeWiDpgjFP4CB6v1j8_LRwnphkd_2-qY7w07d8x_uoMsu8AyByY2B3hF4hauKHs",
  },
  {
    id: "8",
    name: "Afundo com Halteres",
    category: "Pernas",
    difficulty: "Intermediário",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDLzIWmq8uV6tUMRkkeAibsmdToX7ifa8Zm2tCPMJ4c5plqpvSKn2aeAOGlsWRyIxPhU_oHAkWE7aaBN112kRC2yYL6iufIrYAr80QlKA7MuqIwhIZY1qQPxIi8MIlgjfGuwouQ4j90T-SYobfbI1IDR2_8SaTCHJxWnf9auyjC3vgBnWCKZEasjfvW1KaRrlXQksgxK72IzCpEnOL9x4tVoizqpg4VugA90ssqYA2s_OdlFGey-RxWUdx_QDN2Nwy9lepuVqS7YJc",
  },
  {
    id: "9",
    name: "Rosca Direta",
    category: "Bíceps",
    difficulty: "Iniciante",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBI8cesI2BXLe0HtcSl-uyY0xGqtHAxjrbBGmAjaHlYgnyvEWwtFlH6YnQxkadPCtdi2wL5D8LAmuWvLiaW3e9PYAlzKimp64AiA_g49WupR6ZY1Q6kyGqg-ULhnxeIqSpMVuEH0QQSNQgeG5lVkR9nKMN3og3m_5c0rlhUoWU3AeAFOdDSLP4LDki9q4C_UhfJpJ6NWdLrMnYmudcg6DfCh_fARYK28uH_2_Ktdo6E-lvu0tlShfuSX3ukYoh5WTFTF62lWNt_d4E",
  },
  {
    id: "10",
    name: "Tríceps na Polia",
    category: "Tríceps",
    difficulty: "Iniciante",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCWiaN4zGH9R50V5BeVxo4uS5Udkw35uuIFo9NMFEDep9bqkx-8YvzBewMSRvHFvTG1rMYi6c26ttZP_owcUAKtwVA-UCfgJ-k2bv0xIb58fczXQiyX4KDFlaYJgs1f36AuqczXhX8CoMM38dTXKNyDsBOfwPAQKx-I9hyvcSJQwVeTfklPc3odmMJYZ4cBRgCL_MYiggQgHh9jPvqPdIZ44mMRYvas-U9YdeYbQS_0pJcvMOQAV3OwbfI3LQubQxeU0IDiw04xXB8",
  },
];

const TrainerDashboard: React.FC<TrainerDashboardProps> = ({
  user,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [studentToUnlink, setStudentToUnlink] = useState<{id: string, name: string} | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todas");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [unreadAnnouncements, setUnreadAnnouncements] = useState(0);
  const [showAnnouncements, setShowAnnouncements] = useState(false);

  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAnnouncements(data);
      
      const lastSeen = localStorage.getItem('last_seen_announcement');
      const unread = lastSeen 
        ? data.filter(a => a.createdAt?.seconds > (parseInt(lastSeen) || 0))
        : data;

      setUnreadAnnouncements(unread.length);

      // Simulate push if unread count increased and notification allowed
      if (unread.length > 0 && !snapshot.metadata.fromCache) {
         if (Notification.permission === 'granted') {
           new Notification("Novo Comunicado StarFit", {
              body: unread[0].title,
           });
         }
      }
    });

    return () => unsub();
  }, []);

  const markAnnouncementsRead = () => {
    if (announcements.length > 0) {
      const latest = announcements[0].createdAt?.seconds || Math.floor(Date.now() / 1000);
      localStorage.setItem('last_seen_announcement', latest.toString());
      setUnreadAnnouncements(0);
    }
    setShowAnnouncements(true);
  };
  const [agendaView, setAgendaView] = useState<"Mês" | "Semana" | "Dia">("Semana");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<AgendaEvent | null>(null);
  const [linkingWorkoutStudent, setLinkingWorkoutStudent] = useState<any>(null);
  const [selectedWorkoutToLink, setSelectedWorkoutToLink] = useState<string>("");

  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [linkRequests, setLinkRequests] = useState<any[]>([]);
  const [showRequestToast, setShowRequestToast] = useState(false);
  const prevRequestsCountRef = useRef(0);
  const [studentsData, setStudentsData] = useState<any[]>([]);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [libraryExercises, setLibraryExercises] = useState<any[]>([]);
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
  const [editingEx, setEditingEx] = useState<any>(null);
  const [platformPlans, setPlatformPlans] = useState<any[]>([]);
  const [trainerCustomPlans, setTrainerCustomPlans] = useState<any[]>([]);
  const [latestChat, setLatestChat] = useState<any>(null);

  useEffect(() => {
    if (!user) return;

    const username = (user.username || user.id).replace('@', '');
    trainerService.getTrainerData(username).then(data => {
      setTrainerCustomPlans(data.plans || []);
    });

    const unsubEvents = dataService.subscribeToAgenda(user.id, setEvents);
    const unsubRequests = dataService.subscribeToLinkRequests(user.id, (requests) => {
      console.log(`Trainer ${user.id} has ${requests.length} pending requests`);
      setLinkRequests(requests);
      
      if (requests.length > prevRequestsCountRef.current) {
        setShowRequestToast(true);
        // Play a sound or trigger haptic if possible (browser dependent)
        try {
          if (Notification.permission === 'granted') {
            new Notification("Nova Solicitação no StarFit", {
              body: `Você recebeu uma nova solicitação de vínculo de aluno.`,
              icon: "/favicon.ico",
              tag: "new-link-request"
            });
          }
        } catch (e) {
          console.warn("Notification error:", e);
        }
      }
      prevRequestsCountRef.current = requests.length;
    });
    const unsubStudents = dataService.subscribeToStudents(user.id, setStudentsData);
    const unsubWorkouts = dataService.subscribeToWorkouts(user.id, setWorkouts);
    const unsubExercises = dataService.subscribeToExercises(user.id, setLibraryExercises);
    const unsubPlatformPlans = dataService.subscribeToPlatformPlans(setPlatformPlans);
    
    // Subscribe to latest chat
    const unsubChats = chatService.subscribeToTrainerChats(user.id, (chats) => {
      if (chats.length > 0) {
        setLatestChat(chats[0]);
      }
    });

    return () => {
      unsubEvents();
      unsubRequests();
      unsubStudents();
      unsubWorkouts();
      unsubExercises();
      unsubPlatformPlans();
      unsubChats();
    };
  }, [user]);

  const getStudentName = (studentId: string) => {
    const student = studentsData.find(s => s.id === studentId);
    return student?.name || 'Aluno';
  };

  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedStudentProgress, setSelectedStudentProgress] = useState<any[]>([]);

  useEffect(() => {
    if (selectedStudentId) {
      const unsub = dataService.subscribeToStudentProgress(selectedStudentId, (progress) => {
        // Sort descending
        const sorted = progress.sort((a,b) => {
           const timeA = a.date?.toMillis ? a.date.toMillis() : new Date(a.date).getTime();
           const timeB = b.date?.toMillis ? b.date.toMillis() : new Date(b.date).getTime();
           return timeB - timeA;
        });
        setSelectedStudentProgress(sorted);
      });
      return () => unsub();
    } else {
      setSelectedStudentProgress([]);
    }
  }, [selectedStudentId]);

  const handleApproveRequest = async (requestId: string, trainerId: string, studentId: string) => {
    try {
      await dataService.approveLinkRequest(requestId, trainerId, studentId);
      // Create chat immediately after approval
      await chatService.getOrCreateChat(trainerId, studentId);
      alert("Solicitação aprovada com sucesso! O aluno já está vinculado e o chat foi criado.");
    } catch (error) {
      console.error("Error approving request:", error);
      alert("Erro ao aprovar solicitação.");
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await dataService.rejectLinkRequest(requestId);
    } catch (error) {
      console.error("Error rejecting request:", error);
    }
  };

  // Manage students in state to allow editable fields
  const handleUpdateStudentExpDate = async (id: string, newDate: string) => {
    try {
      await dataService.updateUser(id, { 
        expDate: newDate, 
        subscriptionExpiry: newDate,
        status: 'Ativa' 
      });
    } catch (error) {
      console.error("Error updating student exp date:", error);
    }
  };

  const handleExtendTrial = async (studentId: string) => {
    try {
      await dataService.extendTrial(studentId);
      alert("Acesso prorrogado por mais 24 horas!");
    } catch (error) {
      console.error("Error extending trial:", error);
      alert("Erro ao prorrogado acesso.");
    }
  };

  const handleUpdateStudentPlan = async (id: string, newPlanName: string) => {
    try {
      await dataService.updateUser(id, { 
        plan: newPlanName,
        status: 'Ativa'
      });
    } catch (error) {
      console.error("Error updating student plan:", error);
    }
  };

  const handleDeleteStudent = async (id: string) => {
    try {
      await dataService.updateUser(id, { trainerId: null });
      setStudentToUnlink(null);
    } catch (error) {
      console.error("Error removing student:", error);
    }
  };

  const handleSelectPlan = async (planName: string) => {
    try {
      await dataService.updateUser(user.id, { plan: planName });
      alert(`Plano alterado para ${planName}.`);
    } catch (error) {
      console.error("Error updating plan:", error);
      alert('Erro ao atualizar plano.');
    }
  };

  // Estados para o Criador de Treinos
  const [activeWorkoutTab, setActiveWorkoutTab] = useState("A");
  const [editingWorkoutId, setEditingWorkoutId] = useState<string | null>(null);
  const [workoutName, setWorkoutName] = useState("");
  const [exercises, setExercises] = useState<ExerciseEntry[]>([]);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedItemIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (index: number) => {
    if (draggedItemIndex === null) return;
    const newExercises = [...exercises];
    const draggedItem = newExercises[draggedItemIndex];
    newExercises.splice(draggedItemIndex, 1);
    newExercises.splice(index, 0, draggedItem);
    setExercises(newExercises);
    setDraggedItemIndex(null);
  };

  // Estado para Agenda
  // (agendaView declarada no topo)

  const addExercise = () => {
    const newEx: ExerciseEntry = {
      id: Date.now().toString(),
      name: "Novo Exercício",
      sets: "3",
      reps: "12",
      rest: "60",
      notes: "",
    };
    setExercises([...exercises, newEx]);
  };

  const removeExercise = (id: string) => {
    setExercises(exercises.filter((ex) => ex.id !== id));
  };

  // QR Code state
  const [showQRCode, setShowQRCode] = useState(false);

  const [copied, setCopied] = useState(false);

  // Helper inside renderDashboard
  const renderDashboard = () => (
    <div className="flex flex-col gap-6 pb-12 md:pb-0">
      {/* Header Section */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-white text-3xl font-bold tracking-tight">Painel</p>
          <p className="text-text-secondary text-base font-normal">
            Bem-vindo de volta, {user.name}!
          </p>
        </div>
        <div className="flex gap-3 items-center">
          {/* Mobile-only Add Student Icon */}
          <button
              onClick={() => setActiveTab("add-student")}
              className="md:hidden flex size-10 items-center justify-center rounded-lg bg-primary text-background-dark shadow-lg shadow-primary/20 hover:brightness-110 transition-all"
          >
              <span className="material-symbols-outlined text-base">add</span>
          </button>

          {/* Desktop-only Buttons */}
          <motion.button
            onClick={markAnnouncementsRead}
            animate={unreadAnnouncements > 0 ? {
              borderColor: ["rgba(34, 197, 94, 0.2)", "#22c55e", "rgba(34, 197, 94, 0.2)"],
              backgroundColor: ["rgba(34, 197, 94, 0)", "rgba(34, 197, 94, 0.1)", "rgba(34, 197, 94, 0)"],
            } : {}}
            transition={unreadAnnouncements > 0 ? { repeat: Infinity, duration: 1.5 } : {}}
            className="hidden md:flex items-center justify-center size-10 bg-card-dark border border-border-dark text-text-secondary hover:text-white rounded-lg transition-all relative group"
            title="Comunicados da Plataforma"
          >
            <span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">
              notifications
            </span>
            {unreadAnnouncements > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-background-dark text-[10px] font-black min-w-[18px] h-4.5 rounded-full flex items-center justify-center border-2 border-background-dark shadow-lg shadow-primary/20">
                {unreadAnnouncements}
              </span>
            )}
          </motion.button>

          <button
            onClick={() => setActiveTab('chat')}
            className="hidden md:flex items-center justify-center size-10 bg-card-dark border border-border-dark text-text-secondary hover:text-white rounded-lg transition-all group"
            title="Chat com Alunos"
          >
            <span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">
              chat
            </span>
          </button>
          
          {user.username && (
             <button
                onClick={() => setShowQRCode(true)}
                className="hidden md:flex items-center gap-2 h-10 px-4 bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 rounded-lg font-bold text-sm transition-all"
             >
                <span className="material-symbols-outlined text-[18px]">qr_code</span>
                Meu QR Code
             </button>
          )}

          <button
            onClick={() => setActiveTab("add-student")}
            className="hidden md:flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-background-dark text-sm font-bold gap-2 hover:brightness-110 transition-all shadow-lg shadow-primary/20"
          >
            <span className="material-symbols-outlined text-base">add</span>
            <span className="truncate">Adicionar Aluno</span>
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {[
          {
            label: "Total de Alunos",
            value: (studentsData.length + linkRequests.length).toString(),
            detail: "Base total",
            color: "text-blue-400",
          },
          {
            label: "Alunos Ativos",
            value: studentsData.length.toString(),
            detail: "Total vinculado",
            color: "text-primary",
          },
          {
            label: "Aguardando Pagamento",
            value: linkRequests.length.toString(),
            detail: "Solicitações pendentes",
            color: "text-orange-400",
          },
          {
            label: "Solicitações",
            value: linkRequests.length.toString(),
            detail: "Novos pedidos",
            color: linkRequests.length > 0 ? "text-orange-400" : "text-primary",
          },
          {
            label: "Eventos na Agenda",
            value: events.length.toString(),
            detail: "Agendamentos totais",
            color: "text-primary",
          },
          {
            label: "Receita Estimada",
            value: `R$ ${(studentsData.length * 150).toLocaleString()}`,
            detail: "Projeção mensal",
            color: "text-primary",
          },
        ].map((kpi, idx) => (
          <div
            key={idx}
            className="flex flex-col gap-1 md:gap-2 rounded-xl p-3 md:p-6 border border-border-dark bg-card-dark shadow-sm transition-all cursor-default select-none"
          >
            <p className="text-text-secondary text-[10px] md:text-sm font-medium leading-tight">
              {kpi.label}
            </p>
            <p className="text-white tracking-light text-lg md:text-2xl xl:text-3xl font-bold">
              {kpi.value}
            </p>
            <p className={`${kpi.color} text-[8px] md:text-[10px] font-medium leading-tight`}>
              {kpi.detail}
            </p>
          </div>
        ))}
      </div>

      {/* Quick Shortcuts */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Agenda",
            icon: "calendar_month",
            bg: "bg-primary/10 hover:bg-primary/20",
            iconColor: "text-primary",
            onClick: () => setActiveTab("agenda")
          },
          {
            label: "Biblioteca",
            icon: "library_books",
            bg: "bg-blue-500/10 hover:bg-blue-500/20",
            iconColor: "text-blue-400",
            onClick: () => setActiveTab("workouts")
          },
          {
            label: "Landing Page",
            icon: "public",
            bg: "bg-orange-500/10 hover:bg-orange-500/20",
            iconColor: "text-orange-400",
            onClick: () => setActiveTab("landing-page")
          },
          {
            label: "Nova Mensagem",
            icon: "chat",
            bg: "bg-purple-500/10 hover:bg-purple-500/20",
            iconColor: "text-purple-400",
            onClick: () => setActiveTab("chat")
          },
        ].map((shortcut, idx) => (
          <button
            key={idx}
            className={`${shortcut.bg} rounded-xl p-4 flex flex-col items-center justify-center gap-3 transition-colors border border-transparent`}
            onClick={shortcut.onClick}
          >
            <span
              className={`material-symbols-outlined text-3xl ${shortcut.iconColor}`}
            >
              {shortcut.icon}
            </span>
            <span className="text-text-primary font-bold text-sm">
              {shortcut.label}
            </span>
          </button>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <h2 className="text-white text-xl font-bold tracking-tight">
            Evolução Geral
          </h2>
          <div className="flex flex-col gap-2 rounded-xl border border-border-dark p-6 bg-card-dark">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <p className="text-text-secondary text-base font-medium">
                  Crescimento de Alunos
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="text-white tracking-light text-2xl font-bold">
                    42 Alunos
                  </p>
                  <p className="text-primary text-sm font-medium">+15%</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="text-xs font-bold rounded-md px-3 py-1 bg-primary/20 text-primary border border-primary/30">
                  6 meses
                </button>
                <button className="text-xs font-bold rounded-md px-3 py-1 bg-background-dark text-text-secondary border border-border-dark hover:text-white transition-colors">
                  1 ano
                </button>
              </div>
            </div>
            <div className="h-[250px] w-full py-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={GROWTH_DATA}>
                  <defs>
                    <linearGradient
                      id="colorGrowth"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#13ec5b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#13ec5b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#3a5543"
                    vertical={false}
                    opacity={0.2}
                  />
                  <XAxis
                    dataKey="month"
                    stroke="#a1bfaa"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1a2c20",
                      border: "1px solid #3a5543",
                      borderRadius: "8px",
                    }}
                    itemStyle={{ color: "#13ec5b" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#13ec5b"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorGrowth)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Warnings Section */}
        <div className="flex flex-col gap-4">
          <h2 className="text-white text-xl font-bold tracking-tight">
            Avisos Importantes
          </h2>
          <div className="flex flex-col gap-4 rounded-xl border border-border-dark p-6 bg-card-dark h-full">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center size-10 rounded-full bg-orange-500/10 shrink-0">
                <span className="material-symbols-outlined text-orange-400">
                  hourglass_top
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold truncate">
                  Pagamento de Maria Silva
                </p>
                <p className="text-orange-400 text-sm">Vence em 3 dias</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center size-10 rounded-full bg-red-500/10 shrink-0">
                <span className="material-symbols-outlined text-red-400">
                  warning
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold truncate">
                  Plano de João Pedro
                </p>
                <p className="text-red-400 text-sm">Vencido há 2 dias</p>
              </div>
            </div>
            <div className="flex items-center gap-4 cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors" onClick={() => setActiveTab('chat')}>
              <div className="flex items-center justify-center size-10 rounded-full bg-blue-500/10 shrink-0">
                <span className="material-symbols-outlined text-blue-400">
                  chat_bubble
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold truncate">
                  {latestChat ? `Mensagem de ${getStudentName(latestChat.studentId)}` : 'Sem novas mensagens'}
                </p>
                <p className="text-text-secondary text-sm truncate">
                  {latestChat ? `"${latestChat.lastMessage}"` : 'Fale com seus alunos pelo chat'}
                </p>
              </div>
            </div>

            {linkRequests.length > 0 && (
              <div 
                className="flex items-center gap-4 cursor-pointer bg-orange-500/10 hover:bg-orange-500/20 p-3 rounded-lg border border-orange-500/30 transition-all animate-pulse" 
                onClick={() => setActiveTab('requests')}
              >
                <div className="flex items-center justify-center size-10 rounded-full bg-orange-500/20 shrink-0">
                  <span className="material-symbols-outlined text-orange-400">
                    person_add
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-bold truncate">
                    {linkRequests.length} Solicitação{linkRequests.length > 1 ? 'ões' : ''} Pendente{linkRequests.length > 1 ? 's' : ''}
                  </p>
                  <p className="text-orange-400 text-xs font-medium">Novos alunos aguardando aprovação</p>
                </div>
                <span className="material-symbols-outlined text-orange-400">chevron_right</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activities Section */}
      <div className="flex flex-col gap-4">
        <h2 className="text-white text-xl font-bold tracking-tight">
          Últimas Atividades dos Alunos
        </h2>
        <div className="rounded-xl border border-border-dark bg-card-dark overflow-hidden">
          <ul className="divide-y divide-border-dark">
            {[
              {
                name: "João Silva",
                action: "completou o Treino A.",
                time: "Hoje, 14:30",
                img: "https://i.pravatar.cc/150?u=1",
              },
              {
                name: "Maria Santos",
                action: "enviou uma mensagem.",
                time: "Hoje, 11:15",
                img: "https://i.pravatar.cc/150?u=2",
              },
              {
                name: "Carlos Pereira",
                action: "atingiu um novo recorde.",
                time: "Ontem, 18:00",
                img: "https://i.pravatar.cc/150?u=3",
              },
              {
                name: "Ana Ferreira",
                action: "registrou uma nova avaliação.",
                time: "2 dias atrás",
                img: "https://i.pravatar.cc/150?u=4",
              },
            ].map((activity, idx) => (
              <li
                key={idx}
                className="p-4 flex items-center justify-between gap-4 hover:bg-white/5 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <img
                    className="size-10 rounded-full object-cover border border-border-dark"
                    src={activity.img}
                    alt={activity.name}
                  />
                  <div>
                    <p className="font-semibold text-white">
                      {activity.name}{" "}
                      <span className="font-normal text-text-secondary">
                        {activity.action}
                      </span>
                    </p>
                    <p className="text-sm text-text-secondary">
                      {activity.time}
                    </p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-text-secondary group-hover:text-primary transition-colors">
                  chevron_right
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );

  const nextPeriod = () => {
    if (agendaView === "Mês") setCurrentDate(addMonths(currentDate, 1));
    else if (agendaView === "Semana") setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addDays(currentDate, 1));
  };

  const prevPeriod = () => {
    if (agendaView === "Mês") setCurrentDate(subMonths(currentDate, 1));
    else if (agendaView === "Semana") setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subDays(currentDate, 1));
  };

  const renderAgenda = () => {
    let daysToRender: Date[] = [];
    if (agendaView === "Mês") {
      daysToRender = eachDayOfInterval({ start: startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 }), end: endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 }) });
    } else if (agendaView === "Semana") {
      daysToRender = eachDayOfInterval({ start: startOfWeek(currentDate, { weekStartsOn: 0 }), end: endOfWeek(currentDate, { weekStartsOn: 0 }) });
    } else {
      daysToRender = [startOfDay(currentDate)];
    }

    const periodLabel = agendaView === "Mês"
      ? format(currentDate, "MMMM yyyy", { locale: ptBR })
      : agendaView === "Semana"
        ? `${format(startOfWeek(currentDate, { weekStartsOn: 0 }), "dd MMM", { locale: ptBR })} — ${format(endOfWeek(currentDate, { weekStartsOn: 0 }), "dd MMM", { locale: ptBR })}`
        : format(currentDate, "dd 'de' MMMM, yyyy", { locale: ptBR });

    return (
      <div className="flex flex-col w-full gap-8 animate-in fade-in duration-500 pb-20 relative">
        {selectedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-card-dark border border-border-dark w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95">
              <div className="flex items-center justify-between p-4 border-b border-border-dark bg-background-dark/50">
                <h3 className="text-white font-bold tracking-tight">Detalhes do Agendamento</h3>
                <button onClick={() => setSelectedEvent(null)} className="text-text-secondary hover:text-white transition-colors">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="p-6 flex flex-col gap-5">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl flex items-center justify-center ${selectedEvent.color}`}>
                    <span className="material-symbols-outlined text-3xl">
                       {selectedEvent.status === "Concluído" ? "check_circle" : selectedEvent.status === "Cancelado" ? "cancel" : "schedule"}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white">{selectedEvent.title}</h2>
                    <span className={`inline-block px-2 py-0.5 mt-1 rounded text-[10px] font-black uppercase tracking-wider ${selectedEvent.color}`}>{selectedEvent.status}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 bg-background-dark p-4 rounded-xl border border-border-dark">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-text-secondary tracking-widest mb-1">Data</p>
                    <p className="text-white text-sm font-semibold">{format(selectedEvent.date, "dd/MM/yyyy")}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-text-secondary tracking-widest mb-1">Horário</p>
                    <p className="text-white text-sm font-semibold">{selectedEvent.time}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] uppercase font-bold text-text-secondary tracking-widest mb-1">Tipo de Evento</p>
                    <p className="text-white text-sm font-semibold">{selectedEvent.type}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Agenda Section */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="flex flex-wrap justify-between gap-3 pb-6">
            <div className="flex flex-col gap-2">
              <h1 className="text-white text-4xl font-black leading-tight tracking-[-0.033em]">
                Agenda
              </h1>
              <p className="text-text-secondary text-base font-normal leading-normal">
                Gerencie seus compromissos e sessões.
              </p>
            </div>
            <button className="flex h-10 items-center justify-center gap-2 overflow-hidden rounded-lg px-4 bg-primary text-background-dark text-sm font-bold leading-normal shadow-lg shadow-primary/20 hover:brightness-110 transition-all">
              <span className="material-symbols-outlined text-[18px]">add</span>
              Novo Agendamento
            </button>
          </header>

          <div className="flex-grow flex flex-col gap-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex h-10 w-full md:w-auto items-center justify-center rounded-lg bg-card-dark border border-border-dark p-1">
                <button
                  onClick={() => setAgendaView("Dia")}
                  className={`flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-lg px-4 text-sm font-medium transition-all ${agendaView === "Dia" ? "bg-background-dark text-white shadow-sm" : "text-text-secondary hover:text-white"}`}
                >
                  Dia
                </button>
                <button
                  onClick={() => setAgendaView("Semana")}
                  className={`flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-lg px-4 text-sm font-medium transition-all ${agendaView === "Semana" ? "bg-background-dark text-white shadow-sm" : "text-text-secondary hover:text-white"}`}
                >
                  Semana
                </button>
                <button
                  onClick={() => setAgendaView("Mês")}
                  className={`flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-lg px-4 text-sm font-medium transition-all ${agendaView === "Mês" ? "bg-background-dark text-white shadow-sm" : "text-text-secondary hover:text-white"}`}
                >
                  Mês
                </button>
              </div>
              <div className="flex items-center gap-4 w-full md:w-auto">
                <button onClick={prevPeriod} className="flex size-10 shrink-0 items-center justify-center rounded-full bg-card-dark border border-border-dark hover:bg-white/10 text-white transition-colors">
                  <span className="material-symbols-outlined text-lg">
                    chevron_left
                  </span>
                </button>
                <p className="text-white text-base font-bold whitespace-nowrap capitalize">
                  {periodLabel}
                </p>
                <button onClick={nextPeriod} className="flex size-10 shrink-0 items-center justify-center rounded-full bg-card-dark border border-border-dark hover:bg-white/10 text-white transition-colors">
                  <span className="material-symbols-outlined text-lg">
                    chevron_right
                  </span>
                </button>
              </div>
            </div>

            <div className={`grid ${agendaView === "Dia" ? "grid-cols-1" : "grid-cols-1 md:grid-cols-7"} gap-px bg-border-dark border border-border-dark rounded-xl overflow-hidden`}>
              {daysToRender.map((day, idx) => {
                const dayEvents = events.filter(e => isSameDay(e.date, day));
                const today = isToday(day);
                const isCurrentMonth = isSameMonth(day, currentDate);
                
                return (
                  <div
                    key={idx}
                    className={`bg-background-dark p-3 min-h-[160px] flex flex-col gap-3 ${today ? "bg-card-dark/50" : ""} ${agendaView === "Mês" && !isCurrentMonth ? "opacity-30" : ""}`}
                  >
                    <div className="text-center">
                      <p
                        className={`text-xs uppercase tracking-widest ${today ? "text-primary font-black" : "text-text-secondary font-bold"}`}
                      >
                        {format(day, "EEE dd", { locale: ptBR })}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      {dayEvents.map((evt, i) => (
                        <div
                          key={i}
                          onClick={() => setSelectedEvent(evt)}
                          className={`p-2 rounded-lg border flex flex-col gap-1.5 shadow-sm hover:brightness-110 transition-all cursor-pointer ${evt.color}`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] uppercase font-black tracking-wider opacity-80">
                              {evt.time}
                            </span>
                            <span className="material-symbols-outlined text-[14px] opacity-70">
                              {evt.status === "Concluído"
                                ? "check_circle"
                                : evt.status === "Cancelado"
                                  ? "cancel"
                                  : "schedule"}
                            </span>
                          </div>
                          <p className="text-xs font-bold leading-tight">
                            {evt.title}
                          </p>
                          <p className="text-[10px] font-medium opacity-80">
                            {evt.type}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <aside className="w-full flex flex-col gap-6">
          <div className="rounded-xl bg-card-dark border border-border-dark p-6">
            <h3 className="text-white text-lg font-bold mb-4">
              Próximos Agendamentos
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  title: "Marcos Felipe",
                  type: "Consultoria",
                  time: "Hoje, 10:00",
                  status: "Agendado",
                  bg: "bg-blue-500/10 text-blue-400 border-blue-500/20",
                },
                {
                  title: "Paula Lima",
                  type: "Retorno",
                  time: "Hoje, 18:00",
                  status: "Agendado",
                  bg: "bg-purple-500/10 text-purple-400 border-purple-500/20",
                },
                {
                  title: "Ricardo Santos",
                  type: "Avaliação Presencial",
                  time: "Amanhã, 08:30",
                  status: "Agendado",
                  bg: "bg-primary/10 text-primary border-primary/20",
                },
              ].map((rem, i) => (
                <div
                  key={i}
                  className="flex flex-col gap-3 p-4 bg-background-dark rounded-lg border border-border-dark hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-white truncate">
                      {rem.title}
                    </p>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${rem.bg}`}
                    >
                      {rem.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-text-secondary text-xs">
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px]">
                        event
                      </span>{" "}
                      {rem.type}
                    </span>
                    <span className="flex items-center gap-1.5 font-medium text-white">
                      <span className="material-symbols-outlined text-[14px] text-text-secondary">
                        schedule
                      </span>{" "}
                      {rem.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    );
  };

  const renderStudents = () => (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500 pb-20 relative">
      {/* Modal Vincular Treino */}
      {linkingWorkoutStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background-dark/80 backdrop-blur-sm">
          <div className="bg-card-dark border border-border-dark w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between p-4 border-b border-border-dark bg-background-dark/50">
              <h3 className="text-white font-bold tracking-tight">Vincular Treino</h3>
              <button 
                onClick={() => {
                  setLinkingWorkoutStudent(null);
                  setSelectedWorkoutToLink("");
                }} 
                className="text-text-secondary hover:text-white transition-colors"
                type="button"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">
                  Aluno
                </label>
                <p className="text-white font-black text-lg">{linkingWorkoutStudent.name}</p>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">
                  Selecionar Ficha
                </label>
                <select
                  value={selectedWorkoutToLink || ''}
                  onChange={(e) => setSelectedWorkoutToLink(e.target.value)}
                  className="w-full h-12 bg-background-dark border border-border-dark rounded-xl px-4 text-white focus:border-primary focus:outline-none transition-colors appearance-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 1rem center',
                    backgroundSize: '1.2em'
                  }}
                >
                  <option value="" disabled>Escolha uma ficha...</option>
                  {workouts.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                  {workouts.length === 0 && (
                    <option value="" disabled>Nenhuma ficha disponível. Crie uma ficha primeiro.</option>
                  )}
                </select>
              </div>

              <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-border-dark">
                <button
                  onClick={() => {
                    setEditingWorkoutId('new');
                    setExercises([]);
                    setWorkoutName(`Treino Exclusivo - ${linkingWorkoutStudent.name}`);
                    setActiveTab("workouts");
                    setLinkingWorkoutStudent(null);
                    setSelectedWorkoutToLink("");
                  }}
                  className="w-full flex items-center justify-center gap-2 h-12 bg-white/5 text-white rounded-xl font-bold hover:bg-white/10 transition-all border border-white/10"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  Criar Treino Exclusivo
                </button>
              </div>

              {selectedWorkoutToLink && (
                <div className="flex flex-col gap-3 mt-2 animate-in fade-in slide-in-from-top-2">
                  <button
                    onClick={async () => {
                      if (selectedWorkoutToLink) {
                        await dataService.assignWorkoutToStudent(selectedWorkoutToLink, linkingWorkoutStudent.id);
                        alert(`Treino vinculado a ${linkingWorkoutStudent.name} com sucesso!`);
                        setLinkingWorkoutStudent(null);
                        setSelectedWorkoutToLink("");
                      }
                    }}
                    disabled={!selectedWorkoutToLink}
                    className="w-full flex items-center justify-center gap-2 h-12 bg-primary text-background-dark rounded-xl font-bold shadow-lg shadow-primary/20 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <span className="material-symbols-outlined text-sm">link</span>
                    Vincular Acesso
                  </button>

                  <button
                    onClick={async () => {
                      if (selectedWorkoutToLink) {
                        await dataService.assignWorkoutToStudent(selectedWorkoutToLink, linkingWorkoutStudent.id);
                        const workoutName = workouts.find(w => w.id === selectedWorkoutToLink)?.name || selectedWorkoutToLink;
                        window.open(`https://wa.me/${linkingWorkoutStudent.phone || ''}?text=Olá ${linkingWorkoutStudent.name}, seu novo treino '${workoutName}' já está disponível no app!`, '_blank');
                        setLinkingWorkoutStudent(null);
                        setSelectedWorkoutToLink("");
                      }
                    }}
                    disabled={!selectedWorkoutToLink}
                    className="w-full flex items-center justify-center gap-2 h-12 bg-green-500/10 text-green-500 rounded-xl font-bold hover:bg-green-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all border border-green-500/20"
                  >
                    <span className="material-symbols-outlined text-sm">send</span>
                    Vincular e Notificar (WhatsApp)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Page Heading matching AdminTrainers */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-2">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-white uppercase italic tracking-tighter">
            Gestão de Alunos
          </h1>
          <p className="text-text-secondary">
            Acompanhe, edite e gerencie o acesso de todos os seus alunos.
          </p>
        </div>
        <button
          onClick={() => setActiveTab("add-student")}
          className="flex items-center justify-center gap-2 h-10 px-6 bg-primary text-background-dark rounded-lg text-sm font-black shadow-[0_4px_20px_rgba(var(--color-primary),0.3)] hover:scale-105 transition-transform w-full md:w-auto"
        >
          <span className="material-symbols-outlined font-bold">add</span>
          <span>NOVO ALUNO</span>
        </button>
      </div>

      {/* Toolbar & Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-2">
        <div className="flex-1">
          <div className="flex w-full items-stretch rounded-xl h-12 bg-card-dark border border-border-dark focus-within:border-primary transition-all">
            <div className="text-text-secondary flex items-center justify-center pl-4">
              <span className="material-symbols-outlined">search</span>
            </div>
            <input
              className="w-full bg-transparent border-none text-white focus:ring-0 px-3 text-sm font-medium placeholder:text-text-secondary/50"
              placeholder="Buscar aluno por nome, e-mail ou identificador..."
              type="text"
              value={searchTerm || ''}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          {["Todas", "Ativa", "Vencida", "Cancelada"].map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`flex h-12 items-center gap-x-2 rounded-xl px-4 text-xs font-bold uppercase tracking-widest transition-all ${
                statusFilter === filter
                  ? "bg-primary text-background-dark"
                  : "bg-card-dark text-text-secondary border border-border-dark hover:text-white"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Table Container matching Admin style */}
      <div className="overflow-hidden rounded-2xl border border-border-dark bg-card-dark shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-background-dark/30 text-text-secondary text-[10px] uppercase tracking-[0.2em] border-b border-border-dark">
              <tr>
                <th className="px-6 py-5 font-black text-center w-12">
                  <span className="material-symbols-outlined text-[16px]">
                    vital_signs
                  </span>
                </th>
                <th className="px-6 py-5 font-black">Cadastro</th>
                <th className="px-6 py-5 font-black">Aluno</th>
                <th className="px-6 py-5 font-black">Expiração</th>
                <th className="px-6 py-5 font-black text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-dark relative">
              {studentsData
                .filter((s) => {
                  const matchesSearch = s.name
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase());
                  const matchesStatus =
                    statusFilter === "Todas" || s.status === statusFilter;
                  return matchesSearch && matchesStatus;
                })
                .map((student, i) => (
                  <React.Fragment key={student.id}>
                    <tr
                      className={`group hover:bg-white/[0.02] transition-colors cursor-pointer ${selectedStudentId === student.id ? "bg-white/[0.02]" : ""}`}
                      onClick={() =>
                        setSelectedStudentId(
                          selectedStudentId === student.id ? null : student.id,
                        )
                      }
                    >
                      <td className="px-6 py-4 text-center">
                        <div
                          className={`size-3 rounded-full mx-auto ${student.engagement === "green" ? "bg-primary shadow-[0_0_8px_rgba(19,236,91,0.5)]" : student.engagement === "yellow" ? "bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.5)]" : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"}`}
                        ></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-white font-bold">
                            {new Date(student.regDate).toLocaleDateString(
                              "pt-BR",
                            )}
                          </span>
                          <span className="text-[10px] text-text-secondary uppercase">
                            Registro
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            className="size-10 rounded-full object-cover border border-border-dark"
                            src={student.img}
                            alt={student.name}
                          />
                          <div className="flex flex-col">
                            <span className="text-white font-black uppercase tracking-tight flex items-center gap-2">
                              {student.name}
                              {(() => {
                                const isTrialExpired = student.status !== "Ativa" && student.trialUntil && new Date() > (student.trialUntil?.toDate ? student.trialUntil.toDate() : new Date(student.trialUntil));
                                const isTrialActive = student.status !== "Ativa" && student.trialUntil && !isTrialExpired;
                                
                                return (
                                  <span
                                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ring-1 transition-all ${
                                      student.status === "Ativa"
                                        ? "bg-primary/10 text-primary ring-primary/20"
                                        : isTrialActive
                                          ? "bg-amber-500/10 text-amber-400 ring-amber-500/20"
                                          : (isTrialExpired || student.status === "Vencida")
                                            ? "bg-red-500/10 text-red-400 ring-red-500/20 shadow-[0_0_8px_rgba(239,68,68,0.2)]"
                                            : "bg-white/5 text-text-secondary ring-white/10"
                                    }`}
                                  >
                                    <span className={`size-1 rounded-full ${
                                      student.status === "Ativa" 
                                        ? "bg-primary animate-pulse" 
                                        : isTrialActive 
                                          ? "bg-amber-400 animate-pulse" 
                                          : (isTrialExpired || student.status === "Vencida")
                                            ? "bg-red-400"
                                            : "bg-text-secondary"
                                    }`}></span>
                                    {student.status === "Ativa" ? "Ativa" : isTrialActive ? "Em Trial" : "Bloqueado"}
                                  </span>
                                );
                              })()}
                            </span>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[10px] text-text-secondary uppercase truncate max-w-[200px]">
                                {student.plan || 'Sem plano'}
                              </span>
                              {student.trialUntil && student.status !== "Ativa" && (
                                <span className="text-[8px] text-amber-500 font-bold uppercase tracking-tighter italic">
                                  Trial expira: {new Date(student.trialUntil?.toDate ? student.trialUntil.toDate() : student.trialUntil).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div
                          className="flex flex-col gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="date"
                            value={student.expDate || ''}
                            onChange={(e) =>
                              handleUpdateStudentExpDate(
                                student.id,
                                e.target.value,
                              )
                            }
                            className="bg-background-dark/50 border border-border-dark rounded-md px-2 py-1 text-xs text-primary focus:outline-none focus:border-primary transition-colors cursor-pointer"
                          />
                          <span className="text-[10px] text-text-secondary uppercase">
                            Validade do Plano
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div
                          className="flex items-center justify-center gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Extend Trial */}
                          {student.status !== "Ativa" && (
                            <button
                              onClick={() => handleExtendTrial(student.id)}
                              title="Prorrogar 24h de Acesso"
                              className="size-8 flex items-center justify-center rounded-lg bg-white/5 text-text-secondary hover:bg-amber-500/20 hover:text-amber-400 transition-all transform hover:scale-110"
                            >
                              <span className="material-symbols-outlined text-lg">
                                history
                              </span>
                            </button>
                          )}

                          {/* WhatsApp */}
                          <a
                            href={`https://wa.me/${student.phone}`}
                            target="_blank"
                            rel="noreferrer"
                            title="Falar no WhatsApp"
                            className="size-8 flex items-center justify-center rounded-lg bg-white/5 text-text-secondary hover:bg-green-500/20 hover:text-green-400 transition-all transform hover:scale-110"
                          >
                            <span className="material-symbols-outlined text-lg">
                              chat
                            </span>
                          </a>

                          {/* Send Workout */}
                          <button
                            onClick={() => setLinkingWorkoutStudent(student)}
                            title="Vincular Treino"
                            className="size-8 flex items-center justify-center rounded-lg bg-white/5 text-text-secondary hover:bg-blue-500/20 hover:text-blue-400 transition-all transform hover:scale-110"
                          >
                            <span className="material-symbols-outlined text-lg">
                              fitness_center
                            </span>
                          </button>

                          {/* Delete */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setStudentToUnlink({ id: student.id, name: student.name });
                            }}
                            title="Remover Vínculo"
                            className="size-8 flex items-center justify-center rounded-lg bg-white/5 text-text-secondary hover:bg-red-500/20 hover:text-red-500 transition-all transform hover:scale-110"
                          >
                            <span className="material-symbols-outlined text-lg">
                              person_remove
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                    {selectedStudentId === student.id && (
                      <tr>
                        <td
                          colSpan={5}
                          className="border-b border-border-dark p-6 bg-white/[0.01]"
                        >
                          <div className="grid grid-cols-2 md:grid-cols-6 gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="flex flex-col gap-1">
                              <p className="text-[10px] text-text-secondary uppercase tracking-widest font-bold mb-1">
                                Peso Atual
                              </p>
                              <p className="text-white font-normal text-sm">
                                {student.weight}
                              </p>
                            </div>
                            <div className="flex flex-col gap-1">
                              <p className="text-[10px] text-text-secondary uppercase tracking-widest font-bold mb-1">
                                Freq. Semanal
                              </p>
                              <p className="text-white font-normal text-sm">
                                {student.frequency}
                              </p>
                            </div>
                            <div className="flex flex-col gap-1">
                              <p className="text-[10px] text-text-secondary uppercase tracking-widest font-bold mb-1">
                                Última Atividade
                              </p>
                              <p className="text-white font-normal text-sm">
                                {student.lastActivity}
                              </p>
                            </div>
                            <div className="flex flex-col gap-1">
                              <p className="text-[10px] text-text-secondary uppercase tracking-widest font-bold mb-1">
                                Objetivo
                              </p>
                              <p className="text-white font-normal text-sm text-left">
                                {student.goal}
                              </p>
                            </div>
                            <div className="flex flex-col gap-1 md:col-span-1">
                              <p className="text-[10px] text-text-secondary uppercase tracking-widest font-bold mb-1">
                                Atribuir Plano
                              </p>
                              <select 
                                value={student.plan || ''}
                                onChange={(e) => handleUpdateStudentPlan(student.id, e.target.value)}
                                className="bg-background-dark/50 border border-border-dark rounded-md px-2 py-1.5 text-xs text-white focus:outline-none focus:border-primary transition-colors w-full cursor-pointer truncate"
                              >
                                <option value="">Nenhum plano</option>
                                {trainerCustomPlans.map(tp => (
                                  <option key={tp.id} value={tp.name}>
                                    {tp.name} {tp.hiddenGlobal ? '(Oculto)' : ''}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="flex flex-col justify-center items-center md:items-end gap-2 md:col-span-1">
                              <button 
                                onClick={() => setLinkingWorkoutStudent(student)}
                                className="flex items-center justify-center gap-2 w-full h-9 px-4 bg-blue-500/10 text-blue-400 rounded-lg font-bold text-xs hover:bg-blue-500 transition-colors border border-blue-500/20"
                              >
                                <span className="material-symbols-outlined text-[18px]">
                                  fitness_center
                                </span>
                                Vincular Treino
                              </button>
                              <button className="flex items-center justify-center gap-2 w-full h-9 px-4 bg-primary/10 text-primary rounded-lg font-bold text-xs hover:bg-primary hover:text-background-dark transition-colors border border-primary/20">
                                <span className="material-symbols-outlined text-[18px]">
                                  admin_panel_settings
                                </span>
                                Abrir Painel
                              </button>
                            </div>
                          </div>
                          
                          {/* Progress Table */}
                          <div className="mt-8 animate-in fade-in slide-in-from-top-4 duration-500">
                            <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                              <span className="material-symbols-outlined text-primary">analytics</span>
                              Histórico de Medidas
                            </h4>
                            {selectedStudentProgress.length > 0 ? (
                              <div className="overflow-x-auto pb-4">
                                <table className="w-full text-left border-collapse whitespace-nowrap">
                                  <thead>
                                    <tr className="border-b border-border-dark text-text-secondary text-xs uppercase tracking-widest font-bold">
                                      <th className="py-2 px-4">Data</th>
                                      <th className="py-2 px-4">Peso</th>
                                      <th className="py-2 px-4">Gordura %</th>
                                      <th className="py-2 px-4">Peito</th>
                                      <th className="py-2 px-4">Braços</th>
                                      <th className="py-2 px-4">Cintura</th>
                                      <th className="py-2 px-4">Quadril</th>
                                      <th className="py-2 px-4">Coxas</th>
                                      <th className="py-2 px-4">Panturrilhas</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {selectedStudentProgress.map((record: any, idx: number) => (
                                      <tr key={record.id || idx} className="border-b border-border-dark/50 text-white text-sm hover:bg-white/5 transition-colors">
                                        <td className="py-3 px-4 font-black">{record.date?.toDate ? record.date.toDate().toLocaleDateString('pt-BR') : new Date(record.date).toLocaleDateString('pt-BR')}</td>
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
                              <div className="text-center p-8 bg-background-dark/50 rounded-xl border border-border-dark/50">
                                <p className="text-text-secondary italic">Nenhuma medida registrada para este aluno ainda.</p>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Container */}
      <div className="flex items-center justify-between border-t border-border-dark px-4 py-4 sm:px-6 mt-4">
        <div className="flex flex-1 justify-between sm:hidden">
          <button className="relative inline-flex items-center rounded-md border border-border-dark bg-card-dark px-4 py-2 text-sm font-medium text-text-secondary hover:text-white transition-colors">
            Anterior
          </button>
          <button className="relative ml-3 inline-flex items-center rounded-md border border-border-dark bg-card-dark px-4 py-2 text-sm font-medium text-text-secondary hover:text-white transition-colors">
            Próximo
          </button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-text-secondary">
              Mostrando <span className="font-medium text-white">1</span> a{" "}
              <span className="font-medium text-white">5</span> de{" "}
              <span className="font-medium text-white">23</span> resultados
            </p>
          </div>
          <div>
            <nav
              aria-label="Pagination"
              className="isolate inline-flex -space-x-px rounded-md shadow-sm"
            >
              <button className="relative inline-flex items-center rounded-l-md px-2 py-2 text-text-secondary ring-1 ring-inset ring-border-dark hover:bg-white/5 focus:z-20 transition-all">
                <span className="material-symbols-outlined !text-[18px]">
                  chevron_left
                </span>
              </button>
              <button className="relative z-10 inline-flex items-center bg-primary/20 px-4 py-2 text-sm font-semibold text-primary focus:z-20 border border-primary/30">
                1
              </button>
              <button className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-text-secondary ring-1 ring-inset ring-border-dark hover:bg-white/5 focus:z-20 transition-all">
                2
              </button>
              <button className="relative hidden items-center px-4 py-2 text-sm font-semibold text-text-secondary ring-1 ring-inset ring-border-dark hover:bg-white/5 focus:z-20 transition-all md:inline-flex">
                3
              </button>
              <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-text-secondary ring-1 ring-inset ring-border-dark">
                ...
              </span>
              <button className="relative inline-flex items-center rounded-r-md px-2 py-2 text-text-secondary ring-1 ring-inset ring-border-dark hover:bg-white/5 focus:z-20 transition-all">
                <span className="material-symbols-outlined !text-[18px]">
                  chevron_right
                </span>
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
        <h1 className="text-white text-4xl font-black leading-tight tracking-[-0.033em]">
          Cadastrar Novo Aluno
        </h1>
        <p className="text-text-secondary text-base font-normal leading-normal">
          Preencha as informações abaixo para adicionar um novo aluno à sua
          base.
        </p>
      </div>

      {/* Form Container */}
      <div className="bg-card-dark rounded-2xl p-6 md:p-8 border border-border-dark shadow-2xl">
        <form
          className="flex flex-col gap-8"
          onSubmit={(e) => {
            e.preventDefault();
            setActiveTab("students");
          }}
        >
          {/* Section: Informações Pessoais */}
          <div>
            <h3 className="text-white text-lg font-bold leading-tight tracking-[-0.015em] pb-4 border-b border-border-dark">
              Informações Pessoais
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6 pt-6">
              <label className="flex flex-col flex-1">
                <p className="text-text-primary text-base font-medium leading-normal pb-2">
                  Nome completo
                </p>
                <input
                  required
                  className="w-full rounded-lg text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-border-dark bg-background-dark h-14 placeholder:text-text-secondary/50 px-4 transition-all"
                  placeholder="Digite o nome completo do aluno"
                  type="text"
                />
              </label>
              <label className="flex flex-col flex-1">
                <p className="text-text-primary text-base font-medium leading-normal pb-2">
                  CPF (Opcional)
                </p>
                <input
                  className="w-full rounded-lg text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-border-dark bg-background-dark h-14 placeholder:text-text-secondary/50 px-4 transition-all"
                  placeholder="000.000.000-00"
                  type="text"
                />
              </label>
              <label className="flex flex-col flex-1">
                <p className="text-text-primary text-base font-medium leading-normal pb-2">
                  E-mail
                </p>
                <input
                  required
                  className="w-full rounded-lg text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-border-dark bg-background-dark h-14 placeholder:text-text-secondary/50 px-4 transition-all"
                  placeholder="exemplo@email.com"
                  type="email"
                />
              </label>
              <label className="flex flex-col flex-1">
                <p className="text-text-primary text-base font-medium leading-normal pb-2">
                  Telefone
                </p>
                <input
                  required
                  className="w-full rounded-lg text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-border-dark bg-background-dark h-14 placeholder:text-text-secondary/50 px-4 transition-all"
                  placeholder="(00) 00000-0000"
                  type="tel"
                />
              </label>
              <label className="flex flex-col flex-1">
                <p className="text-text-primary text-base font-medium leading-normal pb-2">
                  Data de nascimento
                </p>
                <input
                  required
                  className="w-full rounded-lg text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-border-dark bg-background-dark h-14 placeholder:text-text-secondary/50 px-4 transition-all"
                  placeholder="DD/MM/AAAA"
                  type="text"
                />
              </label>
            </div>
          </div>

          {/* Section: Dados Físicos e Metas */}
          <div>
            <h3 className="text-white text-lg font-bold leading-tight tracking-[-0.015em] pb-4 border-b border-border-dark">
              Dados Físicos e Metas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6 pt-6">
              <label className="flex flex-col flex-1">
                <p className="text-text-primary text-base font-medium leading-normal pb-2">
                  Peso Inicial (kg)
                </p>
                <input
                  className="w-full rounded-lg text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-border-dark bg-background-dark h-14 placeholder:text-text-secondary/50 px-4 transition-all"
                  placeholder="Ex: 75.5"
                  step="0.1"
                  type="number"
                />
              </label>
              <label className="flex flex-col flex-1">
                <p className="text-text-primary text-base font-medium leading-normal pb-2">
                  Altura Inicial (m)
                </p>
                <input
                  className="w-full rounded-lg text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-border-dark bg-background-dark h-14 placeholder:text-text-secondary/50 px-4 transition-all"
                  placeholder="Ex: 1.80"
                  step="0.01"
                  type="number"
                />
              </label>
              <label className="flex flex-col col-span-1 md:col-span-2">
                <p className="text-text-primary text-base font-medium leading-normal pb-2">
                  Objetivo
                </p>
                <select className="w-full rounded-lg text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-border-dark bg-background-dark h-14 placeholder:text-text-secondary/50 px-4 transition-all cursor-pointer">
                  <option value="">Selecione um objetivo</option>
                  <option value="hipertrofia">Hipertrofia</option>
                  <option value="emagrecimento">Emagrecimento</option>
                  <option value="condicionamento">
                    Condicionamento Físico
                  </option>
                  <option value="reabilitacao">Reabilitação</option>
                </select>
              </label>
            </div>
          </div>

          {/* Section: Informações Adicionais */}
          <div>
            <h3 className="text-white text-lg font-bold leading-tight tracking-[-0.015em] pb-4 border-b border-border-dark">
              Informações Adicionais
            </h3>
            <div className="grid grid-cols-1 gap-6 pt-6">
              <label className="flex flex-col">
                <p className="text-text-primary text-base font-medium leading-normal pb-2">
                  Restrições / Observações médicas
                </p>
                <textarea
                  className="w-full rounded-lg text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-border-dark bg-background-dark min-h-32 placeholder:text-text-secondary/50 p-4 transition-all"
                  placeholder="Descreva aqui qualquer informação médica relevante..."
                ></textarea>
              </label>
              <div className="flex flex-col gap-3">
                <p className="text-text-primary text-base font-medium leading-normal">
                  Status do Aluno
                </p>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      defaultChecked
                      className="text-primary focus:ring-primary/50 bg-background-dark border-border-dark"
                      name="status"
                      type="radio"
                    />
                    <span className="text-text-primary group-hover:text-primary transition-colors">
                      Ativo
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      className="text-primary focus:ring-primary/50 bg-background-dark border-border-dark"
                      name="status"
                      type="radio"
                    />
                    <span className="text-text-primary group-hover:text-primary transition-colors">
                      Inativo
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end items-center gap-4 pt-6 border-t border-border-dark">
            <button
              onClick={() => setActiveTab("students")}
              className="px-6 py-3 rounded-lg text-text-primary font-bold hover:bg-white/5 transition-all"
              type="button"
            >
              Cancelar
            </button>
            <button
              className="px-8 py-3 bg-primary text-background-dark rounded-lg font-bold shadow-lg shadow-primary/20 hover:brightness-110 transition-all"
              type="submit"
            >
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
        <h1 className="text-white text-4xl font-black leading-tight tracking-[-0.033em]">
          Gestão de Treinos
        </h1>
        <p className="text-text-secondary text-base font-normal leading-normal">
          Crie e organize as fichas de treino para seus alunos.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar de Treinos */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="bg-card-dark rounded-xl border border-border-dark p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-bold">Fichas Recentes</h3>
            </div>
            {workouts.map((w) => (
              <div
                key={w.id}
                className={`flex flex-col rounded-lg bg-background-dark border ${editingWorkoutId === w.id ? 'border-primary ring-1 ring-primary/50' : 'border-border-dark hover:border-primary/50'} transition-all group overflow-hidden`}
              >
                <button 
                  onClick={() => {
                    setEditingWorkoutId(w.id);
                    setWorkoutName(w.name || w.title || "Treino sem nome");
                    setExercises(w.exercises || []);
                  }}
                  className="flex items-center justify-between p-3 text-left w-full focus:outline-none"
                >
                  <span className={`text-sm font-medium ${editingWorkoutId === w.id ? 'text-primary font-bold' : 'text-text-primary group-hover:text-white'}`}>
                    {w.name || w.title || "Treino sem nome"}
                  </span>
                  <span className={`material-symbols-outlined text-sm ${editingWorkoutId === w.id ? 'text-primary' : 'text-text-secondary group-hover:text-primary'}`}>
                    edit
                  </span>
                </button>
                <div className="flex border-t border-border-dark divide-x divide-border-dark opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                  <button
                    title="Vincular a Aluno"
                    onClick={() => {
                      // Navigate to students tab to select student
                      setActiveTab("students");
                      setSelectedWorkoutToLink(w.id);
                    }}
                    className="flex-1 py-2 flex items-center justify-center text-text-secondary hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">
                      person_add
                    </span>
                  </button>
                  <button
                    title="Duplicar"
                    onClick={async () => {
                      await dataService.createWorkout({
                        name: `${w.name || w.title || "Treino sem nome"} (Cópia)`,
                        exercises: w.exercises || [],
                        trainerId: user.id
                      });
                    }}
                    className="flex-1 py-2 flex items-center justify-center text-text-secondary hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">
                      content_copy
                    </span>
                  </button>
                  <button
                    title="Excluir"
                    onClick={async () => {
                      if (window.confirm("Deseja realmente excluir esta ficha?")) {
                        await dataService.deleteWorkout(w.id);
                        if (editingWorkoutId === w.id) {
                          setEditingWorkoutId(null);
                          setWorkoutName("");
                          setExercises([]);
                        }
                      }
                    }}
                    className="flex-1 py-2 flex items-center justify-center text-text-secondary hover:text-red-500 hover:bg-red-500/10 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">
                      delete
                    </span>
                  </button>
                </div>
              </div>
            ))}
            <button 
              onClick={() => {
                setEditingWorkoutId("new");
                setWorkoutName("Nova Ficha");
                setExercises([]);
              }}
              className="w-full py-3 mt-2 rounded-lg border border-dashed border-primary/30 text-primary font-bold text-sm hover:bg-primary/10 transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">add</span>
              Nova Ficha
            </button>
          </div>
        </div>

        {/* Editor de Treino */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          {editingWorkoutId ? (
            <div className="bg-card-dark rounded-xl border border-border-dark flex flex-col shadow-[0_0_20px_rgba(0,0,0,0.1)] overflow-hidden">
              <div className="p-6 border-b border-border-dark flex items-center justify-between">
                <input 
                  type="text" 
                  value={workoutName}
                  onChange={(e) => setWorkoutName(e.target.value)}
                  className="bg-transparent border-none text-white text-2xl font-black w-full focus:outline-none focus:ring-0 placeholder-text-secondary/50"
                  placeholder="Nome do Treino (ex: Treino A - Costas e Bíceps)"
                />
                <button
                  onClick={async () => {
                    if (!workoutName.trim()) {
                      alert("O treino precisa de um nome.");
                      return;
                    }
                    if (editingWorkoutId === 'new') {
                      await dataService.createWorkout({
                        name: workoutName,
                        exercises: exercises,
                        trainerId: user.id
                      });
                    } else {
                      await dataService.updateWorkout(editingWorkoutId, {
                        name: workoutName,
                        exercises: exercises
                      });
                    }
                    setEditingWorkoutId(null);
                    alert("Treino salvo com sucesso!");
                  }}
                  className="flex min-w-[120px] items-center justify-center gap-2 px-6 py-2 bg-primary text-background-dark hover:brightness-110 transition-colors rounded-lg font-bold shadow-lg shadow-primary/20 shrink-0"
                >
                  <span className="material-symbols-outlined text-base">save</span>
                  Salvar
                </button>
              </div>

              <div className="p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-bold uppercase tracking-widest text-sm flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-primary text-[18px]">format_list_numbered</span>
                    Exercícios do Treino ({exercises.length})
                  </h3>
                  <button
                    onClick={addExercise}
                    className="flex items-center gap-1.5 px-4 py-1.5 border border-dashed border-primary/30 text-primary hover:bg-primary/10 transition-colors rounded-lg text-xs font-bold"
                  >
                    <span className="material-symbols-outlined text-[14px]">add</span>
                    Adicionar Manual
                  </button>
                </div>

                <div className="flex flex-col gap-3">
                  {exercises.map((ex, index) => (
                    <div 
                      key={ex.id}
                      className="group flex flex-col sm:flex-row gap-4 p-4 border border-border-dark bg-background-dark/50 rounded-xl relative hover:border-primary/50 transition-all"
                    >
                      <button className="absolute -left-3 top-1/2 -translate-y-1/2 bg-card-dark border border-border-dark rounded-full size-6 flex items-center justify-center text-text-secondary cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="material-symbols-outlined text-[14px]">drag_indicator</span>
                      </button>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={ex.name}
                          onChange={(e) => {
                            const newEx = [...exercises];
                            newEx[index].name = e.target.value;
                            setExercises(newEx);
                          }}
                          placeholder="Nome do Exercício"
                          className="bg-transparent text-white font-bold text-lg w-full focus:outline-none focus:ring-0 placeholder-text-secondary/50 mb-2 border-b border-transparent focus:border-border-dark transition-colors pb-1"
                        />
                        <div className="flex items-center gap-4 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-text-secondary uppercase tracking-widest">Séries</span>
                            <input
                              type="text"
                              value={ex.sets}
                              onChange={(e) => {
                                const newEx = [...exercises];
                                newEx[index].sets = e.target.value;
                                setExercises(newEx);
                              }}
                              className="w-16 bg-card-dark border border-border-dark rounded px-2 py-1 text-white text-center focus:border-primary focus:outline-none transition-colors"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-text-secondary uppercase tracking-widest">Reps</span>
                            <input
                              type="text"
                              value={ex.reps}
                              onChange={(e) => {
                                const newEx = [...exercises];
                                newEx[index].reps = e.target.value;
                                setExercises(newEx);
                              }}
                              className="w-20 bg-card-dark border border-border-dark rounded px-2 py-1 text-white text-center focus:border-primary focus:outline-none transition-colors"
                            />
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const newEx = [...exercises];
                          newEx.splice(index, 1);
                          setExercises(newEx);
                        }}
                        className="self-start sm:self-center text-text-secondary hover:text-red-500 transition-colors p-2"
                        title="Remover exercício"
                      >
                        <span className="material-symbols-outlined text-xl">delete</span>
                      </button>
                    </div>
                  ))}
                  {exercises.length === 0 && (
                    <div className="py-12 border-2 border-dashed border-border-dark rounded-xl flex flex-col items-center justify-center text-center">
                      <span className="material-symbols-outlined text-4xl text-text-secondary mb-2 opacity-50">note_stack</span>
                      <p className="text-text-secondary text-sm">Esta ficha ainda não tem exercícios.</p>
                      <button onClick={addExercise} className="mt-4 text-primary font-bold text-sm flex items-center gap-1 hover:underline">
                        Adicione um exercício agora <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-card-dark rounded-xl border border-border-dark p-12 shadow-sm flex flex-col items-center justify-center text-center gap-4">
              <div className="size-16 rounded-full bg-white/5 flex items-center justify-center text-text-secondary">
                <span className="material-symbols-outlined text-4xl">
                  fitness_center
                </span>
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">
                  Nenhum treino selecionado
                </h3>
                <p className="text-text-secondary text-sm max-w-xs mx-auto">
                  Selecione uma ficha ao lado ou crie uma nova para começar a
                  editar os treinos.
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingWorkoutId("new");
                  setWorkoutName("Nova Ficha");
                  setExercises([]);
                }}
                className="mt-2 flex items-center gap-2 px-6 py-2 rounded-lg bg-primary text-background-dark hover:brightness-110 transition-colors text-sm font-bold shadow-lg shadow-primary/20"
              >
                <span className="material-symbols-outlined text-base">add</span>
                Nova Ficha
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderLibrary = () => (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 pb-24">
      <div className="flex flex-col gap-2">
        <h1 className="text-white text-4xl font-black leading-tight tracking-[-0.033em]">
          Biblioteca Central
        </h1>
        <p className="text-text-secondary text-base font-normal leading-normal">
          Seu acervo consolidado de exercícios com links do YouTube.
        </p>
      </div>

      <div
        className="bg-card-dark rounded-xl border border-border-dark overflow-hidden flex flex-col shadow-sm"
        style={{ height: "calc(100vh - 200px)", minHeight: "600px" }}
      >
        {/* Toolbar */}
        <div className="p-4 border-b border-border-dark flex flex-col sm:flex-row gap-4 items-center justify-between bg-card-dark z-20 shrink-0">
          <div className="relative w-full sm:w-1/3">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
              search
            </span>
            <input
              type="text"
              placeholder="Pesquisa rápida..."
              className="w-full bg-background-dark border border-border-dark rounded-lg py-2 pl-10 pr-4 text-white text-sm focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>
          <button 
            onClick={() => {
              setEditingEx(null);
              setShowAddExerciseModal(true);
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2 bg-primary text-background-dark font-bold rounded-lg text-sm hover:brightness-110 transition-colors shadow-lg shadow-primary/20"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Novo Exercício
          </button>
        </div>

        {/* Filters */}
        <div className="px-4 py-3 border-b border-border-dark flex gap-2 overflow-x-auto custom-scrollbar bg-background-dark/50 shrink-0">
          {[
            { id: "fav", label: "Favoritos", icon: "star" },
            { id: "peito", label: "Peito" },
            { id: "costas", label: "Costas" },
            { id: "perna", label: "Perna" },
            { id: "ombro", label: "Ombro" },
            { id: "biceps", label: "Bíceps" },
            { id: "triceps", label: "Tríceps" },
            { id: "funcional", label: "Funcional" },
            { id: "maquina", label: "Máquina" },
            { id: "halter", label: "Halter" },
          ].map((f) => (
            <button
              key={f.id}
              className="flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-md border border-border-dark bg-card-dark text-text-secondary text-sm font-bold hover:text-white hover:border-primary transition-colors"
            >
              {f.icon && (
                <span
                  className={`material-symbols-outlined text-[14px] ${f.id === "fav" ? "text-yellow-400" : ""}`}
                >
                  {f.icon}
                </span>
              )}
              {f.label}
            </button>
          ))}
        </div>

        {/* Exercise List */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar bg-background-dark">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {libraryExercises.map((libEx) => (
              <div
                key={libEx.id}
                className="bg-card-dark border border-border-dark rounded-xl p-5 flex flex-col gap-3 group hover:border-primary/40 transition-colors shadow-sm"
              >
                <div className="flex justify-between items-start gap-2">
                  <h3 className="text-white font-bold text-lg leading-tight group-hover:text-primary transition-colors">
                    {libEx.name}
                  </h3>
                  <button className="text-text-secondary hover:text-yellow-400 transition-colors mt-0.5 shrink-0">
                    <span
                      className={`material-symbols-outlined text-[22px] ${libEx.fav ? "fill text-yellow-400" : ""}`}
                    >
                      star
                    </span>
                  </button>
                </div>

                <p className="text-xs text-text-secondary line-clamp-2 mt-1">
                  {libEx.desc}
                </p>

                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="bg-primary/10 text-primary border border-primary/20 px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest">
                    {libEx.group || 'Geral'}
                  </span>
                  <span className="bg-background-dark text-text-secondary border border-border-dark px-2 py-1 rounded text-[10px] uppercase font-bold tracking-widest">
                    {libEx.equip || 'Peso Corporal'}
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-auto pt-4 border-t border-border-dark">
                  <button
                    onClick={() => {
                      setEditingEx(libEx);
                      setShowAddExerciseModal(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-background-dark border border-border-dark text-text-primary hover:text-white hover:border-primary/50 hover:bg-primary/10 rounded-lg text-xs font-bold transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      edit
                    </span>
                    Editar
                  </button>
                  <button
                    onClick={async () => {
                      if (window.confirm("Deseja excluir este exercício da biblioteca?")) {
                        await dataService.deleteExercise(libEx.id);
                      }
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg text-xs font-bold transition-colors border border-transparent hover:border-red-600"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      delete
                    </span>
                    Excluir
                  </button>
                </div>
              </div>
            ))}
            {libraryExercises.length === 0 && (
              <div className="col-span-full py-16 flex flex-col items-center justify-center text-text-secondary opacity-70">
                <span className="material-symbols-outlined text-4xl mb-3">fitness_center</span>
                <p>Nenhum exercício na biblioteca ainda.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showAddExerciseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background-dark/80 backdrop-blur-sm">
          <div className="bg-card-dark border border-border-dark w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between p-4 border-b border-border-dark bg-background-dark/50">
              <h3 className="text-white font-bold tracking-tight">
                {editingEx ? 'Editar Exercício' : 'Novo Exercício'}
              </h3>
              <button 
                onClick={() => setShowAddExerciseModal(false)}
                className="text-text-secondary hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const name = formData.get('name') as string;
              if (!name.trim()) return;

              const exerciseData = {
                name,
                group: formData.get('group') || '',
                equip: formData.get('equip') || '',
                desc: formData.get('desc') || '',
                trainerId: user.id
              };

              if (editingEx) {
                await dataService.updateExercise(editingEx.id, exerciseData);
              } else {
                await dataService.createExercise(exerciseData);
              }
              setShowAddExerciseModal(false);
            }}>
              <div className="p-6 flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">
                    Nome do Exercício *
                  </label>
                  <input 
                    type="text"
                    name="name"
                    required
                    defaultValue={editingEx?.name || ''}
                    placeholder="Ex: Supino Reto com Halteres"
                    className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-2 text-white focus:border-primary focus:outline-none transition-colors"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">
                      Grupo Muscular
                    </label>
                    <input 
                      type="text"
                      name="group"
                      defaultValue={editingEx?.group || ''}
                      placeholder="Ex: Peito"
                      className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-2 text-white focus:border-primary focus:outline-none transition-colors"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">
                      Equipamento
                    </label>
                    <input 
                      type="text"
                      name="equip"
                      defaultValue={editingEx?.equip || ''}
                      placeholder="Ex: Halteres"
                      className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-2 text-white focus:border-primary focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">
                    Instruções (Opcional)
                  </label>
                  <textarea 
                    name="desc"
                    defaultValue={editingEx?.desc || ''}
                    placeholder="Dicas de execução, postura, etc."
                    rows={3}
                    className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-2 text-white focus:border-primary focus:outline-none transition-colors resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 p-4 border-t border-border-dark bg-background-dark/50">
                <button
                  type="button"
                  onClick={() => setShowAddExerciseModal(false)}
                  className="px-4 py-2 rounded-lg font-bold text-text-secondary border border-border-dark hover:bg-white/5 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary text-background-dark rounded-lg font-bold hover:brightness-110 transition-all shadow-lg shadow-primary/20"
                >
                  {editingEx ? 'Salvar Alterações' : 'Adicionar Exercício'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  const renderRequests = () => (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 pb-24">
      <div className="flex flex-col gap-2">
        <h1 className="text-white text-4xl font-black leading-tight tracking-[-0.033em]">
          Solicitações de Alunos
        </h1>
        <p className="text-text-secondary text-base font-normal leading-normal">
          Gerencie pedidos de vínculo de novos alunos.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {linkRequests.length === 0 ? (
          <div className="bg-card-dark rounded-xl border border-border-dark p-12 flex flex-col items-center justify-center text-center gap-4">
            <span className="material-symbols-outlined text-border-dark text-6xl">
              inbox
            </span>
            <p className="text-text-secondary">
              Nenhuma solicitação pendente no momento.
            </p>
          </div>
        ) : (
          linkRequests.map((req) => (
            <div
              key={req.id}
              className="bg-card-dark rounded-xl border border-border-dark p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-sm"
            >
              <div className="flex items-start gap-4">
                <img
                  src={req.studentAvatar || 'https://images.unsplash.com/photo-1594381898411-846e7d193883?q=80&w=1974&auto=format&fit=crop'}
                  alt={req.studentName}
                  className="size-16 md:size-20 rounded-full border-2 border-primary/20 object-cover shrink-0"
                />
                <div className="flex flex-col flex-1">
                  <h3 className="text-white font-bold text-xl">
                    {req.studentName || 'Novo Aluno'}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">
                      {req.goal || 'Meta não definida'}
                    </span>
                    <span className="bg-border-dark text-white px-2 py-1 rounded text-xs font-medium">
                      {req.experience || 'Iniciante'}
                    </span>
                    {req.age && (
                      <span className="bg-border-dark text-text-secondary px-2 py-1 rounded text-xs font-medium">
                        {req.age} anos
                      </span>
                    )}
                    <span className="text-text-secondary text-xs flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">
                        location_on
                      </span>{" "}
                      {req.city || 'Localização não informada'}
                    </span>
                    <span className="text-text-secondary text-xs border-l border-border-dark pl-2 ml-1">
                      {req.createdAt ? new Date(req.createdAt.seconds * 1000).toLocaleDateString() : 'Hoje'}
                    </span>
                  </div>
                  {req.observation && (
                    <div className="mt-3 bg-background-dark p-3 rounded-lg border border-border-dark flex gap-2 items-start relative">
                      <span className="material-symbols-outlined text-text-secondary text-sm mt-0.5">
                        format_quote
                      </span>
                      <p className="text-text-secondary text-sm italic">
                        {req.observation}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <button
                  onClick={() => handleRejectRequest(req.id)}
                  className="flex-1 sm:flex-none px-6 py-2 rounded-lg border border-border-dark text-text-secondary font-bold hover:bg-white/5 transition-all text-sm"
                >
                  Rejeitar
                </button>
                <button
                  onClick={() => handleApproveRequest(req.id, req.trainerId, req.studentId)}
                  className="flex-1 sm:flex-none px-6 py-2 rounded-lg bg-primary text-background-dark font-bold hover:brightness-110 shadow-lg shadow-primary/20 transition-all text-sm"
                >
                  Aprovar
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderSubscription = () => (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 pb-24">
      <div className="flex flex-col gap-2">
        <h1 className="text-white text-4xl font-black leading-tight tracking-[-0.033em]">
          Minha Assinatura
        </h1>
        <p className="text-text-secondary text-base font-normal leading-normal">
          Escolha ou renove seu plano de acesso ao StarFit para gerenciar mais
          alunos.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {platformPlans.length > 0 ? platformPlans.map((plan, idx) => {
          const isCurrent = user.plan === plan.name;
          return (
          <div
            key={idx}
            className={`bg-card-dark rounded-2xl p-8 border-2 flex flex-col gap-6 relative overflow-hidden transition-all hover:scale-[1.02] ${plan.color || 'border-white/10'}`}
          >
            {isCurrent && (
              <div className="absolute top-0 left-0 right-0 flex justify-center">
                <div className="bg-primary text-background-dark text-xs font-black px-6 py-1.5 uppercase tracking-wider rounded-b-xl shadow-[0_4px_12px_rgba(19,236,91,0.3)] animate-pulse">
                  Plano Atual
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1">
              <h3 className="text-white text-2xl font-black uppercase italic tracking-tighter">
                {plan.name}
              </h3>
              <p className="text-primary font-bold text-sm">{plan.students}</p>
            </div>

            <div className="flex items-baseline gap-1">
              <span className="text-white text-4xl font-black">
                {plan.price}
              </span>
              <span className="text-text-secondary text-sm">{plan.period}</span>
            </div>

            <ul className="flex flex-col gap-3 my-2">
              {(plan.features || []).map((feature: string, fIdx: number) => (
                <li
                  key={fIdx}
                  className="flex items-center gap-2 text-text-secondary text-sm"
                >
                  <span className="material-symbols-outlined text-primary text-lg">
                    check_circle
                  </span>
                  {feature}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSelectPlan(plan.name)}
              disabled={isCurrent}
              className={`mt-auto w-full py-4 rounded-xl font-bold transition-all ${isCurrent ? "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 cursor-default" : "bg-primary text-background-dark shadow-lg shadow-primary/20 hover:brightness-110"}`}
            >
              {isCurrent ? "Plano Ativo" : "Escolher Plano"}
            </button>
          </div>
        )}) : (
          <div className="col-span-3 py-10 text-center text-text-secondary">
            Nenhum plano disponível no momento.
          </div>
        )}
      </div>

      <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-6 flex items-start gap-4 mt-4">
        <span className="material-symbols-outlined text-orange-400">info</span>
        <div>
          <h4 className="text-white font-bold text-sm">
            Informação de Cobrança
          </h4>
          <p className="text-text-secondary text-xs mt-1">
            Sua próxima cobrança será em{" "}
            <span className="text-white font-bold">12/05/2026</span> via Cartão
            de Crédito (**** 4432).
          </p>
        </div>
      </div>
    </div>
  );

  const renderSettingsMenu = () => (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300 pb-24 md:hidden">
      <div className="flex flex-col gap-2 mb-4">
        <h1 className="text-white text-3xl font-black leading-tight tracking-[-0.033em]">
          Menu
        </h1>
      </div>

      <div className="flex items-center gap-4 bg-card-dark p-4 rounded-xl border border-border-dark mb-4">
        <div
          className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-12 border-2 border-primary/20"
          style={{ backgroundImage: `url(${user.avatar})` }}
        />
        <div className="flex flex-col">
          <h2 className="text-white font-bold text-lg">{user.name}</h2>
          <p className="text-text-secondary text-xs uppercase tracking-wider font-bold">
            {user.role}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-black text-text-secondary uppercase tracking-widest px-2 mb-2">GERENCIAMENTO</h3>
        {[
          { id: "library", icon: "menu_book", label: "Biblioteca de Exercícios" },
          { id: "agenda", icon: "calendar_month", label: "Agenda" },
          { id: "chat", icon: "chat", label: "Chat" },
          { id: "plans", icon: "local_activity", label: "Meus Planos e Pagamentos" },
        ].map((link) => (
          <button
            key={link.id}
            onClick={() => setActiveTab(link.id)}
            className="flex items-center gap-4 bg-card-dark border border-border-dark p-4 rounded-xl hover:bg-white/5 transition-all text-left"
          >
            <div className="size-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-primary">{link.icon}</span>
            </div>
            <span className="text-white font-bold flex-1">{link.label}</span>
            <span className="material-symbols-outlined text-text-secondary">chevron_right</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2 mt-4">
         <h3 className="text-xs font-black text-text-secondary uppercase tracking-widest px-2 mb-2">CONTA</h3>
         <button
            onClick={() => setActiveTab('landing-page')}
            className="flex items-center gap-4 bg-card-dark border border-border-dark p-4 rounded-xl hover:bg-white/5 transition-all text-left"
          >
            <div className="size-10 bg-blue-500/10 rounded-full flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-blue-400">web</span>
            </div>
            <span className="text-white font-bold flex-1">Landing Page</span>
            <span className="material-symbols-outlined text-text-secondary">chevron_right</span>
          </button>

         <button
            onClick={() => setActiveTab('subscription')}
            className="flex items-center gap-4 bg-card-dark border border-border-dark p-4 rounded-xl hover:bg-white/5 transition-all text-left"
          >
            <div className="size-10 bg-purple-500/10 rounded-full flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-purple-400">credit_card</span>
            </div>
            <span className="text-white font-bold flex-1">Minha Assinatura StarFit</span>
            <span className="material-symbols-outlined text-text-secondary">chevron_right</span>
          </button>
          
          <button
            onClick={() => setActiveTab('settings')}
            className="flex items-center gap-4 bg-card-dark border border-border-dark p-4 rounded-xl hover:bg-white/5 transition-all text-left"
          >
            <div className="size-10 bg-text-secondary/10 rounded-full flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-text-secondary">settings</span>
            </div>
            <span className="text-white font-bold flex-1">Configurações</span>
            <span className="material-symbols-outlined text-text-secondary">chevron_right</span>
          </button>

          <button
            onClick={() => setActiveTab('support')}
            className="flex items-center gap-4 bg-card-dark border border-border-dark p-4 rounded-xl hover:bg-white/5 transition-all text-left"
          >
            <div className="size-10 bg-orange-500/10 rounded-full flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-orange-400">support_agent</span>
            </div>
            <span className="text-white font-bold flex-1">Suporte</span>
            <span className="material-symbols-outlined text-text-secondary">chevron_right</span>
          </button>
      </div>

      <div className="mt-8 mb-4">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 h-12 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl font-bold hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-transparent hover:shadow-red-500/20"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          Sair do Aplicativo
        </button>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return renderDashboard();
      case "agenda":
        return renderAgenda();
      case "students":
        return renderStudents();
      case "requests":
        return renderRequests();
      case "add-student":
        return renderAddStudent();
      case "workouts":
        return renderWorkouts();
      case "library":
        return renderLibrary();
      case "subscription":
        return renderSubscription();
      case "plans":
        return <TrainerPlans user={user} />;
      case "chat":
        return <TrainerChat user={user} />;
      case "landing-page":
        return <TrainerLandingPage user={user} />;
      case "settings-menu":
        return renderSettingsMenu();
      case "settings":
        return <TrainerSettings user={user} />;
      case "support":
        return <UserSupport user={user} />;
      default:
        return (
          <div className="text-center py-20 text-text-secondary">
            Página em construção...
          </div>
        );
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
        {/* Mobile Header / Top Navbar */}
        <header className="md:hidden flex items-center justify-between px-4 h-16 bg-card-dark border-b border-border-dark shrink-0 z-50 fixed top-0 w-full left-0 right-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary fill text-2xl">
              fitness_center
            </span>
            <span className="font-black text-xl tracking-tighter text-white">
              StarFit
            </span>
          </div>
          <div className="flex items-center gap-2">
             {user.username && (
               <>
                 <button
                    onClick={() => setShowQRCode(true)}
                    className="flex items-center justify-center size-10 rounded-lg text-text-secondary hover:text-white hover:bg-white/5 transition-all"
                 >
                    <span className="material-symbols-outlined">qr_code</span>
                 </button>
                 <button
                    onClick={() => setActiveTab('chat')}
                    className="flex items-center justify-center size-10 rounded-lg text-text-secondary hover:text-white hover:bg-white/5 transition-all"
                 >
                    <span className="material-symbols-outlined">chat</span>
                 </button>
               </>
             )}
            <motion.button 
              onClick={markAnnouncementsRead}
              animate={unreadAnnouncements > 0 ? {
                borderColor: ["rgba(34, 197, 94, 0)", "#22c55e", "rgba(34, 197, 94, 0)"],
                backgroundColor: ["rgba(34, 197, 94, 0)", "rgba(34, 197, 94, 0.1)", "rgba(34, 197, 94, 0)"],
              } : {}}
              transition={unreadAnnouncements > 0 ? { repeat: Infinity, duration: 2 } : {}}
              className="relative flex items-center justify-center size-10 text-text-secondary hover:text-white border border-transparent rounded-lg transition-all"
            >
              <span className="material-symbols-outlined">notifications</span>
              {unreadAnnouncements > 0 && (
                <span className="absolute top-1 right-1 bg-primary text-background-dark text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-background-dark">
                  {unreadAnnouncements}
                </span>
              )}
            </motion.button>
          </div>
        </header>

        {/* Padding for mobile top nav */}
        <div className="md:hidden h-16 shrink-0"></div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-[calc(10rem+env(safe-area-inset-bottom))] md:pb-8">
          <div className="max-w-7xl mx-auto">{renderContent()}</div>
        </div>

        {/* Mobile Bottom Navbar */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[84px] z-50">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 375 84" preserveAspectRatio="none">
            <path
              d="M0 0 H120 C135 0 140 3 145 10 C 158 52 217 52 230 10 C 235 3 240 0 255 0 H375 V84 H0 Z"
              className="fill-card-dark"
            />
            <path
              d="M0 0 H120 C135 0 140 3 145 10 C 158 52 217 52 230 10 C 235 3 240 0 255 0 H375"
              className="stroke-border-dark"
              strokeWidth="1"
              fill="none"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-around px-2 pb-2">
            <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex flex-col items-center justify-center gap-1 w-16 transition-colors ${(activeTab === 'dashboard') ? 'text-primary' : 'text-text-secondary hover:text-white'}`}
            >
                <span className={`material-symbols-outlined text-2xl transition-all ${(activeTab === 'dashboard') ? 'fill scale-110' : ''}`}>dashboard</span>
                {(activeTab === 'dashboard') && <span className="text-[10px] font-medium tracking-wide">Início</span>}
            </button>
            <button
                onClick={() => setActiveTab('students')}
                className={`flex flex-col items-center justify-center gap-1 w-16 transition-colors ${(activeTab === 'students') ? 'text-primary' : 'text-text-secondary hover:text-white'}`}
            >
                <span className={`material-symbols-outlined text-2xl transition-all ${(activeTab === 'students') ? 'fill scale-110' : ''}`}>group</span>
                {(activeTab === 'students') && <span className="text-[10px] font-medium tracking-wide">Alunos</span>}
            </button>
 
            {/* Workout Button - Elevated & Centralized */}
            <div className="relative -mt-[110px]">
              <button
                  onClick={() => setActiveTab('workouts')}
                  className={`flex items-center justify-center size-[80px] rounded-full border-4 border-background-dark shadow-[0_12px_30px_rgba(0,0,0,0.5),0_0_20px_rgba(19,236,91,0.25)] transition-all active:scale-95 ${(activeTab === 'workouts') ? 'bg-primary text-background-dark scale-105 shadow-[0_12px_35px_rgba(19,236,91,0.4)]' : 'bg-primary text-background-dark/90 hover:brightness-110'}`}
              >
                  <span className="material-symbols-outlined text-[40px] drop-shadow-sm font-bold">fitness_center</span>
              </button>
            </div>

            <button
                onClick={() => setActiveTab('requests')}
                className={`flex flex-col items-center justify-center gap-1 w-16 relative transition-colors ${(activeTab === 'requests') ? 'text-primary' : 'text-text-secondary hover:text-white'}`}
            >
                {linkRequests.length > 0 && <span className="absolute top-0 right-3 size-2.5 bg-orange-500 rounded-full animate-pulse border border-card-dark"></span>}
                <span className={`material-symbols-outlined text-2xl transition-all ${(activeTab === 'requests') ? 'fill scale-110' : ''}`}>person_add</span>
                {(activeTab === 'requests') && <span className="text-[10px] font-medium tracking-wide">Pedidos</span>}
            </button>
            <button
                onClick={() => setActiveTab('settings-menu')}
                className={`flex flex-col items-center justify-center gap-1 w-16 transition-colors ${(activeTab === 'settings-menu') ? 'text-primary' : 'text-text-secondary hover:text-white'}`}
            >
                <span className={`material-symbols-outlined text-2xl transition-all ${(activeTab === 'settings-menu') ? 'fill scale-110' : ''}`}>tune</span>
                {(activeTab === 'settings-menu') && <span className="text-[10px] font-medium tracking-wide">Ajustes</span>}
            </button>
          </div>
        </nav>
      </main>

      {/* Announcements Modal */}
      <AnimatePresence>
        {showAnnouncements && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAnnouncements(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-card-dark border border-border-dark rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-6 border-b border-border-dark flex justify-between items-center bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/20 p-2 rounded-lg">
                    <span className="material-symbols-outlined text-primary">notifications</span>
                  </div>
                  <h3 className="text-xl font-bold text-white tracking-tight">Comunicados Oficiais</h3>
                </div>
                <button 
                  onClick={() => setShowAnnouncements(false)}
                  className="text-text-secondary hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {announcements.length === 0 ? (
                  <div className="text-center py-10 text-text-secondary">
                    Nenhum comunicado disponível no momento.
                  </div>
                ) : (
                  announcements.map((ann) => (
                    <div key={ann.id} className="p-4 bg-white/5 border border-white/5 rounded-xl space-y-2">
                       <p className="text-[10px] text-primary font-black uppercase tracking-widest">
                         {ann.createdAt?.seconds ? new Date(ann.createdAt.seconds * 1000).toLocaleDateString() : '—'}
                       </p>
                       <h4 className="text-white font-bold">{ann.title}</h4>
                       <div className="text-text-secondary text-sm leading-relaxed whitespace-pre-wrap">
                         {ann.message}
                       </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showQRCode && user.username && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowQRCode(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-sm rounded-xl border border-border-dark bg-card-dark p-6 shadow-2xl flex flex-col items-center gap-6"
            >
              <button
                onClick={() => setShowQRCode(false)}
                className="absolute right-4 top-4 text-text-secondary hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>

              <div className="flex flex-col items-center gap-2 text-center mt-2">
                <h3 className="text-2xl font-black text-white italic">Seu QR Code</h3>
                <p className="text-text-secondary text-sm">Mostre isso aos seus alunos para acessarem sua Landing Page!</p>
              </div>

              <div className="bg-white p-4 rounded-xl shadow-inner">
                <QRCodeSVG
                  value={`${window.location.origin}/#/${user.username}`}
                  size={200}
                  bgColor={"#ffffff"}
                  fgColor={"#000000"}
                  level={"Q"}
                  includeMargin={false}
                />
              </div>

              <div className="w-full flex flex-col gap-3">
                <div className="w-full bg-background-dark border border-border-dark rounded-lg p-3 text-center flex flex-col gap-1 select-none cursor-pointer group hover:border-primary/50 transition-colors"
                     onClick={() => {
                        const publicLink = `${window.location.protocol}//${user.username}.${window.location.host.replace('www.', '')}`;
                        navigator.clipboard.writeText(publicLink);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                     }}
                >
                  <span className="text-[10px] text-text-secondary uppercase tracking-widest font-bold">Seu link público</span>
                  <span className="text-primary font-bold text-sm truncate">{`${user.username}.${window.location.host.replace('www.', '')}`}</span>
                  <span className={`text-[9px] mt-1 transition-all whitespace-nowrap font-bold ${copied ? 'text-green-400 opacity-100' : 'text-text-secondary opacity-0 group-hover:opacity-100'}`}>
                    {copied ? '✓ Link copiado para a área de transferência!' : 'Clique para copiar'}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      const publicLink = `${window.location.protocol}//${user.username}.${window.location.host.replace('www.', '')}`;
                      if (navigator.share) {
                        navigator.share({
                          title: 'Minha Landing Page - StarFit',
                          text: 'Confira meu perfil profissional no StarFit!',
                          url: publicLink
                        }).catch(console.error);
                      } else {
                        navigator.clipboard.writeText(publicLink);
                        alert("Link copiado! (Seu navegador não suporta compartilhamento direto)");
                      }
                    }}
                    className="flex-1 flex items-center justify-center gap-2 bg-primary text-background-dark font-bold py-3 rounded-lg hover:brightness-110 active:scale-95 transition-all text-sm"
                  >
                    <span className="material-symbols-outlined text-[20px]">share</span>
                    Compartilhar
                  </button>
                  <a 
                    href={`${window.location.protocol}//${user.username}.${window.location.host.replace('www.', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center size-12 bg-card-light/10 border border-border-dark text-white rounded-lg hover:bg-white/5 transition-all"
                    title="Ver Link Público"
                  >
                    <span className="material-symbols-outlined">open_in_new</span>
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRequestToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-8 left-1/2 z-[100] bg-orange-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 cursor-pointer min-w-[320px] border-2 border-orange-400"
            onClick={() => {
              setActiveTab('requests');
              setShowRequestToast(false);
            }}
          >
            <div className="bg-white/20 p-2 rounded-xl">
              <span className="material-symbols-outlined text-white">person_add</span>
            </div>
            <div className="flex-1">
              <p className="font-bold text-lg">Nova Solicitação!</p>
              <p className="text-sm text-orange-50 text-medium">Você tem novas solicitações de alunos aguardando aprovação.</p>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); setShowRequestToast(false); }}
              className="text-white hover:bg-white/20 p-1 rounded-lg"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Unlink Confirmation Modal */}
      {studentToUnlink && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background-dark/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card-light dark:bg-card-dark rounded-2xl p-6 lg:p-8 w-full max-w-md shadow-2xl border border-border-light dark:border-border-dark animate-in zoom-in-95 duration-200 text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
              <span className="material-symbols-outlined text-red-500 text-2xl">person_remove</span>
            </div>
            <h2 className="text-xl font-bold text-text-light-primary dark:text-text-dark-primary mb-2">Remover Vínculo</h2>
            <p className="text-text-light-secondary dark:text-text-dark-secondary mb-6">
              Tem certeza que deseja remover o vínculo com o aluno <span className="font-bold text-text-light-primary dark:text-text-dark-primary">{studentToUnlink.name}</span>? 
              Ele não será excluído do sistema, mas você não poderá mais ver o progresso dele ou gerenciar seus treinos.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setStudentToUnlink(null)}
                className="flex-1 py-3 px-4 rounded-xl border border-border-light dark:border-border-dark text-text-light-primary dark:text-text-dark-primary font-bold hover:bg-black/5 dark:hover:bg-white/5 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteStudent(studentToUnlink.id)}
                className="flex-1 py-3 px-4 rounded-xl bg-red-500 text-white font-bold hover:brightness-110 shadow-lg shadow-red-500/20 transition-all"
              >
                Remover Vínculo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainerDashboard;
