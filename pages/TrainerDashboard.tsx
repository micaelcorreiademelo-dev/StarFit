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

const LIBRARY_EXERCISES: any[] = [
  // ABDOMINAL
  { id: "b-1", name: "Abdominal Supra", category: "Abdominal", difficulty: "Iniciante", desc: "Exercício clássico focado na região superior do abdômen." },
  { id: "b-2", name: "Abdominal Infra", category: "Abdominal", difficulty: "Iniciante", desc: "Focado na região inferior do abdômen, elevação de pernas." },
  { id: "b-3", name: "Abdominal Oblíquo", category: "Abdominal", difficulty: "Iniciante", desc: "Trabalha as regiões laterais do abdômen." },
  { id: "b-4", name: "Prancha Abdominal", category: "Abdominal", difficulty: "Intermediário", desc: "Exercício isométrico de estabilização do core." },
  { id: "b-5", name: "Abdominal na Polia", category: "Abdominal", difficulty: "Intermediário", desc: "Abdominal ajoelhado com resistência da polia." },

  // AERÓBICO
  { id: "b-6", name: "Corrida na Esteira", category: "Aeróbico", difficulty: "Iniciante", desc: "Treinamento cardiovascular com velocidade e inclinação reguláveis." },
  { id: "b-7", name: "Bicicleta Ergométrica", category: "Aeróbico", difficulty: "Iniciante", desc: "Exercício aeróbico de baixo impacto para articulações." },
  { id: "b-8", name: "Elíptico / Transport", category: "Aeróbico", difficulty: "Iniciante", desc: "Excelente para queima calórica sem impacto nos joelhos." },
  { id: "b-9", name: "Pular Corda", category: "Aeróbico", difficulty: "Intermediário", desc: "Treino de alta intensidade, coordenação e agilidade." },
  { id: "b-10", name: "Subir Escada", category: "Aeróbico", difficulty: "Avançado", desc: "Simulador de escadas para alta intensidade cardiovascular." },

  // ANTEBRAÇO
  { id: "b-11", name: "Rosca Inversa", category: "Antebraço", difficulty: "Intermediário", desc: "Rosca com pegada pronada focada nos braquiorradiais." },
  { id: "b-12", name: "Rosca Punho", category: "Antebraço", difficulty: "Iniciante", desc: "Flexão de punhos com barra para flexores do antebraço." },

  // BÍCEPS
  { id: "b-13", name: "Rosca Direta com Barra", category: "Bíceps", difficulty: "Iniciante", desc: "O clássico construtor de bíceps com barra reta ou W." },
  { id: "b-14", name: "Rosca Alternada", category: "Bíceps", difficulty: "Iniciante", desc: "Rosca com halteres alternando os braços com rotação." },
  { id: "b-15", name: "Rosca Martelo", category: "Bíceps", difficulty: "Iniciante", desc: "Pegada neutra focada no braquiorradial e bíceps." },
  { id: "b-16", name: "Rosca Concentrada", category: "Bíceps", difficulty: "Intermediário", desc: "Rosca unilateral apoiado na coxa para pico do bíceps." },
  { id: "b-17", name: "Rosca Scott", category: "Bíceps", difficulty: "Intermediário", desc: "Isolamento total do bíceps no banco Scott." },

  // COSTAS
  { id: "b-18", name: "Remada Curvada", category: "Costas", difficulty: "Intermediário", desc: "Trabalho completo da dorsal e musculatura das costas com barra." },
  { id: "b-19", name: "Pulldown", category: "Costas", difficulty: "Intermediário", desc: "Remada com os braços estendidos na polia para latíssimo." },
  { id: "b-20", name: "Puxada Alta na Polia", category: "Costas", difficulty: "Iniciante", desc: "Exercício fundamental para largura das costas." },
  { id: "b-21", name: "Levantamento Terra", category: "Costas", difficulty: "Avançado", desc: "Exercício composto para toda a cadeia posterior." },
  { id: "b-22", name: "Remada Serrote (Unilateral)", category: "Costas", difficulty: "Iniciante", desc: "Remada unilateral com halteres no banco." },

  // GLÚTEO
  { id: "b-23", name: "Elevação Pélvica", category: "Glúteo", difficulty: "Intermediário", desc: "Melhor exercício isolado para ativação máxima de glúteos." },
  { id: "b-24", name: "Cadeira Abdutora", category: "Glúteo", difficulty: "Iniciante", desc: "Focado em glúteo médio e estabilizadores." },
  { id: "b-25", name: "Glúteo Coice no Cabo", category: "Glúteo", difficulty: "Intermediário", desc: "Extensão de quadril na polia baixa." },

  // OMBRO
  { id: "b-26", name: "Desenvolvimento com Halteres", category: "Ombro", difficulty: "Intermediário", desc: "Foco principal em deltoides anterior e lateral." },
  { id: "b-27", name: "Desenvolvimento Militar", category: "Ombro", difficulty: "Avançado", desc: "Desenvolvimento em pé com barra, exige estabilidade do core." },
  { id: "b-28", name: "Elevação Lateral", category: "Ombro", difficulty: "Iniciante", desc: "Exercício de isolamento para cabeça lateral do deltoide." },
  { id: "b-29", name: "Elevação Frontal", category: "Ombro", difficulty: "Iniciante", desc: "Foco no deltoide anterior." },
  { id: "b-30", name: "Crucifixo Inverso", category: "Ombro", difficulty: "Iniciante", desc: "Trabalha a porção posterior do ombro." },

  // PANTURRILHA
  { id: "b-31", name: "Panturrilha em Pé", category: "Panturrilha", difficulty: "Iniciante", desc: "Elevação de calcanhares para gastrocnêmio." },
  { id: "b-32", name: "Panturrilha Sentado (Gêmeos)", category: "Panturrilha", difficulty: "Iniciante", desc: "Trabalho específico do músculo sóleo." },
  { id: "b-33", name: "Panturrilha no Leg Press", category: "Panturrilha", difficulty: "Iniciante", desc: "Elevação de calcanhares no aparelho leg press." },

  // PEITORAL
  { id: "b-34", name: "Supino Reto com Barra", category: "Peitoral", difficulty: "Intermediário", desc: "O construtor principal de força e volume de peito." },
  { id: "b-35", name: "Supino Inclinado com Halteres", category: "Peitoral", difficulty: "Intermediário", desc: "Foco na porção clavicular (superior) do peitoral." },
  { id: "b-36", name: "Supino Declinado", category: "Peitoral", difficulty: "Intermediário", desc: "Foco na porção inferior do peito." },
  { id: "b-37", name: "Crucifixo Reto com Halteres", category: "Peitoral", difficulty: "Iniciante", desc: "Abertura isolando as fibras do peitoral." },
  { id: "b-38", name: "Crossover na Polia", category: "Peitoral", difficulty: "Intermediário", desc: "Polia média/alta focada em isolamento e contração." },

  // PERNAS
  { id: "b-39", name: "Agachamento Livre", category: "Pernas", difficulty: "Avançado", desc: "O rei dos exercícios de perna, recruta quadríceps e glúteos." },
  { id: "b-40", name: "Leg Press 45º", category: "Pernas", difficulty: "Intermediário", desc: "Trabalho forte de quadríceps com segurança nas costas." },
  { id: "b-41", name: "Cadeira Extensora", category: "Pernas", difficulty: "Iniciante", desc: "Isolamento total e bombeamento de quadríceps." },
  { id: "b-42", name: "Mesa Flexora", category: "Pernas", difficulty: "Iniciante", desc: "Isolamento focado nos isquiotibiais (trás da coxa)." },
  { id: "b-43", name: "Stiff", category: "Pernas", difficulty: "Intermediário", desc: "Trabalho excêntrico poderoso de posterior de coxa e glúteos." },
  { id: "b-44", name: "Hack Machine", category: "Pernas", difficulty: "Intermediário", desc: "Agachamento no trilho para quadríceps de forma guiada." },

  // TRAPÉZIO
  { id: "b-45", name: "Encolhimento de Ombros", category: "Trapézio", difficulty: "Iniciante", desc: "Elevação do trapézio superior com halteres ou barra." },
  { id: "b-46", name: "Remada Alta Barra", category: "Trapézio", difficulty: "Intermediário", desc: "Trabalha deltoide lateral e trapézio." },

  // TRÍCEPS
  { id: "b-47", name: "Tríceps de Testa", category: "Tríceps", difficulty: "Intermediário", desc: "Extensão poderosa no banco focando a porção longa." },
  { id: "b-48", name: "Tríceps Pulley (Polia)", category: "Tríceps", difficulty: "Iniciante", desc: "Extensão clássica com barra reta ou V na polia alta." },
  { id: "b-49", name: "Tríceps Corda", category: "Tríceps", difficulty: "Iniciante", desc: "Variação na corda permitindo maior rotação e contração final." },
  { id: "b-50", name: "Tríceps Coice", category: "Tríceps", difficulty: "Iniciante", desc: "Extensão unilateral com halteres focada em contração isométrica." }
];

const TrainerDashboard: React.FC<TrainerDashboardProps> = ({
  user,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [studentToUnlink, setStudentToUnlink] = useState<{id: string, name: string} | null>(null);
  const [editingStudentProfile, setEditingStudentProfile] = useState<any>(null);
  const [addingEvaluationStudent, setAddingEvaluationStudent] = useState<any>(null);
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
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
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
  const [mobileSelectedStudent, setMobileSelectedStudent] = useState<any>(null);
  const [chatInitialStudentId, setChatInitialStudentId] = useState<string | null>(null);
  const [chatBackToStudent, setChatBackToStudent] = useState<any | null>(null);
  const [tabBeforeChat, setTabBeforeChat] = useState<string | null>(null);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [libraryExercises, setLibraryExercises] = useState<any[]>([]);
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
  const [editingEx, setEditingEx] = useState<any>(null);
  const [platformPlans, setPlatformPlans] = useState<any[]>([]);
  const [trainerCustomPlans, setTrainerCustomPlans] = useState<any[]>([]);
  const [latestChat, setLatestChat] = useState<any>(null);
  const [isChatOpenOnMobile, setIsChatOpenOnMobile] = useState(false);
  const [editedStudent, setEditedStudent] = useState<any>(null);
  const [isMobileActionMenuOpen, setIsMobileActionMenuOpen] = useState(false);
  const [isSelectingStudentForWorkout, setIsSelectingStudentForWorkout] = useState(false);
  const [studentSearchForWorkout, setStudentSearchForWorkout] = useState("");
  const [isCreatingWorkoutForStudentFlow, setIsCreatingWorkoutForStudentFlow] = useState(false);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [mobileWorkoutFlowState, setMobileWorkoutFlowState] = useState<string | null>(null);
  const [isSettingUpBlankWorkout, setIsSettingUpBlankWorkout] = useState(false);
  const [blankWorkoutName, setBlankWorkoutName] = useState("");
  const [blankWorkoutDays, setBlankWorkoutDays] = useState(3);
  const [modelSearchQuery, setModelSearchQuery] = useState("");
  const [copySearchQuery, setCopySearchQuery] = useState("");

  const getStudentNamesForWorkout = (workout: any) => {
    if (!workout.studentIds || workout.studentIds.length === 0) return "Ficha Modelo";
    return workout.studentIds.map((sid: string) => {
      const student = studentsData.find(s => s.id === sid);
      return student ? student.name : "Aluno";
    }).join(", ");
  };

  useEffect(() => {
    if (activeTab !== 'chat') {
      setChatInitialStudentId(null);
      setChatBackToStudent(null);
      setTabBeforeChat(null);
    }
    if (activeTab !== 'students') {
      setIsCreatingWorkoutForStudentFlow(false);
      setIsBottomSheetOpen(false);
      setIsSettingUpBlankWorkout(false);
      setMobileWorkoutFlowState(null);
    }
    setIsMobileActionMenuOpen(false);
  }, [activeTab]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobileScreen(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (editingStudentProfile) {
      setEditedStudent({
        id: editingStudentProfile.id,
        name: editingStudentProfile.name || "",
        cpf: editingStudentProfile.cpf || "",
        birthDate: editingStudentProfile.birthDate || "",
        gender: editingStudentProfile.gender || "",
        phone: editingStudentProfile.phone || "",
        email: editingStudentProfile.email || "",
        observations: editingStudentProfile.observations || editingStudentProfile.obs || "",
        img: editingStudentProfile.img || editingStudentProfile.avatar || "",
      });
    } else {
      setEditedStudent(null);
    }
  }, [editingStudentProfile]);

  const handleSaveEditedStudent = async () => {
    if (!editedStudent) return;
    try {
      const updateData = {
        name: editedStudent.name,
        cpf: editedStudent.cpf,
        birthDate: editedStudent.birthDate,
        gender: editedStudent.gender,
        phone: editedStudent.phone,
        email: editedStudent.email,
        observations: editedStudent.observations,
        obs: editedStudent.observations,
        img: editedStudent.img,
      };
      await dataService.updateUser(editedStudent.id, updateData);
      
      // Update local state is crucial
      setStudentsData(prev => prev.map(s => s.id === editedStudent.id ? { ...s, ...updateData } : s));
      if (mobileSelectedStudent && mobileSelectedStudent.id === editedStudent.id) {
        setMobileSelectedStudent(prev => ({ ...prev, ...updateData }));
      }
      setEditingStudentProfile(null);
    } catch (error) {
      console.error("Error saving student profile:", error);
      alert("Erro ao salvar perfil do aluno.");
    }
  };

  const toggleWorkoutStatus = async (workout: any, studentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const currentStatuses = workout.studentStatuses || {};
    const currentStatus = currentStatuses[studentId] || "Ativo";
    const newStatus = currentStatus === "Ativo" ? "Finalizado" : "Ativo";
    const updatedStatuses = { ...currentStatuses, [studentId]: newStatus };
    
    try {
      await dataService.updateWorkout(workout.id, {
        studentStatuses: updatedStatuses
      });
    } catch (error) {
      console.error("Error updating workout status:", error);
    }
  };

  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [newEvent, setNewEvent] = useState({ title: '', type: 'Consultoria', date: new Date().toISOString().split('T')[0], time: '10:00' });

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
  const [preAssignedStudentId, setPreAssignedStudentId] = useState<string | null>(null);
  const [workoutName, setWorkoutName] = useState("");
  const [exercises, setExercises] = useState<ExerciseEntry[]>([]);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

  // Estados e Construtores Reformulados Profissionais do Painel de Treinos
  const [subWorkouts, setSubWorkouts] = useState<any[]>([]);
  const [activeSubWorkoutIndex, setActiveSubWorkoutIndex] = useState<number | null>(null);
  const [workoutEditorStep, setWorkoutEditorStep] = useState<"ficha" | "prescrever" | "detalhe">("ficha");
  const [subWorkoutSearchQuery, setSubWorkoutSearchQuery] = useState("");
  const [selectedMuscleGroupFilter, setSelectedMuscleGroupFilter] = useState<string | null>(null);

  // Detalhes do Exercício Ativo Form
  const [selectedLibraryExercise, setSelectedLibraryExercise] = useState<any | null>(null);
  const [isManualExercise, setIsManualExercise] = useState(false);
  const [isSpecialSeries, setIsSpecialSeries] = useState(false);
  const [editingConfiguredExerciseId, setEditingConfiguredExerciseId] = useState<string | null>(null);

  const [detailSeriesForm, setDetailSeriesForm] = useState<"Repetição" | "Minuto" | "Segundo">("Repetição");
  const [detailLoadConfig, setDetailLoadConfig] = useState<"Kg" | "Libras" | "Pesos" | "%">("Kg");
  const [detailRest, setDetailRest] = useState<number>(60);
  const [detailSeries, setDetailSeries] = useState<any[]>([{ id: "1", reps: "10", weight: "12" }]);
  const [detailVideoUrl, setDetailVideoUrl] = useState("");
  const [detailNotes, setDetailNotes] = useState("");
  const [accordionExpanded, setAccordionExpanded] = useState(false);

  // Drag and Drop SubWorkouts
  const [draggedSubWorkoutIndex, setDraggedSubWorkoutIndex] = useState<number | null>(null);

  // Estados para o bottom sheet de ações de treino no mobile
  const [mobileWorkoutActionIndex, setMobileWorkoutActionIndex] = useState<number | null>(null);
  const [editingWorkoutNameIndex, setEditingWorkoutNameIndex] = useState<number | null>(null);
  const [isEditingInlineName, setIsEditingInlineName] = useState(false);
  const [tempWorkoutName, setTempWorkoutName] = useState("");
  const [isConfirmingDeleteSubWorkout, setIsConfirmingDeleteSubWorkout] = useState(false);
  const [isConfirmingDeleteFicha, setIsConfirmingDeleteFicha] = useState(false);
  const [deletingModelWorkoutId, setDeletingModelWorkoutId] = useState<string | null>(null);
  const [deletingLibExerciseId, setDeletingLibExerciseId] = useState<string | null>(null);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  const [isMobileScreen, setIsMobileScreen] = useState(false);
  const [isMobileBottomSheetExpanded, setIsMobileBottomSheetExpanded] = useState(false);

  // Estados para gerenciar a Ficha de Treino (Nome, Ativo, Periodizaçao e Remoção) na versão mobile
  const [isFichaMenuOpen, setIsFichaMenuOpen] = useState(false);
  const [fichaIsActive, setFichaIsActive] = useState(true);
  const [fichaPeriodizationType, setFichaPeriodizationType] = useState<"treinos" | "data" | null>(null);
  const [fichaPeriodizationValue, setFichaPeriodizationValue] = useState<string>("");
  const [fichaObservation, setFichaObservation] = useState("");

  const handleSubWorkoutDragStart = (e: React.DragEvent, index: number) => {
    setDraggedSubWorkoutIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleSubWorkoutDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedSubWorkoutIndex === null || draggedSubWorkoutIndex === targetIndex) return;
    const reordered = [...subWorkouts];
    const [removed] = reordered.splice(draggedSubWorkoutIndex, 1);
    reordered.splice(targetIndex, 0, removed);
    setSubWorkouts(reordered);
    setDraggedSubWorkoutIndex(null);
  };

  const moveSubWorkout = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= subWorkouts.length) return;
    const reordered = [...subWorkouts];
    const temp = reordered[index];
    reordered[index] = reordered[targetIndex];
    reordered[targetIndex] = temp;
    setSubWorkouts(reordered);
  };

  // Helper inside adaptLegacyExercise:
  const adaptLegacyExercise = (legacyEx: any): any => {
    const setsCount = parseInt(legacyEx.sets) || 3;
    const loadedSeries: any[] = [];
    for (let i = 0; i < setsCount; i++) {
      loadedSeries.push({
        id: `${Date.now()}-${i}-${Math.random()}`,
        reps: legacyEx.reps || "12",
        weight: ""
      });
    }
    return {
      id: legacyEx.id || `${Date.now()}-${Math.random()}`,
      name: legacyEx.name || "Exercício",
      category: "GERAL",
      setsCount: setsCount,
      series: loadedSeries,
      seriesForm: "Repetição",
      loadConfig: "Kg",
      rest: parseInt(legacyEx.rest) || 60,
      videoUrl: "",
      notes: legacyEx.notes || ""
    };
  };

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
      <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
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
        <div className="hidden md:flex flex-col gap-4">
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
      <div className="hidden md:flex flex-col gap-4">
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
            <button onClick={() => setIsCreatingEvent(true)} className="flex h-10 items-center justify-center gap-2 overflow-hidden rounded-lg px-4 bg-primary text-background-dark text-sm font-bold leading-normal shadow-lg shadow-primary/20 hover:brightness-110 transition-all">
              <span className="material-symbols-outlined text-[18px]">add</span>
              Novo Agendamento
            </button>
          </header>

          {isCreatingEvent && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-card-dark border border-border-dark w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95">
                <div className="flex items-center justify-between p-4 border-b border-border-dark bg-background-dark/50">
                  <h3 className="text-white font-bold tracking-tight">{editingEventId ? 'Editar Agendamento' : 'Novo Agendamento'}</h3>
                  <button onClick={() => { setIsCreatingEvent(false); setEditingEventId(null); }} className="text-text-secondary hover:text-white transition-colors">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
                <div className="p-6 flex flex-col gap-4">
                  <input type="text" placeholder="Título (ex: Consulta Marcos)" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} className="w-full h-12 bg-background-dark border border-border-dark rounded-xl px-4 text-white" />
                  <select value={newEvent.type} onChange={e => setNewEvent({...newEvent, type: e.target.value})} className="w-full h-12 bg-background-dark border border-border-dark rounded-xl px-4 text-white">
                      <option>Consultoria</option>
                      <option>Retorno</option>
                      <option>Avaliação Presencial</option>
                      <option>Outro</option>
                  </select>
                  <input type="date" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} className="w-full h-12 bg-background-dark border border-border-dark rounded-xl px-4 text-white" />
                  <input type="time" value={newEvent.time} onChange={e => setNewEvent({...newEvent, time: e.target.value})} className="w-full h-12 bg-background-dark border border-border-dark rounded-xl px-4 text-white" />
                  <button onClick={async () => {
                     const eventData = {
                       ...newEvent,
                       date: new Date(newEvent.date),
                       trainerId: user.id,
                       status: 'Agendado',
                       color: 'bg-primary/10 text-primary border-primary/20'
                     };
                     if (editingEventId) {
                        await dataService.updateAgendaEvent(editingEventId, eventData);
                     } else {
                        await dataService.createAgendaEvent(eventData);
                     }
                     setIsCreatingEvent(false);
                     setEditingEventId(null);
                     setNewEvent({ title: '', type: 'Consultoria', date: new Date().toISOString().split('T')[0], time: '10:00' });
                  }} className="w-full h-12 bg-primary text-background-dark font-bold rounded-xl mt-2">
                    {editingEventId ? 'Atualizar Agendamento' : 'Salvar Agendamento'}
                  </button>
                </div>
              </div>
            </div>
          )}

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
                            <div className="flex items-center gap-1">
                              {deletingEventId === evt.id ? (
                                <>
                                  <span
                                    title="Confirmar exclusão"
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      await dataService.deleteAgendaEvent(evt.id);
                                      setDeletingEventId(null);
                                    }}
                                    className="material-symbols-outlined text-[14px] cursor-pointer text-red-500 hover:text-red-400 font-bold"
                                  >
                                    check
                                  </span>
                                  <span
                                    title="Cancelar"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeletingEventId(null);
                                    }}
                                    className="material-symbols-outlined text-[14px] cursor-pointer text-text-secondary hover:text-white"
                                  >
                                    close
                                  </span>
                                </>
                              ) : (
                                <>
                                  <span
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setNewEvent({ title: evt.title, type: evt.type, date: format(evt.date, 'yyyy-MM-dd'), time: evt.time });
                                      setEditingEventId(evt.id);
                                      setIsCreatingEvent(true);
                                    }}
                                    className="material-symbols-outlined text-[14px] cursor-pointer hover:text-white"
                                  >
                                    edit
                                  </span>
                                  <span
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeletingEventId(evt.id);
                                    }}
                                    className="material-symbols-outlined text-[14px] cursor-pointer hover:text-red-500"
                                  >
                                    delete
                                  </span>
                                </>
                              )}
                            </div>
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

  const renderStudents = () => {
    const linkWorkoutModal = linkingWorkoutStudent && (
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
                value={selectedWorkoutToLink || ""}
                onChange={(e) => setSelectedWorkoutToLink(e.target.value)}
                className="w-full h-12 bg-background-dark border border-border-dark rounded-xl px-4 text-white focus:border-primary focus:outline-none transition-colors appearance-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 1rem center",
                  backgroundSize: "1.2em"
                }}
              >
                <option value="" disabled>Escolha uma ficha...</option>
                {workouts.filter(w => !w.studentIds || w.studentIds.length === 0).map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
                {workouts.filter(w => !w.studentIds || w.studentIds.length === 0).length === 0 && (
                  <option value="" disabled>Nenhuma ficha modelo disponível. Crie uma ficha primeiro.</option>
                )}
              </select>
            </div>

            <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-border-dark">
              <button
                onClick={() => {
                  setEditingWorkoutId("new");
                  setPreAssignedStudentId(linkingWorkoutStudent.id);
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
                      window.open(`https://wa.me/${linkingWorkoutStudent.phone || ""}?text=Olá ${linkingWorkoutStudent.name}, seu novo treino '${workoutName}' já está disponível no app!`, "_blank");
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
    );

    const renderBlankWorkoutSetup = () => {
      const student = mobileSelectedStudent;
      if (!student) return null;

      return (
        <div className="flex flex-col gap-6 w-full mx-auto max-w-7xl px-0 animate-in slide-in-from-right-8 duration-300 pb-32 relative">
          {/* Title and Back Trigger - Centered on Mobile */}
          <div className="relative flex items-center justify-center w-full min-h-[44px] px-12 mb-2">
            <button 
              onClick={() => {
                setIsSettingUpBlankWorkout(false);
                setIsBottomSheetOpen(true);
              }}
              className="absolute left-0 size-10 flex items-center justify-center rounded-xl bg-white/5 text-text-secondary hover:text-white transition-all active:scale-95 border border-white/5 shadow-md shrink-0"
            >
              <span className="material-symbols-outlined text-xl">arrow_back_ios_new</span>
            </button>
            <h1 className="text-white font-black text-xl tracking-tight text-center">Nova ficha de treinos</h1>
          </div>

          <div className="bg-card-dark border border-border-dark p-6 rounded-2xl flex flex-col gap-6 shadow-md transition-all">
            <div className="flex items-center gap-3 border-b border-border-dark pb-4">
              <img src={student.img} className="size-10 rounded-full object-cover border border-border-dark" />
              <div>
                <p className="text-xs text-text-secondary">Criando ficha para o aluno</p>
                <h3 className="text-white font-bold text-sm uppercase">{student.name}</h3>
              </div>
            </div>

            {/* Seção 1: Nome da ficha */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-primary">label</span>
                Escolha o nome da ficha de treino
              </label>
              <input
                type="text"
                value={blankWorkoutName}
                onChange={(e) => setBlankWorkoutName(e.target.value)}
                placeholder="Ex: Treino ABC, Hipertrofia Masculina, etc."
                className="w-full h-12 bg-background-dark border border-border-dark rounded-xl px-4 text-white placeholder:text-text-secondary/40 focus:border-primary focus:outline-none transition-colors"
              />
              <p className="text-[10px] text-text-secondary/70">O nome informado será utilizado automaticamente como nome da ficha criada e você poderá editá-lo depois se preferir.</p>
            </div>

            {/* Seção 2: Quantas vezes por semana */}
            <div className="flex flex-col gap-3">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-primary">calendar_month</span>
                Quantas vezes por semana o aluno fará essa ficha de treino?
              </label>
              <div className="flex flex-row flex-nowrap items-center justify-center gap-2.5 overflow-x-auto scrollbar-none pb-2 pt-1 max-w-full px-1">
                {[1, 2, 3, 4, 5, 6, 7].map((d) => {
                  const isSelected = blankWorkoutDays === d;
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setBlankWorkoutDays(d)}
                      className={`size-12 rounded-full flex items-center justify-center font-black text-base transition-all duration-150 border shrink-0 cursor-pointer active:scale-90 select-none ${
                        isSelected
                          ? "bg-primary text-background-dark border-primary shadow-lg shadow-primary/30 font-black scale-105"
                          : "bg-background-dark text-text-secondary border-border-dark hover:border-text-secondary/30 hover:text-white"
                      }`}
                      title={`${d} ${d === 1 ? 'dia' : 'dias'} por semana`}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Action Button - Bottom Fixed */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-background-dark/95 backdrop-blur-md border-t border-border-dark z-50 flex justify-center pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <div className="w-full max-w-md">
              <button
                onClick={() => {
                  const letters = ["A", "B", "C", "D", "E", "F", "G"];
                  const subs = Array.from({ length: blankWorkoutDays }).map((_, idx) => ({
                    id: letters[idx],
                    name: `Treino ${letters[idx]}`,
                    exercises: []
                  }));
                  
                  // Initialize workouts editor state
                  setSubWorkouts(subs);
                  setWorkoutName(blankWorkoutName.trim() || `Treino de ${student.name}`);
                  setPreAssignedStudentId(student.id);
                  setEditingWorkoutId("new");
                  setWorkoutEditorStep("ficha");
                  setActiveSubWorkoutIndex(null);
                  
                  // Navigate to Workouts tab
                  setActiveTab("workouts");

                  // Clean up mobile wizard
                  setIsSettingUpBlankWorkout(false);
                  setIsCreatingWorkoutForStudentFlow(false);
                  setMobileSelectedStudent(null);
                }}
                className="w-full h-14 bg-primary text-background-dark rounded-xl font-bold hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-base shadow-lg shadow-primary/25"
              >
                <span className="material-symbols-outlined">rocket_launch</span>
                Criar Estrutura Inicial
              </button>
            </div>
          </div>
        </div>
      );
    };

    const renderSelectModelPage = () => {
      const student = mobileSelectedStudent;
      if (!student) return null;

      // Filter templates (workouts with no assigned student, or simply any saved workout)
      const filteredWorkouts = workouts.filter(w => {
        const isTemplate = !w.studentIds || w.studentIds.length === 0;
        const matchesSearch = w.name?.toLowerCase().includes(modelSearchQuery.toLowerCase());
        return isTemplate && matchesSearch;
      });

      return (
        <div className="flex flex-col gap-6 w-full mx-auto max-w-7xl px-0 animate-in slide-in-from-right-8 duration-300 pb-20 relative">
          {/* Title and Back Trigger - Centered on Mobile */}
          <div className="relative flex items-center justify-center w-full min-h-[44px] px-12 mb-2">
            <button 
              onClick={() => {
                setMobileWorkoutFlowState(null);
                setIsBottomSheetOpen(true);
              }}
              className="absolute left-0 size-10 flex items-center justify-center rounded-xl bg-white/5 text-text-secondary hover:text-white transition-all active:scale-95 border border-white/5 shadow-md shrink-0"
            >
              <span className="material-symbols-outlined text-xl">arrow_back_ios_new</span>
            </button>
            <h1 className="text-white font-black text-xl tracking-tight text-center font-bold">Biblioteca de Fichas</h1>
          </div>

          {/* Search */}
          <div className="flex w-full items-stretch rounded-xl h-11 bg-card-dark border border-border-dark focus-within:border-primary transition-all">
            <div className="text-text-secondary flex items-center justify-center pl-3.5">
              <span className="material-symbols-outlined text-[20px]">search</span>
            </div>
            <input
              className="w-full bg-transparent border-none text-white focus:ring-0 px-2.5 text-xs font-semibold placeholder:text-text-secondary/40"
              placeholder="Buscar ficha modelo por nome..."
              type="text"
              value={modelSearchQuery}
              onChange={(e) => setModelSearchQuery(e.target.value)}
            />
          </div>

          {/* List */}
          <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-1">
            {filteredWorkouts.map((w) => (
              <button
                key={w.id}
                onClick={() => {
                  setWorkoutName(w.name);
                  setSubWorkouts(w.subWorkouts || []);
                  setPreAssignedStudentId(student.id);
                  setEditingWorkoutId("new");
                  setWorkoutEditorStep("ficha");
                  setActiveSubWorkoutIndex(null);
                  
                  // Redirect
                  setActiveTab("workouts");

                  // Clean up mobile wizard
                  setMobileWorkoutFlowState(null);
                  setIsCreatingWorkoutForStudentFlow(false);
                  setMobileSelectedStudent(null);
                }}
                className="w-full bg-card-dark p-4 rounded-xl border border-border-dark hover:border-primary/50 text-left transition-all active:scale-[0.98] flex items-center justify-between gap-4"
              >
                <div className="flex flex-col gap-1 min-w-0 flex-1">
                  <span className="text-white font-black text-sm truncate uppercase">{w.name}</span>
                  <div className="flex items-center gap-3 text-[10px] text-text-secondary uppercase tracking-wider font-bold">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px] text-primary">layers</span>
                      {w.subWorkouts?.length || 0} Treinos (A/B/C)
                    </span>
                  </div>
                </div>
                <div className="size-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center hover:bg-primary/25">
                  <span className="material-symbols-outlined text-lg">content_copy</span>
                </div>
              </button>
            ))}

            {filteredWorkouts.length === 0 && (
              <div className="text-center py-10 bg-card-dark rounded-xl border border-border-dark border-dashed">
                <span className="material-symbols-outlined text-4xl text-text-secondary/30 mb-2">layers_clear</span>
                <p className="text-text-secondary text-xs font-semibold">Nenhuma ficha modelo encontrada na biblioteca.</p>
                <p className="text-[10px] text-text-secondary/60 mt-1">Dica: Crie uma ficha sem aluno e salve para guardá-la na biblioteca.</p>
              </div>
            )}
          </div>
        </div>
      );
    };

    const renderSelectCopyStudentPage = () => {
      const student = mobileSelectedStudent;
      if (!student) return null;

      // Filter workouts with students assigned
      const filteredWorkouts = workouts.filter(w => {
        const isStudentWorkout = w.studentIds && w.studentIds.length > 0;
        const matchesSearch = w.name?.toLowerCase().includes(copySearchQuery.toLowerCase());
        
        // Also matches student names
        const studentNames = getStudentNamesForWorkout(w).toLowerCase();
        const matchesStudentSearch = studentNames.includes(copySearchQuery.toLowerCase());
        
        return isStudentWorkout && (matchesSearch || matchesStudentSearch);
      });

      return (
        <div className="flex flex-col gap-6 w-full mx-auto max-w-7xl px-0 animate-in slide-in-from-right-8 duration-300 pb-20 relative">
          {/* Title and Back Trigger - Centered on Mobile */}
          <div className="relative flex items-center justify-center w-full min-h-[44px] px-12 mb-2">
            <button 
              onClick={() => {
                setMobileWorkoutFlowState(null);
                setIsBottomSheetOpen(true);
              }}
              className="absolute left-0 size-10 flex items-center justify-center rounded-xl bg-white/5 text-text-secondary hover:text-white transition-all active:scale-95 border border-white/5 shadow-md shrink-0"
            >
              <span className="material-symbols-outlined text-xl">arrow_back_ios_new</span>
            </button>
            <h1 className="text-white font-black text-xl tracking-tight text-center font-bold">Fichas de Outros Alunos</h1>
          </div>

          {/* Search */}
          <div className="flex w-full items-stretch rounded-xl h-11 bg-card-dark border border-border-dark focus-within:border-primary transition-all">
            <div className="text-text-secondary flex items-center justify-center pl-3.5">
              <span className="material-symbols-outlined text-[20px]">search</span>
            </div>
            <input
              className="w-full bg-transparent border-none text-white focus:ring-0 px-2.5 text-xs font-semibold placeholder:text-text-secondary/40"
              placeholder="Buscar por nome da ficha ou do aluno..."
              type="text"
              value={copySearchQuery}
              onChange={(e) => setCopySearchQuery(e.target.value)}
            />
          </div>

          {/* List */}
          <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-1">
            {filteredWorkouts.map((w) => {
              const studentNames = getStudentNamesForWorkout(w);
              return (
                <button
                  key={w.id}
                  onClick={() => {
                    setWorkoutName(w.name);
                    setSubWorkouts(w.subWorkouts || []);
                    setPreAssignedStudentId(student.id);
                    setEditingWorkoutId("new");
                    setWorkoutEditorStep("ficha");
                    setActiveSubWorkoutIndex(null);
                    
                    // Redirect
                    setActiveTab("workouts");

                    // Clean up mobile wizard
                    setMobileWorkoutFlowState(null);
                    setIsCreatingWorkoutForStudentFlow(false);
                    setMobileSelectedStudent(null);
                  }}
                  className="w-full bg-card-dark p-4 rounded-xl border border-border-dark hover:border-primary/50 text-left transition-all active:scale-[0.98] flex items-center justify-between gap-4"
                >
                  <div className="flex flex-col gap-1 min-w-0 flex-1">
                    <span className="text-white font-black text-sm truncate uppercase">{w.name}</span>
                    <p className="text-[10px] text-text-secondary/90 font-bold uppercase tracking-wider flex items-center gap-1 mt-0.5">
                      <span className="material-symbols-outlined text-[12px] text-primary">person</span>
                      Aluno: {studentNames}
                    </p>
                    <div className="flex items-center gap-3 text-[10px] text-text-secondary uppercase tracking-widest font-black mt-1">
                      <span className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[12px] text-primary">calendar_today</span>
                        {w.subWorkouts?.length || 0} Segmentos (A/B/C)
                      </span>
                    </div>
                  </div>
                  <div className="size-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center hover:bg-primary/25">
                    <span className="material-symbols-outlined text-lg">content_copy</span>
                  </div>
                </button>
              );
            })}

            {filteredWorkouts.length === 0 && (
              <div className="text-center py-10 bg-card-dark rounded-xl border border-border-dark border-dashed">
                <span className="material-symbols-outlined text-4xl text-text-secondary/30 mb-2">content_copy_off</span>
                <p className="text-text-secondary text-xs font-semibold">Nenhuma ficha ativa de aluno encontrada.</p>
                <p className="text-[10px] text-text-secondary/60 mt-1">Dica: Adicione fichas aos seus alunos para vê-las aqui.</p>
              </div>
            )}
          </div>
        </div>
      );
    };

    if (mobileSelectedStudent) {
      if (isSettingUpBlankWorkout) {
        return renderBlankWorkoutSetup();
      }
      if (mobileWorkoutFlowState === "select_model") {
        return renderSelectModelPage();
      }
      if (mobileWorkoutFlowState === "select_copy_student") {
        return renderSelectCopyStudentPage();
      }

      const student = mobileSelectedStudent;
      const isTrialExpired = student.status !== "Ativa" && student.trialUntil && new Date() > (student.trialUntil?.toDate ? student.trialUntil.toDate() : new Date(student.trialUntil));
      const isTrialActive = student.status !== "Ativa" && student.trialUntil && !isTrialExpired;

      // EDIT PROFILE PAGE FOR MOBILE VIEW ONLY
      if (editingStudentProfile && editingStudentProfile.id === student.id) {
        return (
          <div className="flex flex-col gap-6 w-full mx-auto max-w-7xl px-0 animate-in slide-in-from-right-8 duration-300 pb-32 relative">
            {/* Title and Back Trigger - Centered on Mobile */}
            <div className="relative flex items-center justify-center w-full min-h-[44px] px-12 mb-2">
              <button 
                onClick={() => setEditingStudentProfile(null)}
                className="absolute left-0 size-10 flex items-center justify-center rounded-xl bg-white/5 text-text-secondary hover:text-white transition-all active:scale-95 border border-white/5 shadow-md shrink-0"
              >
                <span className="material-symbols-outlined text-xl">arrow_back_ios_new</span>
              </button>
              <h1 className="text-white font-black text-xl tracking-tight text-center">Dados do Aluno</h1>
            </div>

            <div className="flex flex-col gap-6 w-full">
              {/* Profile Image & Picture URL Input */}
              <div className="flex flex-col items-center gap-4 border-b border-border-dark pb-6">
                <div className="relative group size-24">
                  <img 
                    src={editedStudent?.img || student.img} 
                    alt="Perfil" 
                    className="size-24 rounded-full object-cover border-4 border-primary/20 shadow-md" 
                  />
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="material-symbols-outlined text-white">photo_camera</span>
                  </div>
                </div>
                <div className="w-full flex flex-col gap-1.5">
                  <span className="text-[10px] text-text-secondary uppercase tracking-wider font-bold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-xs">link</span>
                    URL da Foto de Perfil
                  </span>
                  <input
                    type="text"
                    value={editedStudent?.img || ""}
                    onChange={(e) => setEditedStudent(prev => ({ ...prev, img: e.target.value }))}
                    placeholder="https://exemplo.com/foto.jpg"
                    className="bg-background-dark border border-border-dark rounded-xl px-2.5 py-3 md:px-4 text-sm text-white focus:outline-none focus:border-primary transition-colors w-full"
                  />
                </div>
              </div>

              {/* Form Input fields with prefixed icons */}
              <div className="flex flex-col gap-5">
                {/* Nome */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-text-secondary uppercase tracking-wider font-bold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-primary">person</span>
                    Nome Completo
                  </span>
                  <input
                    type="text"
                    value={editedStudent?.name || ""}
                    onChange={(e) => setEditedStudent(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Digite o nome completo"
                    className="bg-background-dark border border-border-dark rounded-xl px-2.5 py-3 md:px-4 text-sm text-white focus:outline-none focus:border-primary transition-colors w-full"
                    required
                  />
                </div>

                {/* CPF */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-text-secondary uppercase tracking-wider font-bold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-primary">badge</span>
                    CPF
                  </span>
                  <input
                    type="text"
                    value={editedStudent?.cpf || ""}
                    onChange={(e) => setEditedStudent(prev => ({ ...prev, cpf: e.target.value }))}
                    placeholder="000.000.000-00"
                    className="bg-background-dark border border-border-dark rounded-xl px-2.5 py-3 md:px-4 text-sm text-white focus:outline-none focus:border-primary transition-colors w-full"
                  />
                </div>

                {/* Data de Nascimento */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-text-secondary uppercase tracking-wider font-bold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-primary">calendar_today</span>
                    Data de Nascimento
                  </span>
                  <input
                    type="text"
                    value={editedStudent?.birthDate || ""}
                    onChange={(e) => setEditedStudent(prev => ({ ...prev, birthDate: e.target.value }))}
                    placeholder="DD/MM/AAAA"
                    className="bg-background-dark border border-border-dark rounded-xl px-2.5 py-3 md:px-4 text-sm text-white focus:outline-none focus:border-primary transition-colors w-full"
                  />
                </div>

                {/* Gênero */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-text-secondary uppercase tracking-wider font-bold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-primary">wc</span>
                    Gênero
                  </span>
                  <select
                    value={editedStudent?.gender || ""}
                    onChange={(e) => setEditedStudent(prev => ({ ...prev, gender: e.target.value }))}
                    className="bg-background-dark border border-border-dark rounded-xl px-2.5 py-3 md:px-4 text-sm text-white focus:outline-none focus:border-primary transition-colors w-full appearance-none cursor-pointer"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 1rem center',
                      backgroundSize: '1.2em'
                    }}
                  >
                    <option value="">Selecione o gênero</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Feminino">Feminino</option>
                    <option value="Outro">Outro / Prefiro não dizer</option>
                  </select>
                </div>

                {/* Telefone */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-text-secondary uppercase tracking-wider font-bold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-primary">call</span>
                    Telefone
                  </span>
                  <input
                    type="tel"
                    value={editedStudent?.phone || ""}
                    onChange={(e) => setEditedStudent(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(00) 00000-0000"
                    className="bg-background-dark border border-border-dark rounded-xl px-2.5 py-3 md:px-4 text-sm text-white focus:outline-none focus:border-primary transition-colors w-full"
                  />
                </div>

                {/* E-mail */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-text-secondary uppercase tracking-wider font-bold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-primary">mail</span>
                    E-mail
                  </span>
                  <input
                    type="email"
                    value={editedStudent?.email || ""}
                    onChange={(e) => setEditedStudent(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="exemplo@email.com"
                    className="bg-background-dark border border-border-dark rounded-xl px-2.5 py-3 md:px-4 text-sm text-white focus:outline-none focus:border-primary transition-colors w-full"
                  />
                </div>

                {/* Observações */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-text-secondary uppercase tracking-wider font-bold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-primary">description</span>
                    Observações
                  </span>
                  <textarea
                    value={editedStudent?.observations || ""}
                    onChange={(e) => setEditedStudent(prev => ({ ...prev, observations: e.target.value }))}
                    placeholder="Digite observações sobre o aluno (comorbidades, restrições, etc.)"
                    className="bg-background-dark border border-border-dark rounded-xl px-2.5 py-3 md:px-4 text-sm text-white focus:outline-none focus:border-primary transition-colors w-full h-28 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Save Button - Fixed permanently at the bottom of the screen */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background-dark/95 backdrop-blur-md border-t border-border-dark z-50 flex justify-center pb-[calc(1rem+env(safe-area-inset-bottom))]">
              <div className="w-full max-w-7xl">
                <button
                  onClick={handleSaveEditedStudent}
                  className="w-full h-14 bg-primary text-background-dark rounded-xl font-bold hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-base shadow-lg shadow-primary/25"
                >
                  <span className="material-symbols-outlined">save</span>
                  Salvar Alterações
                </button>
              </div>
            </div>
          </div>
        );
      }

      return (
        <>
          <div className={`flex flex-col gap-6 w-full mx-auto max-w-7xl px-0 animate-in slide-in-from-right-8 duration-300 pb-20 relative ${isCreatingWorkoutForStudentFlow && isBottomSheetOpen ? "blur-sm pointer-events-none" : ""}`}>
            
            {/* Green Hero Section under the card and buttons */}
            <div className="absolute top-0 left-0 right-0 h-[280px] bg-primary -mx-4 -mt-4 rounded-b-[2.5rem] z-0 overflow-hidden border-b border-primary">
            </div>
            
            {/* Header row containing page title and back button outside card - Centered on Mobile */}
            <div className="relative z-10 flex items-center justify-center w-full min-h-[44px] px-12 mb-2">
              <button 
                onClick={() => setMobileSelectedStudent(null)}
                className="absolute left-0 size-10 flex items-center justify-center rounded-xl bg-background-dark/10 text-background-dark hover:bg-background-dark/20 transition-all active:scale-95 border border-background-dark shadow-sm shrink-0 font-bold"
              >
                <span className="material-symbols-outlined text-xl font-bold">arrow_back_ios_new</span>
              </button>
              <h1 className="text-background-dark font-black text-xl tracking-tight text-center">Perfil do Aluno</h1>
            </div>

          {/* Main Card with status, name, avatar */}
          <div className="relative z-10 flex items-center justify-between gap-4 bg-card-dark/80 backdrop-blur-md px-2.5 py-4 md:px-6 md:py-6 rounded-xl border-[3px] border-background-dark shadow-md">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <img src={student.img} alt={student.name} className="size-14 rounded-xl object-cover border-2 border-border-dark" />
              <div className="flex flex-col min-w-0">
                <h2 className="text-white font-black text-base leading-tight uppercase tracking-tight truncate">{student.name}</h2>
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider w-fit mt-1.5 ${
                    student.status === "Ativa"
                      ? "bg-primary/10 text-primary ring-1 ring-primary/20"
                      : isTrialActive
                        ? "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20"
                        : "bg-red-500/10 text-red-500 ring-1 ring-red-500/20 border-red-500/30"
                  }`}
                >
                  <span className={`size-1.5 rounded-full ${student.status === "Ativa" ? "bg-primary animate-pulse" : isTrialActive ? "bg-amber-400 animate-pulse" : "bg-red-500"}`}></span>
                  {student.status === "Ativa" ? "Ativa" : isTrialActive ? "Em Trial" : "Bloqueado"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            
            {/* Action Buttons reorganized - Horizontal line of icons only */}
            <div className="relative z-10 flex justify-center gap-4 w-full">
              {/* Message button */}
              <button
                onClick={async () => {
                  try {
                    await chatService.getOrCreateChat(user.id, student.id);
                    setChatInitialStudentId(student.id);
                    setChatBackToStudent(student);
                    setActiveTab('chat');
                    setMobileSelectedStudent(null);
                  } catch (e) {
                    console.error(e);
                  }
                }}
                className="w-20 h-12 flex items-center justify-center rounded-xl bg-background-dark/10 text-background-dark border border-background-dark active:scale-95 transition-all shadow-sm hover:bg-background-dark/20"
                title="Mensagem"
              >
                <span className="material-symbols-outlined font-bold text-xl">forum</span>
              </button>

              {/* Edit button */}
              <button
                onClick={() => setEditingStudentProfile(student)}
                className="w-20 h-12 flex items-center justify-center rounded-xl bg-background-dark/10 text-background-dark border border-background-dark active:scale-95 transition-all shadow-sm hover:bg-background-dark/20"
                title="Editar Aluno"
              >
                <span className="material-symbols-outlined font-bold text-xl">edit</span>
              </button>

              {/* Physical Evaluation progress */}
              <button
                onClick={() => setAddingEvaluationStudent(student)}
                className="w-20 h-12 flex items-center justify-center rounded-xl bg-background-dark/10 text-background-dark border border-background-dark active:scale-95 transition-all shadow-sm hover:bg-background-dark/20"
                title="Avaliação"
              >
                <span className="material-symbols-outlined font-bold text-xl">monitor_weight</span>
              </button>
            </div>

            {/* Edge-to-Edge Carousel of Workouts & Add Workout integration */}
            <div className="flex flex-col gap-3 mt-14 pr-0 mr-0">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-bold text-sm uppercase tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[18px]">fitness_center</span>
                  Treinos Vinculados
                </h3>
                {/* Small compact link trigger directly beside "Treinos Vinculados" label */}
                <button
                  onClick={() => setLinkingWorkoutStudent(student)}
                  className="size-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center active:scale-95 transition-all shadow-sm hover:bg-blue-500/20 font-bold"
                  title="Vincular Novo Treino"
                >
                  <span className="material-symbols-outlined text-lg">add</span>
                </button>
              </div>

              {/* Vertical list layout for mobile workouts */}
              <div className="flex flex-col gap-3 w-full">
                {workouts.filter(w => w.studentIds?.includes(student.id)).length > 0 ? (
                  workouts.filter(w => w.studentIds?.includes(student.id)).map(w => {
                    const isAtivo = (w.studentStatuses?.[student.id] || "Ativo") === "Ativo";
                    return (
                      <div
                        key={w.id}
                        onClick={() => {
                          setMobileSelectedStudent(null);
                          startEditingWorkout(w);
                          setActiveTab('workouts');
                        }}
                        className="w-full bg-card-dark px-2.5 py-4 md:px-6 md:py-6 rounded-xl border border-border-dark flex items-center justify-between hover:border-primary/50 transition-colors shadow-lg cursor-pointer animate-none"
                      >
                        <span className="text-white font-bold text-sm truncate pr-2">{w.name}</span>
                        
                        <div className="flex items-center gap-2">
                          {/* Manual status choice/badge */}
                          <button
                            onClick={(e) => toggleWorkoutStatus(w, student.id, e)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-colors border shadow-sm shrink-0 ${
                              isAtivo 
                                ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20" 
                                : "bg-white/5 text-text-secondary border-white/10 hover:bg-white/10"
                            }`}
                          >
                            <span className={`size-1.5 rounded-full ${isAtivo ? "bg-primary animate-pulse" : "bg-text-secondary"}`}></span>
                            {isAtivo ? "Ativo" : "Finalizado"}
                          </button>
                          <span className="material-symbols-outlined text-text-secondary shrink-0 select-none">chevron_right</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="w-full bg-card-dark/40 py-4 px-2.5 md:px-6 rounded-xl border border-border-dark/20 text-center">
                    <p className="text-text-secondary text-xs italic">Nenhum treino vinculado.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Evolução Física */}
            <div className="bg-card-dark px-2.5 py-4 md:px-5 md:py-5 rounded-xl border border-border-dark flex flex-col shadow-sm">
              <h3 className="text-white font-bold text-sm uppercase tracking-widest border-b border-border-dark pb-2 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">analytics</span>
                Evolução Física
              </h3>
              
              {selectedStudentProgress.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {selectedStudentProgress.map((record: any, idx: number) => (
                    <div key={record.id || idx} className="bg-background-dark border border-border-dark px-2 py-3 md:px-3 md:py-3 rounded-xl flex flex-col gap-2">
                       <div className="flex justify-between items-center border-b border-white/5 pb-2">
                         <span className="text-white font-black text-sm">{record.date?.toDate ? record.date.toDate().toLocaleDateString('pt-BR') : new Date(record.date).toLocaleDateString('pt-BR')}</span>
                         <span className="text-primary font-black">{record.weight ? `${record.weight}kg` : '-'}</span>
                       </div>
                       <div className="grid grid-cols-3 gap-2 mt-1">
                         <div className="flex flex-col">
                           <span className="text-[9px] text-text-secondary uppercase font-bold">Gordura</span>
                           <span className="text-white text-xs">{record.bodyFat ? `${record.bodyFat}%` : '-'}</span>
                         </div>
                         <div className="flex flex-col">
                           <span className="text-[9px] text-text-secondary uppercase font-bold">Peito</span>
                           <span className="text-white text-xs">{record.chest || '-'}</span>
                         </div>
                         <div className="flex flex-col">
                           <span className="text-[9px] text-text-secondary uppercase font-bold">Braços</span>
                           <span className="text-white text-xs">{record.arms || '-'}</span>
                         </div>
                         <div className="flex flex-col">
                           <span className="text-[9px] text-text-secondary uppercase font-bold">Cintura</span>
                           <span className="text-white text-xs">{record.waist || '-'}</span>
                         </div>
                         <div className="flex flex-col">
                           <span className="text-[9px] text-text-secondary uppercase font-bold">Quadril</span>
                           <span className="text-white text-xs">{record.hips || '-'}</span>
                         </div>
                         <div className="flex flex-col">
                           <span className="text-[9px] text-text-secondary uppercase font-bold">Coxas</span>
                           <span className="text-white text-xs">{record.thighs || '-'}</span>
                         </div>
                       </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-text-secondary text-sm italic text-center py-4 bg-background-dark rounded-xl border border-border-dark/50">Nenhuma medida registrada.</p>
              )}
            </div>

            {/* Plan/Access section - REPOSITIONED BELOW PHYSICAL EVOLUTION */}
            <div className="bg-card-dark px-2.5 py-4 md:px-5 md:py-5 rounded-xl border border-border-dark flex flex-col gap-4 shadow-sm">
              <h3 className="text-white font-bold text-sm uppercase tracking-widest border-b border-border-dark pb-2 mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">workspace_premium</span>
                Plano / Acesso
              </h3>
              
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-text-secondary uppercase tracking-wider font-bold mb-1">Atribuir Plano</span>
                <select 
                  value={student.plan || ''}
                  onChange={(e) => handleUpdateStudentPlan(student.id, e.target.value)}
                  className="bg-background-dark border border-border-dark rounded-xl px-2.5 py-3 md:px-3 text-sm text-white focus:outline-none focus:border-primary transition-colors w-full cursor-pointer appearance-none animate-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 1rem center',
                    backgroundSize: '1.2em'
                  }}
                >
                  <option value="">Nenhum plano</option>
                  {trainerCustomPlans.map(tp => (
                    <option key={tp.id} value={tp.name}>
                      {tp.name} {tp.hiddenGlobal ? '(Oculto)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-text-secondary uppercase tracking-wider font-bold mb-1">Expiração do Acesso</span>
                <input
                  type="date"
                  value={student.expDate || ''}
                  onChange={(e) => handleUpdateStudentExpDate(student.id, e.target.value)}
                  className="bg-background-dark border border-border-dark rounded-xl px-2.5 py-3 md:px-3 text-sm text-primary font-bold shadow-inner focus:outline-none focus:border-primary transition-colors cursor-pointer w-full [&::-webkit-calendar-picker-indicator]:invert"
                />
              </div>

              <div className="flex flex-col gap-2 mt-2 pt-4 border-t border-border-dark">
                <span className="text-[10px] text-text-secondary uppercase tracking-wider font-bold">Controle de Acesso</span>
                <div className="grid grid-cols-2 gap-2">
                   <button
                     onClick={() => {
                        dataService.updateUser(student.id, { status: "Bloqueado" });
                        setStudentsData(prev => prev.map(s => s.id === student.id ? { ...s, status: "Bloqueado" } : s));
                     }}
                     disabled={student.status === "Bloqueado"}
                     className={`flex items-center justify-center gap-2 px-2 py-3 md:p-3 rounded-xl font-bold border transition-all ${student.status === "Bloqueado" ? "bg-red-500/20 text-red-500 border-red-500/30 opacity-50" : "bg-white/5 text-white border-white/10 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20"}`}
                   >
                     <span className="material-symbols-outlined text-sm">lock</span>
                     Bloquear
                   </button>
                   <button
                     onClick={() => {
                        dataService.updateUser(student.id, { status: "Ativa" });
                        setStudentsData(prev => prev.map(s => s.id === student.id ? { ...s, status: "Ativa" } : s));
                     }}
                     disabled={student.status === "Ativa"}
                     className={`flex items-center justify-center gap-2 px-2 py-3 md:p-3 rounded-xl font-bold border transition-all ${student.status === "Ativa" ? "bg-primary/20 text-primary border-primary/30 opacity-50" : "bg-white/5 text-white border-white/10 hover:bg-primary/10 hover:text-primary hover:border-primary/20"}`}
                   >
                     <span className="material-symbols-outlined text-sm">lock_open</span>
                     Liberar
                   </button>
                </div>
              </div>

              {student.status !== "Ativa" && (
                <button
                  onClick={() => handleExtendTrial(student.id)}
                  className="flex items-center justify-center gap-2 h-12 mt-2 bg-amber-500/10 text-amber-500 rounded-xl font-bold border border-amber-500/20 active:scale-95 transition-transform"
                >
                  <span className="material-symbols-outlined">history</span>
                  Prorrogar 24h de Acesso (Trial)
                </button>
              )}
            </div>

            {/* Remove */}
            <button
               onClick={(e) => {
                 setStudentToUnlink({ id: student.id, name: student.name });
               }}
               className="flex items-center justify-center gap-2 h-12 mt-4 bg-red-500/10 text-red-500 rounded-xl font-bold border border-red-500/20 active:scale-95 transition-transform"
             >
               <span className="material-symbols-outlined">person_remove</span>
               Remover Vínculo com Aluno
             </button>
          </div>
        </div>
        {isCreatingWorkoutForStudentFlow && isBottomSheetOpen && (
          <div className="fixed inset-0 z-[1100] flex items-end justify-center bg-black/40 backdrop-blur-none animate-in fade-in duration-300">
             {/* Click outdoor of Bottom Sheet dismisses it and returns to students list */}
             <div className="absolute inset-0" onClick={() => {
               setIsBottomSheetOpen(false);
               setIsCreatingWorkoutForStudentFlow(false);
               setMobileSelectedStudent(null);
             }} />

             {/* Bottom sheet content */}
             <div className="relative w-full sm:max-w-md bg-card-dark border-t border-border-dark rounded-t-[2.5rem] p-6 pb-20 flex flex-col gap-6 z-10 animate-in slide-in-from-bottom duration-300 shadow-[0_-8px_30px_rgba(0,0,0,0.8)]">
                {/* Handle bar indicator to reinforce aesthetic */}
                <div className="mx-auto w-12 h-1.5 bg-white/10 rounded-full mb-1" />

                {/* Centered highlighted title requested by user */}
                <div className="text-center border-b border-border-dark pb-4 flex flex-col items-center gap-1">
                  <h3 className="text-white uppercase italic font-black text-lg tracking-tight">Selecione o tipo</h3>
                  <div className="h-1 w-12 bg-primary rounded-full mt-1 animate-pulse" />
                  <p className="text-xs text-text-secondary mt-1 font-semibold">para o aluno: <span className="text-white uppercase font-bold">{student.name}</span></p>
                </div>

                <div className="flex flex-col gap-3">
                  {/* Action 1: Ficha em branco */}
                  <button
                    onClick={() => {
                      setIsBottomSheetOpen(false);
                      setBlankWorkoutName("");
                      setBlankWorkoutDays(3);
                      setIsSettingUpBlankWorkout(true);
                    }}
                    className="w-full bg-white/5 border border-white/5 hover:border-primary/50 text-white rounded-2xl p-4 flex items-center gap-4 transition-all active:scale-[0.98] text-left shadow-lg"
                  >
                    <div className="size-11 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                      <span className="material-symbols-outlined font-black text-xl">add_circle</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-white leading-tight">Ficha em branco</span>
                      <span className="text-[10px] text-text-secondary/70 mt-0.5">Crie uma ficha do zero</span>
                    </div>
                  </button>

                  {/* Action 2: Baseada em um modelo */}
                  <button
                    onClick={() => {
                      setIsBottomSheetOpen(false);
                      setModelSearchQuery("");
                      setMobileWorkoutFlowState("select_model");
                    }}
                    className="w-full bg-white/5 border border-white/5 hover:border-primary/50 text-white rounded-2xl p-4 flex items-center gap-4 transition-all active:scale-[0.98] text-left shadow-lg"
                  >
                    <div className="size-11 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                      <span className="material-symbols-outlined font-black text-xl">layers</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-white leading-tight">Baseada em um modelo</span>
                      <span className="text-[10px] text-text-secondary/70 mt-0.5">Escolha uma da biblioteca de treinos e copie para o aluno</span>
                    </div>
                  </button>

                  {/* Action 3: Copiar ficha de outro aluno */}
                  <button
                    onClick={() => {
                      setIsBottomSheetOpen(false);
                      setCopySearchQuery("");
                      setMobileWorkoutFlowState("select_copy_student");
                    }}
                    className="w-full bg-white/5 border border-white/5 hover:border-primary/50 text-white rounded-2xl p-4 flex items-center gap-4 transition-all active:scale-[0.98] text-left shadow-lg"
                  >
                    <div className="size-11 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                      <span className="material-symbols-outlined font-black text-xl">content_copy</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-white leading-tight">Copiar ficha de outro aluno</span>
                      <span className="text-[10px] text-text-secondary/70 mt-0.5">Copie a ficha de um aluno que já tenha uma ficha pronta</span>
                    </div>
                  </button>
                </div>
             </div>
          </div>
        )}
        {linkWorkoutModal}
      </>
      );
    }

    return (
      <div className="flex flex-col gap-6 w-full max-w-full overflow-hidden animate-in fade-in duration-500 pb-20 relative">
      {linkWorkoutModal}

      {/* Page Heading matching AdminTrainers */}
      <div className="flex justify-between items-start gap-4 mb-4 md:mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white uppercase italic tracking-tighter">
            <span className="md:hidden">
              {isCreatingWorkoutForStudentFlow ? "Nova ficha de treino" : "Gestão de Alunos"}
            </span>
            <span className="hidden md:inline">Gestão de Alunos</span>
          </h1>
        </div>
        <button
          onClick={() => setActiveTab("add-student")}
          className="flex items-center justify-center gap-2 h-10 w-10 md:w-auto md:px-6 bg-primary text-background-dark rounded-xl md:rounded-lg text-sm font-black shadow-[0_4px_20px_rgba(var(--color-primary),0.3)] hover:scale-105 transition-transform shrink-0"
          title="Novo Aluno"
        >
          <span className="material-symbols-outlined font-black text-lg md:text-sm">add</span>
          <span className="hidden md:inline">NOVO ALUNO</span>
        </button>
      </div>

      {/* Toolbar & Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-4 w-full max-w-full overflow-hidden">
        <div className="flex-1 w-full max-w-full">
          <div className="flex w-full items-stretch rounded-xl h-11 md:h-12 bg-card-dark border border-border-dark focus-within:border-primary transition-all">
            <div className="text-text-secondary flex items-center justify-center pl-3.5 md:pl-4">
              <span className="material-symbols-outlined text-[20px]">search</span>
            </div>
            <input
              className="w-full bg-transparent border-none text-white focus:ring-0 px-2.5 md:px-3 text-xs md:text-sm font-medium placeholder:text-text-secondary/50"
              placeholder="Buscar aluno por nome ou e-mail..."
              type="text"
              value={searchTerm || ''}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto w-full max-w-full pb-1 scrollbar-none shrink-0 md:mx-0 md:px-0">
          {["Todas", "Ativa", "Vencida", "Cancelada"].map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`flex h-10 md:h-12 items-center gap-x-1.5 rounded-xl px-4 text-[10px] md:text-xs font-bold uppercase tracking-wider md:tracking-widest shrink-0 transition-all ${
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
      <div className="hidden md:block overflow-hidden rounded-2xl border border-border-dark bg-card-dark shadow-xl">
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
                            className="hidden" href=""
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
                            className="size-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center active:scale-95 transition-all shadow-sm hover:bg-blue-500/20 font-bold"
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

                              <div className="mt-3">
                                <p className="text-[10px] text-text-secondary uppercase tracking-widest font-bold mb-1">
                                  Controle de Acesso
                                </p>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => {
                                      dataService.updateUser(student.id, { status: "Bloqueado" });
                                      setStudentsData(prev => prev.map(s => s.id === student.id ? { ...s, status: "Bloqueado" } : s));
                                    }}
                                    disabled={student.status === "Bloqueado"}
                                    title="Bloquear Acesso"
                                    className={`flex-1 h-8 rounded-md flex items-center justify-center border transition-all ${student.status === "Bloqueado" ? "bg-red-500/10 text-red-500/50 border-red-500/20 cursor-not-allowed" : "bg-white/5 text-text-secondary hover:text-red-500 hover:bg-red-500/10 border-white/10 hover:border-red-500/20"}`}
                                  >
                                    <span className="material-symbols-outlined text-[16px]">lock</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      dataService.updateUser(student.id, { status: "Ativa" });
                                      setStudentsData(prev => prev.map(s => s.id === student.id ? { ...s, status: "Ativa" } : s));
                                    }}
                                    disabled={student.status === "Ativa"}
                                    title="Liberar Acesso"
                                    className={`flex-1 h-8 rounded-md flex items-center justify-center border transition-all ${student.status === "Ativa" ? "bg-primary/10 text-primary/50 border-primary/20 cursor-not-allowed" : "bg-white/5 text-text-secondary hover:text-primary hover:bg-primary/10 border-white/10 hover:border-primary/20"}`}
                                  >
                                    <span className="material-symbols-outlined text-[16px]">lock_open</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2 md:col-span-1">
                              <p className="text-[10px] text-text-secondary uppercase tracking-widest font-bold mb-0 md:mb-1">
                                Ações Rápidas
                              </p>
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  onClick={async () => {
                                    try {
                                      await chatService.getOrCreateChat(user.id, student.id);
                                      setActiveTab('chat');
                                    } catch (e) {
                                      console.error(e);
                                    }
                                  }}
                                  title="Enviar Mensagem"
                                  className="flex items-center justify-center gap-1 w-full h-8 px-2 bg-purple-500/10 text-purple-400 rounded-md font-bold text-[10px] hover:bg-purple-500 hover:text-white transition-colors border border-purple-500/20"
                                >
                                  <span className="material-symbols-outlined text-[14px]">forum</span>
                                  Chat
                                </button>
                                <button 
                                  onClick={() => setLinkingWorkoutStudent(student)}
                                  title="Vincular Novo Treino"
                                  className="flex items-center justify-center gap-1 w-full h-8 px-2 bg-blue-500/10 text-blue-400 rounded-md font-bold text-[10px] hover:bg-blue-500 hover:text-white transition-colors border border-blue-500/20"
                                >
                                  <span className="material-symbols-outlined text-[14px]">fitness_center</span>
                                  Treino
                                </button>
                                <button
                                  onClick={() => setEditingStudentProfile(student)}
                                  title="Editar Perfil"
                                  className="flex items-center justify-center gap-1 w-full h-8 px-2 bg-white/5 text-white rounded-md font-bold text-[10px] hover:bg-white/10 transition-colors border border-white/10"
                                >
                                  <span className="material-symbols-outlined text-[14px]">edit</span>
                                  Editar
                                </button>
                                <button
                                  onClick={() => setAddingEvaluationStudent(student)}
                                  title="Nova Avaliação Física"
                                  className="flex items-center justify-center gap-1 w-full h-8 px-2 bg-orange-500/10 text-orange-400 rounded-md font-bold text-[10px] hover:bg-orange-500 hover:text-white transition-colors border border-orange-500/20"
                                >
                                  <span className="material-symbols-outlined text-[14px]">monitor_weight</span>
                                  Avaliação
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="mt-8 animate-in fade-in slide-in-from-top-4 duration-500">
                             <div className="flex justify-between items-center mb-4">
                               <h4 className="text-white font-bold flex items-center gap-2">
                                 <span className="material-symbols-outlined text-primary">fitness_center</span>
                                 Treinos Vinculados
                               </h4>
                               <button
                                 onClick={() => setLinkingWorkoutStudent(student)}
                                 className="size-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center active:scale-95 transition-all shadow-sm hover:bg-blue-500/20 font-bold"
                                 title="Vincular Novo Treino"
                               >
                                 <span className="material-symbols-outlined text-lg">add</span>
                               </button>
                             </div>
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                               {workouts.filter(w => w.studentIds?.includes(student.id)).length > 0 ? (
                                  workouts.filter(w => w.studentIds?.includes(student.id)).map(w => (
                                     <button
                                       key={w.id}
                                       onClick={() => {
                                         startEditingWorkout(w);
                                         setActiveTab('workouts');
                                       }}
                                       className="flex items-center justify-between bg-background-dark p-3 rounded-xl border border-border-dark hover:border-primary/50 transition-colors"
                                     >
                                        <span className="text-white font-bold text-sm truncate">{w.name}</span>
                                        <span className="material-symbols-outlined text-text-secondary">chevron_right</span>
                                     </button>
                                  ))
                               ) : (
                                  <p className="text-text-secondary text-sm italic py-2 md:col-span-3">Nenhum treino vinculado.</p>
                               )}
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

      {/* Mobile Student List */}
      <div className="md:hidden flex flex-col gap-3 w-full max-w-full overflow-hidden">
        {studentsData
          .filter((s) => {
            const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === "Todas" || s.status === statusFilter;
            return matchesSearch && matchesStatus;
          })
          .map((student) => {
            const isTrialExpired = student.status !== "Ativa" && student.trialUntil && new Date() > (student.trialUntil?.toDate ? student.trialUntil.toDate() : new Date(student.trialUntil));
            const isTrialActive = student.status !== "Ativa" && student.trialUntil && !isTrialExpired;

            return (
              <button
                key={student.id}
                onClick={() => {
                  setMobileSelectedStudent(student);
                  if (isCreatingWorkoutForStudentFlow) {
                    setIsBottomSheetOpen(true);
                  }
                }}
                className="w-full max-w-full overflow-hidden flex items-center gap-4 bg-card-dark p-4 rounded-xl border border-border-dark active:scale-[0.98] transition-transform text-left"
              >
                <div className="relative shrink-0">
                  <img
                    className="size-14 rounded-full object-cover border-2 border-border-dark"
                    src={student.img}
                    alt={student.name}
                  />
                  <div
                    className={`absolute -bottom-1 -right-1 size-4 rounded-full border-2 border-card-dark ${
                      student.engagement === "green"
                        ? "bg-primary"
                        : student.engagement === "yellow"
                        ? "bg-yellow-400"
                        : "bg-red-500"
                    }`}
                  ></div>
                </div>
                
                <div className="flex flex-col flex-1 min-w-0">
                  <h3 className="text-white font-black uppercase truncate text-sm">
                    {student.name}
                  </h3>
                  
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider w-fit ${
                        student.status === "Ativa"
                          ? "bg-primary/10 text-primary ring-1 ring-primary/20"
                          : isTrialActive
                          ? "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20"
                          : "bg-red-500/10 text-red-500 ring-1 ring-red-500/20 border-red-500/30"
                      }`}
                    >
                      <span className={`size-1 rounded-full ${student.status === "Ativa" ? "bg-primary animate-pulse" : isTrialActive ? "bg-amber-400 animate-pulse" : "bg-red-500"}`}></span>
                      {student.status === "Ativa" ? "Ativa" : isTrialActive ? "Em Trial" : "Bloqueado"}
                    </span>
                  </div>
                </div>

                <span className="material-symbols-outlined text-text-secondary shrink-0">chevron_right</span>
              </button>
            );
          })}
          {studentsData.length === 0 && (
            <div className="text-center p-8 bg-card-dark rounded-xl border border-border-dark italic text-text-secondary">
              Nenhum aluno encontrado.
            </div>
          )}
      </div>

      {/* Pagination Container */}
      <div className="hidden md:flex items-center justify-between border-t border-border-dark px-4 py-4 sm:px-6 mt-4">
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
  };

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

  const startEditingWorkout = (w: any) => {
    if (!w || w === 'new') {
      setEditingWorkoutId("new");
      setWorkoutName("Nova Ficha");
      setSubWorkouts([
        { id: "A", name: "Treino A", exercises: [] },
        { id: "B", name: "Treino B", exercises: [] },
        { id: "C", name: "Treino C", exercises: [] },
        { id: "D", name: "Treino D", exercises: [] },
        { id: "E", name: "Treino E", exercises: [] }
      ]);
      setWorkoutEditorStep("ficha");
      setActiveSubWorkoutIndex(null);
      setFichaIsActive(true);
      setFichaPeriodizationType(null);
      setFichaPeriodizationValue("");
      setFichaObservation("");
    } else {
      setEditingWorkoutId(w.id);
      setWorkoutName(w.name || w.title || "Treino sem nome");
      if (w.subWorkouts && w.subWorkouts.length > 0) {
        setSubWorkouts(w.subWorkouts);
      } else {
        setSubWorkouts([
          { id: "A", name: "Treino A", exercises: (w.exercises || []).map(adaptLegacyExercise) },
          { id: "B", name: "Treino B", exercises: [] },
          { id: "C", name: "Treino C", exercises: [] },
          { id: "D", name: "Treino D", exercises: [] },
          { id: "E", name: "Treino E", exercises: [] }
        ]);
      }
      setWorkoutEditorStep("ficha");
      setActiveSubWorkoutIndex(null);
      setFichaIsActive(w.isActive !== false);
      setFichaPeriodizationType(w.periodization?.type || null);
      setFichaPeriodizationValue(w.periodization?.value || "");
      setFichaObservation(w.observation || "");
    }
  };

  const renderWorkouts = () => (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 pb-24">
      {/* Mobile-only back header matching existing pattern */}
      <div className="md:hidden relative flex items-center justify-center w-full min-h-[44px] px-12 mb-2 shrink-0">
        <button 
          onClick={() => {
            if (editingWorkoutId) {
              setEditingWorkoutId(null);
            } else {
              setActiveTab('dashboard');
            }
          }}
          className="absolute left-0 size-10 flex items-center justify-center rounded-xl bg-white/5 text-text-secondary hover:text-white transition-all active:scale-95 border border-white/5 shadow-md shrink-0"
        >
          <span className="material-symbols-outlined text-xl">arrow_back_ios_new</span>
        </button>
        <h1 className="text-white font-black text-xl tracking-tight text-center">
          {editingWorkoutId ? 'Editar Treino' : 'Gestão de Treinos'}
        </h1>
      </div>

      <div className="hidden md:flex flex-col gap-2">
        <h1 className="text-white text-4xl font-black leading-tight tracking-[-0.033em]">
          Gestão de Treinos
        </h1>
        <p className="text-text-secondary text-base font-normal leading-normal">
          Crie e organize as fichas de treino para seus alunos.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar de Treinos */}
        <div className={`lg:col-span-1 flex flex-col gap-4 ${editingWorkoutId ? 'hidden lg:flex' : 'flex'}`}>
          <div className="bg-card-dark/80 backdrop-blur-md rounded-xl border border-border-dark p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between bg-black/20 p-2 rounded-lg mb-1">
              <h3 className="text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-primary">
                <span className="material-symbols-outlined text-[16px]">library_books</span>
                Modelos de Ficha
              </h3>
            </div>
            {workouts.filter(w => !w.studentIds || w.studentIds.length === 0).length === 0 && (
              <p className="text-text-secondary text-xs italic text-center py-6 border border-dashed border-border-dark rounded-lg">Nenhum modelo de ficha cadastrado.</p>
            )}
            {workouts.filter(w => !w.studentIds || w.studentIds.length === 0).map((w) => (
              <div
                key={w.id}
                className={`flex flex-col rounded-lg bg-background-dark border ${editingWorkoutId === w.id ? 'border-primary ring-1 ring-primary/50' : 'border-border-dark hover:border-primary/50'} transition-all group overflow-hidden`}
              >
                <button 
                  onClick={() => startEditingWorkout(w)}
                  className="flex items-center justify-between p-3 text-left w-full focus:outline-none"
                >
                  <span className={`text-sm font-medium ${editingWorkoutId === w.id ? 'text-primary font-bold' : 'text-text-primary group-hover:text-white'}`}>
                    {w.name || w.title || "Treino sem nome"}
                  </span>
                  <span className={`material-symbols-outlined text-sm ${editingWorkoutId === w.id ? 'text-primary' : 'text-text-secondary group-hover:text-primary'}`}>
                    edit
                  </span>
                </button>
                {deletingModelWorkoutId === w.id ? (
                  <div className="flex border-t border-border-dark divide-x divide-border-dark bg-red-500/10 animate-in fade-in duration-200">
                    <button
                      onClick={() => setDeletingModelWorkoutId(null)}
                      className="flex-1 py-2 text-[10px] font-black text-text-secondary hover:text-white transition-colors uppercase tracking-wider"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={async () => {
                        await dataService.deleteWorkout(w.id);
                        if (editingWorkoutId === w.id) {
                          setEditingWorkoutId(null);
                          setWorkoutName("");
                          setExercises([]);
                        }
                        setDeletingModelWorkoutId(null);
                      }}
                      className="flex-1 py-2 text-[10px] font-black text-red-500 hover:bg-red-500/20 transition-colors uppercase tracking-wider"
                    >
                      Confirmar
                    </button>
                  </div>
                ) : (
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
                      onClick={() => {
                        setDeletingModelWorkoutId(w.id);
                      }}
                      className="flex-1 py-2 flex items-center justify-center text-text-secondary hover:text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">
                        delete
                      </span>
                    </button>
                  </div>
                )}
              </div>
            ))}
            <button 
              onClick={() => {
                setPreAssignedStudentId(null);
                startEditingWorkout('new');
              }}
              className="w-full py-3 mt-2 rounded-lg border border-dashed border-primary/30 text-primary font-bold text-sm hover:bg-primary/10 transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">add</span>
              Nova Ficha
            </button>
          </div>
        </div>

        {/* Editor de Treino Reformulado e Profissional */}
        <div className={`lg:col-span-3 flex flex-col gap-6 ${!editingWorkoutId ? 'hidden lg:flex' : 'flex'}`}>
          {(() => {
            const openExerciseDetailForNew = (libEx: any) => {
              setSelectedLibraryExercise(libEx);
              setIsManualExercise(false);
              setIsSpecialSeries(false);
              setEditingConfiguredExerciseId(null);
              setDetailSeriesForm("Repetição");
              setDetailLoadConfig("Kg");
              setDetailRest(60);
              setDetailSeries([
                { id: "s1", reps: "10", weight: "" },
                { id: "s2", reps: "10", weight: "" },
                { id: "s3", reps: "10", weight: "" }
              ]);
              setDetailVideoUrl("");
              setDetailNotes("");
              setWorkoutEditorStep("detalhe");
            };

            const openExerciseDetailForEdit = (ex: any) => {
              setSelectedLibraryExercise({ name: ex.name, category: ex.category });
              setIsManualExercise(ex.isManual || false);
              setIsSpecialSeries(ex.isSpecial || false);
              setEditingConfiguredExerciseId(ex.id);
              setDetailSeriesForm(ex.seriesForm || "Repetição");
              setDetailLoadConfig(ex.loadConfig || "Kg");
              setDetailRest(ex.rest || 60);
              setDetailSeries(ex.series || [{ id: "s1", reps: "10", weight: "" }]);
              setDetailVideoUrl(ex.videoUrl || "");
              setDetailNotes(ex.notes || "");
              setWorkoutEditorStep("detalhe");
            };

            const openExerciseDetailForManual = () => {
              setSelectedLibraryExercise({ name: "", category: "Geral" });
              setIsManualExercise(true);
              setIsSpecialSeries(false);
              setEditingConfiguredExerciseId(null);
              setDetailSeriesForm("Repetição");
              setDetailLoadConfig("Kg");
              setDetailRest(60);
              setDetailSeries([{ id: "s1", reps: "10", weight: "" }]);
              setDetailVideoUrl("");
              setDetailNotes("");
              setWorkoutEditorStep("detalhe");
            };

            const openExerciseDetailForSpecial = () => {
              setSelectedLibraryExercise({ name: "", category: "Especial" });
              setIsManualExercise(false);
              setIsSpecialSeries(true);
              setEditingConfiguredExerciseId(null);
              setDetailSeriesForm("Repetição");
              setDetailLoadConfig("Kg");
              setDetailRest(90);
              setDetailSeries([
                { id: "s1", reps: "10", weight: "" },
                { id: "s2", reps: "10", weight: "" }
              ]);
              setDetailVideoUrl("");
              setDetailNotes("Descreva os exercícios conjugados/agrupados...");
              setWorkoutEditorStep("detalhe");
            };

            const saveExerciseDetail = () => {
              if (activeSubWorkoutIndex === null) return;
              
              const finalName = (selectedLibraryExercise?.name || "").trim();
              if (!finalName) {
                alert("Por favor, preencha o nome do exercício.");
                return;
              }

              const exData: any = {
                id: editingConfiguredExerciseId || `ex-${Date.now()}-${Math.random()}`,
                name: finalName,
                category: selectedLibraryExercise?.category || "Geral",
                isManual: isManualExercise,
                isSpecial: isSpecialSeries,
                seriesForm: detailSeriesForm,
                loadConfig: detailLoadConfig,
                rest: detailRest,
                series: detailSeries,
                videoUrl: detailVideoUrl,
                notes: detailNotes
              };

              const targetSubWorkout = subWorkouts[activeSubWorkoutIndex];
              let updatedExercises = [...(targetSubWorkout.exercises || [])];

              if (editingConfiguredExerciseId) {
                updatedExercises = updatedExercises.map(ex => ex.id === editingConfiguredExerciseId ? exData : ex);
              } else {
                updatedExercises.push(exData);
              }

              const updatedSubWorkouts = [...subWorkouts];
              updatedSubWorkouts[activeSubWorkoutIndex] = {
                ...targetSubWorkout,
                exercises: updatedExercises
              };

              setSubWorkouts(updatedSubWorkouts);
              setWorkoutEditorStep("prescrever");
              setAccordionExpanded(true);
            };

            const deleteConfiguredExercise = (exId: string) => {
              if (activeSubWorkoutIndex === null) return;
              const targetSubWorkout = subWorkouts[activeSubWorkoutIndex];
              const updatedExercises = (targetSubWorkout.exercises || []).filter((ex: any) => ex.id !== exId);
              
              const updatedSubWorkouts = [...subWorkouts];
              updatedSubWorkouts[activeSubWorkoutIndex] = {
                ...targetSubWorkout,
                exercises: updatedExercises
              };

              setSubWorkouts(updatedSubWorkouts);
            };

            const saveEntireFicha = async () => {
              if (!workoutName.trim()) {
                alert("A ficha precisa de um nome.");
                return;
              }

              const flatExercisesList: any[] = [];
              subWorkouts.forEach(sw => {
                if (sw.exercises && sw.exercises.length > 0) {
                  sw.exercises.forEach((ex: any) => {
                    flatExercisesList.push({
                      id: ex.id,
                      name: ex.name,
                      sets: ex.series?.length ? ex.series.length.toString() : "3",
                      reps: ex.series?.[0]?.reps || "10",
                      rest: ex.rest ? ex.rest.toString() : "60",
                      notes: ex.notes || ""
                    });
                  });
                }
              });

              const payload = {
                name: workoutName,
                title: workoutName,
                isActive: fichaIsActive,
                periodization: fichaPeriodizationType ? { type: fichaPeriodizationType, value: fichaPeriodizationValue } : null,
                observation: fichaObservation,
                subWorkouts: subWorkouts,
                exercises: flatExercisesList,
                trainerId: user.id
              };

              try {
                if (editingWorkoutId === 'new') {
                  await dataService.createWorkout({
                    ...payload,
                    studentIds: preAssignedStudentId ? [preAssignedStudentId] : [],
                    studentStatuses: preAssignedStudentId ? { [preAssignedStudentId]: "Ativo" } : {}
                  });
                  setPreAssignedStudentId(null);
                } else {
                  await dataService.updateWorkout(editingWorkoutId!, payload);
                }
                setEditingWorkoutId(null);
                setWorkoutEditorStep("ficha");
                alert("Ficha de treino salva com sucesso!");
              } catch (e) {
                console.error(e);
                alert("Erro ao salvar ficha de treino.");
              }
            };

            if (editingWorkoutId) {
              return (
                <>
                  <div className="bg-card-dark/80 backdrop-blur-md rounded-2xl border border-border-dark flex flex-col shadow-[0_4px_30px_rgba(0,0,0,0.3)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  
                  {/* STAGE 1: FICHA - GESTÃO DOS TREINOS */}
                  {workoutEditorStep === "ficha" && (
                    <div className="flex flex-col">
                      <div className="p-6 border-b border-border-dark flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-background-dark/30">
                        <div className="flex-1 flex items-center justify-between gap-3">
                          <div className="flex-1">
                            <p className="hidden lg:block text-xs text-primary font-black uppercase tracking-widest mb-1">Passo 1: Organizar Treinos</p>
                            <input 
                              type="text" 
                              value={workoutName}
                              onChange={(e) => setWorkoutName(e.target.value)}
                              className="bg-transparent border-b border-transparent hover:border-border-dark focus:border-primary text-white text-2xl font-black w-full focus:outline-none transition-all pb-1 placeholder-text-secondary/30"
                              placeholder="Nome da Ficha (ex: Hipertrofia Masculina)"
                            />
                          </div>
                          {/* Botão de três pontos para mobile */}
                          <button
                            type="button"
                            onClick={() => {
                              setIsFichaMenuOpen(true);
                              setIsConfirmingDeleteFicha(false);
                            }}
                            className="lg:hidden flex items-center justify-center size-11 rounded-full bg-white/5 border border-white/5 text-text-secondary hover:text-white transition-all active:scale-95 shrink-0"
                            title="Opções da Ficha"
                          >
                            <span className="material-symbols-outlined text-xl">more_vert</span>
                          </button>
                        </div>
                        {/* Desktop Save Button ONLY (no Cancel) */}
                        <div className="hidden lg:flex gap-2 shrink-0">
                          <button
                            onClick={saveEntireFicha}
                            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-background-dark hover:brightness-110 active:scale-[0.98] transition-all rounded-lg font-black shadow-lg shadow-primary/20 text-sm"
                          >
                            <span className="material-symbols-outlined text-base">save</span>
                            Salvar Ficha
                          </button>
                        </div>
                      </div>

                       <div className="p-6 pb-36 lg:pb-6 flex flex-col gap-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="hidden lg:flex text-white font-bold text-lg items-center gap-2">
                              <span className="material-symbols-outlined text-primary">layers</span>
                              Divisão de Treinos ({subWorkouts.length})
                            </h3>
                            <p className="hidden lg:block text-text-secondary text-xs mt-1">Arraste os cards para reordenar a ficha ou adicione novos treinos.</p>
                          </div>
                          {/* Add workout button shown only on desktop header */}
                          <button
                            onClick={() => {
                              const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
                              const nextLetter = letters[subWorkouts.length] || `Set ${subWorkouts.length + 1}`;
                              setSubWorkouts([
                                ...subWorkouts,
                                { id: `SW-${Date.now()}`, name: `Treino ${nextLetter}`, exercises: [] }
                              ]);
                            }}
                            className="hidden lg:flex items-center gap-1.5 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 hover:border-primary/45 rounded-lg text-xs font-black transition-all"
                          >
                            <span className="material-symbols-outlined text-[14px]">add</span>
                            Adicionar Treino
                          </button>
                        </div>

                        <div className="flex flex-col gap-3">
                          {subWorkouts.map((sw, index) => (
                            <div
                              key={sw.id || index}
                              draggable
                              onDragStart={(e) => handleSubWorkoutDragStart(e, index)}
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={(e) => handleSubWorkoutDrop(e, index)}
                              onClick={(e) => {
                                if (
                                  (e.target as HTMLElement).closest('input') || 
                                  (e.target as HTMLElement).closest('button') || 
                                  (e.target as HTMLElement).closest('.cursor-grab')
                                ) {
                                  return;
                                }
                                setActiveSubWorkoutIndex(index);
                                setWorkoutEditorStep("prescrever");
                                setAccordionExpanded(sw.exercises?.length > 0);
                              }}
                              className="group bg-background-dark/40 border border-border-dark hover:border-primary/40 rounded-xl p-4 flex items-center justify-between gap-4 transition-all cursor-pointer lg:cursor-default"
                            >
                              <div className="flex items-center gap-3">
                                <div 
                                  title="Arraste para reordenar"
                                  className="size-8 rounded-lg bg-card-dark border border-border-dark flex items-center justify-center text-text-secondary cursor-grab active:cursor-grabbing group-hover:text-primary transition-colors"
                                >
                                  <span className="material-symbols-outlined text-xl">drag_indicator</span>
                                </div>
                                <div className="flex flex-col gap-1 sm:hidden">
                                  <button 
                                    disabled={index === 0}
                                    onClick={() => moveSubWorkout(index, 'up')}
                                    className="text-text-secondary disabled:opacity-20 flex"
                                  >
                                    <span className="material-symbols-outlined text-sm">keyboard_arrow_up</span>
                                  </button>
                                  <button 
                                    disabled={index === subWorkouts.length - 1}
                                    onClick={() => moveSubWorkout(index, 'down')}
                                    className="text-text-secondary disabled:opacity-20 flex"
                                  >
                                    <span className="material-symbols-outlined text-sm">keyboard_arrow_down</span>
                                  </button>
                                </div>
                                <div className="hidden sm:flex items-center gap-1">
                                  <button
                                    disabled={index === 0}
                                    onClick={() => moveSubWorkout(index, 'up')}
                                    className="size-6 rounded bg-card-dark border border-border-dark text-text-secondary hover:text-white hover:border-primary/30 flex items-center justify-center disabled:opacity-20 disabled:pointer-events-none transition-all"
                                    title="Mover para cima"
                                  >
                                    <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
                                  </button>
                                  <button
                                    disabled={index === subWorkouts.length - 1}
                                    onClick={() => moveSubWorkout(index, 'down')}
                                    className="size-6 rounded bg-card-dark border border-border-dark text-text-secondary hover:text-white hover:border-primary/30 flex items-center justify-center disabled:opacity-20 disabled:pointer-events-none transition-all"
                                    title="Mover para baixo"
                                  >
                                    <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
                                  </button>
                                </div>
                              </div>

                              <div className="flex-1 flex flex-col min-w-0">
                                <h4 className="text-white text-base font-bold leading-tight truncate">
                                  {sw.name}
                                </h4>
                                <p className="text-text-secondary text-[10px] uppercase font-bold tracking-widest mt-1 flex items-center gap-1.5">
                                  <span className="size-1.5 rounded-full bg-primary animate-pulse"></span>
                                  {sw.exercises?.length || 0} exercícios
                                </p>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {/* Prescribe button hidden on mobile since the entire card is clickable there */}
                                <button
                                  onClick={() => {
                                    setActiveSubWorkoutIndex(index);
                                    setWorkoutEditorStep("prescrever");
                                    setAccordionExpanded(sw.exercises?.length > 0);
                                  }}
                                  className="hidden lg:flex items-center gap-1.5 px-4 py-2 bg-primary/20 hover:bg-primary text-primary hover:text-background-dark border border-primary/20 hover:border-primary rounded-lg text-xs font-black transition-all"
                                >
                                  <span className="material-symbols-outlined text-sm">fitness_center</span>
                                  Prescrever
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setMobileWorkoutActionIndex(index);
                                    setTempWorkoutName(sw.name || "");
                                    setEditingWorkoutNameIndex(null);
                                    setIsEditingInlineName(false);
                                    setIsConfirmingDeleteSubWorkout(false);
                                  }}
                                  className="size-9 rounded-lg bg-white/5 hover:bg-white/10 border border-border-dark text-text-secondary hover:text-white flex items-center justify-center transition-all"
                                  title="Opções do treino"
                                >
                                  <span className="material-symbols-outlined text-xl">more_vert</span>
                                </button>
                              </div>
                            </div>
                          ))}

                          {/* Add workout button shown below the existing workouts list on mobile */}
                          {subWorkouts.length > 0 && (
                            <button
                              onClick={() => {
                                const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
                                const nextLetter = letters[subWorkouts.length] || `Set ${subWorkouts.length + 1}`;
                                setSubWorkouts([
                                  ...subWorkouts,
                                  { id: `SW-${Date.now()}`, name: `Treino ${nextLetter}`, exercises: [] }
                                ]);
                              }}
                              className="flex lg:hidden items-center justify-center gap-2 w-full py-3 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl text-sm font-black transition-all"
                            >
                              <span className="material-symbols-outlined text-base">add</span>
                              Adicionar Treino
                            </button>
                          )}

                          {subWorkouts.length === 0 && (
                            <div className="py-12 border-2 border-dashed border-border-dark rounded-xl flex flex-col items-center justify-center text-center">
                              <span className="material-symbols-outlined text-4xl text-text-secondary mb-2 opacity-50 font-light">layers_clear</span>
                              <h3 className="hidden lg:block text-white font-bold">Nenhum treino adicionado</h3>
                              <p className="hidden lg:block text-text-secondary text-xs mt-1 max-w-xs">Adicione treinos usando o botão acima para organizar a estrutura desta ficha.</p>
                              <p className="block lg:hidden text-text-secondary text-sm">Nenhum treino adicionado a esta ficha.</p>
                              <button
                                onClick={() => {
                                  setSubWorkouts([
                                    { id: "A", name: "Treino A", exercises: [] },
                                    { id: "B", name: "Treino B", exercises: [] },
                                    { id: "C", name: "Treino C", exercises: [] }
                                  ]);
                                }}
                                className="mt-4 text-primary font-bold text-sm hover:underline"
                              >
                                Gerar Treino A, B, C automaticamente
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Observações de Execução (Desktop & Mobile) */}
                        <div className="flex flex-col gap-2.5 mt-8 pt-8 border-t border-border-dark/30">
                          <label className="text-xs font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-sm">notes</span>
                            Observações de Execução
                          </label>
                          <textarea
                            ref={(el) => {
                              if (el) {
                                el.style.height = "auto";
                                el.style.height = el.scrollHeight + "px";
                              }
                            }}
                            value={fichaObservation}
                            onChange={(e) => {
                              setFichaObservation(e.target.value);
                              e.target.style.height = "auto";
                              e.target.style.height = e.target.scrollHeight + "px";
                            }}
                            className="w-full bg-background-dark/50 border border-border-dark focus:border-primary/60 rounded-xl px-4 py-3 text-white text-sm placeholder-text-secondary/50 focus:outline-none transition-all resize-none min-h-[100px] overflow-hidden leading-relaxed"
                            placeholder="Adicione orientações gerais para a execução desta ficha de treino..."
                            rows={4}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STAGE 2: PRESCREVER EXERCÍCIOS AO TREINO ATIVO */}
                  {workoutEditorStep === "prescrever" && activeSubWorkoutIndex !== null && (
                    <div className="flex flex-col animate-in fade-in duration-200">
                      <div className="p-6 border-b border-border-dark flex items-center justify-between gap-4 bg-background-dark/30">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setWorkoutEditorStep("ficha")}
                            className="hidden lg:flex size-10 rounded-xl bg-white/5 border border-white/5 text-text-secondary hover:text-white hover:bg-white/10 active:scale-95 transition-all items-center justify-center shrink-0"
                          >
                            <span className="material-symbols-outlined text-lg">arrow_back</span>
                          </button>
                          <div>
                            <p className="hidden lg:block text-xs text-primary font-black uppercase tracking-widest leading-none mb-1">Passo 2: Biblioteca de Exercícios</p>
                            <h2 className="text-white font-black text-xl tracking-tight leading-tight">Prescrição do {subWorkouts[activeSubWorkoutIndex]?.name}</h2>
                          </div>
                        </div>
                      </div>

                      <div className="p-6 flex flex-col gap-6 pb-28 lg:pb-6">
                        {/* Versão Desktop (Inalterada) */}
                        <div className="hidden lg:grid grid-cols-2 gap-4">
                          <button
                            onClick={openExerciseDetailForManual}
                            className="flex items-center justify-center gap-2.5 h-14 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold border border-white/5 hover:border-white/10 transition-all active:scale-[0.98]"
                          >
                            <span className="material-symbols-outlined text-primary">add_box</span>
                            <span className="hidden lg:inline">Criar exercício manualmente</span>
                            <span className="lg:hidden">Criar Exercício</span>
                          </button>
                          <button
                            onClick={openExerciseDetailForSpecial}
                            className="flex items-center justify-center gap-2.5 h-14 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-bold border border-primary/10 hover:border-primary/20 transition-all active:scale-[0.98]"
                          >
                            <span className="material-symbols-outlined text-primary hidden lg:inline">stars</span>
                            <span className="material-symbols-outlined text-primary lg:hidden">add_circle</span>
                            <span className="hidden lg:inline">Criar séries especiais</span>
                            <span className="lg:hidden">Série Especial</span>
                          </button>
                        </div>

                        {/* Versão Mobile (Recauchutada/Refatorada) */}
                        <div className="lg:hidden flex items-center justify-between gap-4 px-1">
                          <button
                            onClick={openExerciseDetailForManual}
                            className="flex-1 flex items-center justify-center gap-2 h-12 text-primary hover:text-primary-focus font-bold transition-all active:scale-95 text-sm"
                          >
                            <span className="material-symbols-outlined text-[24px]">add</span>
                            <span>Criar Exercício</span>
                          </button>
                          
                          <div className="w-px h-6 bg-border-dark/30 self-center" />
                          
                          <button
                            onClick={openExerciseDetailForSpecial}
                            className="flex-1 flex items-center justify-center gap-2 h-12 text-primary hover:text-primary-focus font-bold transition-all active:scale-95 text-sm"
                          >
                            <span className="material-symbols-outlined text-[24px]">add</span>
                            <span>Série Especial</span>
                          </button>
                        </div>

                        <div className="relative">
                          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary text-xl">search</span>
                          <input
                            type="text"
                            value={subWorkoutSearchQuery}
                            onChange={(e) => setSubWorkoutSearchQuery(e.target.value)}
                            placeholder={isMobileScreen ? "Buscar exercício" : "Buscar por nome do exercício (ex: Supino reto, Rosca...)"}
                            className="w-full h-14 rounded-xl bg-background-dark/70 border border-border-dark text-white text-base focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 pl-12 pr-4 transition-all placeholder-text-secondary/50"
                          />
                          {subWorkoutSearchQuery && (
                            <button 
                              onClick={() => setSubWorkoutSearchQuery("")}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-white"
                            >
                              <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                          )}
                        </div>

                        {/* Filtros de Grupos Musculares - Mobile */}
                        <div className="lg:hidden flex flex-col gap-2">
                          <p className="text-text-primary text-xs font-black tracking-widest uppercase mb-1">Filtrar por Grupo Muscular</p>
                          <div className="flex flex-col gap-1.5">
                            {/* Linha 1: 5 botões */}
                            <div className="flex justify-center gap-1.5 w-full">
                              {["TODOS", "ABDOMINAL", "AERÓBICO", "ANTEBRAÇO", "BÍCEPS"].map((filter) => {
                                const isSelected = filter === "TODOS" ? selectedMuscleGroupFilter === null : selectedMuscleGroupFilter === filter;
                                return (
                                  <button
                                    key={`mobile-filter-row1-${filter}`}
                                    onClick={() => setSelectedMuscleGroupFilter(filter === "TODOS" ? null : filter)}
                                    className={`w-[calc((100%-24px)/5)] h-9 rounded-lg text-[9px] font-black transition-all border flex items-center justify-center text-center px-0.5 tracking-tighter uppercase leading-none ${
                                      isSelected
                                        ? "bg-primary text-background-dark border-primary font-black shadow-lg shadow-primary/20"
                                        : "bg-white/5 text-text-secondary border-border-dark/60"
                                    }`}
                                  >
                                    {filter}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Linha 2: 4 botões */}
                            <div className="flex justify-center gap-1.5 w-full">
                              {["COSTAS", "GLÚTEO", "OMBRO", "PANTURRILHA"].map((filter) => {
                                const isSelected = selectedMuscleGroupFilter === filter;
                                return (
                                  <button
                                    key={`mobile-filter-row2-${filter}`}
                                    onClick={() => setSelectedMuscleGroupFilter(selectedMuscleGroupFilter === filter ? null : filter)}
                                    className={`w-[calc((100%-24px)/5)] h-9 rounded-lg text-[9px] font-black transition-all border flex items-center justify-center text-center px-0.5 tracking-tighter uppercase leading-none ${
                                      isSelected
                                        ? "bg-primary text-background-dark border-primary font-black shadow-lg shadow-primary/20"
                                        : "bg-white/5 text-text-secondary border-border-dark/60"
                                    }`}
                                  >
                                    {filter}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Linha 3: 4 botões */}
                            <div className="flex justify-center gap-1.5 w-full">
                              {["PEITORAL", "PERNAS", "TRAPÉZIO", "TRÍCEPS"].map((filter) => {
                                const isSelected = selectedMuscleGroupFilter === filter;
                                return (
                                  <button
                                    key={`mobile-filter-row3-${filter}`}
                                    onClick={() => setSelectedMuscleGroupFilter(selectedMuscleGroupFilter === filter ? null : filter)}
                                    className={`w-[calc((100%-24px)/5)] h-9 rounded-lg text-[9px] font-black transition-all border flex items-center justify-center text-center px-0.5 tracking-tighter uppercase leading-none ${
                                      isSelected
                                        ? "bg-primary text-background-dark border-primary font-black shadow-lg shadow-primary/20"
                                        : "bg-white/5 text-text-secondary border-border-dark/60"
                                    }`}
                                  >
                                    {filter}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Filtros de Grupos Musculares - Desktop */}
                        <div className="hidden lg:flex flex-col gap-2.5">
                          <p className="text-text-primary text-xs font-black tracking-widest uppercase">Filtrar por Grupo Muscular</p>
                          <div className="flex flex-wrap gap-1.5 py-1 max-h-[140px] overflow-y-auto custom-scrollbar">
                            <button
                              onClick={() => setSelectedMuscleGroupFilter(null)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                                selectedMuscleGroupFilter === null
                                  ? "bg-primary text-background-dark border-primary font-black shadow-md shadow-primary/10"
                                  : "bg-white/5 text-text-secondary border-border-dark hover:text-white hover:bg-white/10"
                              }`}
                            >
                              TODOS
                            </button>
                            {[
                              "ABDOMINAL",
                              "AERÓBICO",
                              "ANTEBRAÇO",
                              "BÍCEPS",
                              "COSTAS",
                              "GLÚTEO",
                              "OMBRO",
                              "PANTURRILHA",
                              "PEITORAL",
                              "PERNAS",
                              "TRAPÉZIO",
                              "TRÍCEPS"
                            ].map((filter) => (
                              <button
                                key={`desktop-filter-${filter}`}
                                onClick={() => setSelectedMuscleGroupFilter(selectedMuscleGroupFilter === filter ? null : filter)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                                  selectedMuscleGroupFilter === filter
                                    ? "bg-primary text-background-dark border-primary font-black shadow-md shadow-primary/10"
                                    : "bg-white/5 text-text-secondary border-border-dark hover:text-white hover:bg-white/10"
                                }`}
                              >
                                {filter}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <p className="text-text-primary text-xs font-black tracking-widest uppercase">Escolher Exercício da Biblioteca</p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[350px] overflow-y-auto custom-scrollbar pr-1">
                            {LIBRARY_EXERCISES.filter((ex) => {
                              const matchesSearch = ex.name.toLowerCase().includes(subWorkoutSearchQuery.toLowerCase());
                              const matchesMuscle = selectedMuscleGroupFilter 
                                ? ex.category.toLowerCase() === selectedMuscleGroupFilter.toLowerCase()
                                : true;
                              return matchesSearch && matchesMuscle;
                            }).map((libEx) => (
                              <div
                                key={libEx.id}
                                className="bg-background-dark/30 hover:bg-background-dark/60 border border-border-dark hover:border-primary/30 p-3.5 rounded-xl flex items-center justify-between gap-4 transition-colors"
                              >
                                <div className="flex flex-col min-w-0">
                                  <h4 className="text-white font-bold text-sm truncate leading-tight">{libEx.name}</h4>
                                  <p className="text-text-secondary text-[10px] uppercase font-semibold mt-1 tracking-wider">{libEx.category} • {libEx.difficulty}</p>
                                </div>
                                <button
                                  onClick={() => openExerciseDetailForNew(libEx)}
                                  className="size-9 rounded-lg bg-primary/10 hover:bg-primary border border-primary/20 hover:border-primary text-primary hover:text-background-dark flex items-center justify-center transition-all shrink-0 active:scale-95"
                                  title="Configurar Exercício"
                                >
                                  <span className="material-symbols-outlined text-base">add</span>
                                </button>
                              </div>
                            ))}

                            {LIBRARY_EXERCISES.filter((ex) => {
                              const matchesSearch = ex.name.toLowerCase().includes(subWorkoutSearchQuery.toLowerCase());
                              const matchesMuscle = selectedMuscleGroupFilter 
                                ? ex.category.toLowerCase() === selectedMuscleGroupFilter.toLowerCase()
                                : true;
                              return matchesSearch && matchesMuscle;
                            }).length === 0 && (
                              <div className="col-span-full py-8 text-center text-text-secondary border border-dashed border-border-dark rounded-xl">
                                <span className="material-symbols-outlined text-3xl mb-1 opacity-50">search_off</span>
                                <p className="text-xs">Nenhum exercício encontrado para a busca e filtro selecionados.</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Accordion para desktop apenas */}
                        <div className="hidden lg:block border border-border-dark rounded-xl bg-background-dark/30 mt-4 overflow-hidden">
                          <button
                            onClick={() => setAccordionExpanded(!accordionExpanded)}
                            className="w-full p-4 flex items-center justify-between font-black text-sm text-white hover:bg-white/5 transition-all focus:outline-none"
                            type="button"
                          >
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-primary text-lg">fact_check</span>
                              <span>{subWorkouts[activeSubWorkoutIndex]?.exercises?.length || 0} Exercícios Configurados no {subWorkouts[activeSubWorkoutIndex]?.name}</span>
                            </div>
                            <span className="material-symbols-outlined text-text-secondary transition-transform">
                              {accordionExpanded ? "expand_less" : "expand_more"}
                            </span>
                          </button>

                          {accordionExpanded && (
                            <div className="p-4 border-t border-border-dark flex flex-col gap-2.5 bg-background-dark/10 max-h-[280px] overflow-y-auto custom-scrollbar">
                              {(subWorkouts[activeSubWorkoutIndex]?.exercises || []).map((ex: any, idx: number) => (
                                <div 
                                  key={`desktop-ex-${ex.id || idx}`}
                                  className="bg-card-dark border border-border-dark p-3 rounded-lg flex items-center justify-between gap-4 transition-all hover:bg-card-dark/80"
                                >
                                  <div 
                                    onClick={() => openExerciseDetailForEdit(ex)}
                                    className="flex-1 min-w-0 cursor-pointer group"
                                  >
                                    <h5 className="text-white font-bold text-sm leading-tight group-hover:text-primary transition-colors">{ex.name}</h5>
                                    <div className="flex items-center gap-3 text-[10px] font-bold text-text-secondary mt-1 uppercase tracking-wider">
                                      <span>{ex.series?.length || 0} Séries ({ex.seriesForm})</span>
                                      <span>•</span>
                                      <span>Pausa: {ex.rest}s</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0 font-bold">
                                    <button
                                      onClick={() => openExerciseDetailForEdit(ex)}
                                      className="size-8 rounded bg-white/5 hover:bg-white/10 text-text-secondary hover:text-white flex items-center justify-center transition-all"
                                      title="Editar"
                                    >
                                      <span className="material-symbols-outlined text-base">edit</span>
                                    </button>
                                    <button
                                      onClick={() => deleteConfiguredExercise(ex.id)}
                                      className="size-8 rounded bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white flex items-center justify-center transition-all"
                                      title="Remover"
                                    >
                                      <span className="material-symbols-outlined text-base">delete</span>
                                    </button>
                                  </div>
                                </div>
                              ))}

                              {(subWorkouts[activeSubWorkoutIndex]?.exercises || []).length === 0 && (
                                <p className="py-4 text-center text-xs text-text-secondary italic">Ainda não há exercícios salvos para este treino.</p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Espaçador inferior no mobile para compensar a barra de botões */}
                        <div className="h-12 lg:hidden" />

                        {/* Botão conclusão (Centralizado no mobile, alinhado à direita no desktop) */}
                        <div className="pt-6 flex justify-center lg:justify-end lg:pt-4">
                          <button 
                            onClick={() => setWorkoutEditorStep("ficha")}
                            className="w-full max-w-[280px] lg:w-auto px-6 py-3 lg:py-2.5 bg-background-dark border border-border-dark rounded-xl lg:rounded-lg text-white font-bold text-sm hover:brightness-110 active:scale-95 transition-all text-center"
                          >
                            Pronto, Voltar para Ficha
                          </button>
                        </div>
                      </div>

                      {/* Bottom Sheet de Exercícios Configurados removido daqui e reposicionado independente */}
                    </div>
                  )}

                  {/* STAGE 3: DETALHE DO EXERCÍCIO */}
                  {workoutEditorStep === "detalhe" && selectedLibraryExercise && (
                    <div className="flex flex-col animate-in slide-in-from-right-10 duration-200">
                      <div className="p-6 border-b border-border-dark flex items-center justify-between gap-4 bg-background-dark/30">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setWorkoutEditorStep("prescrever")}
                            className="size-10 rounded-xl bg-white/5 border border-white/5 text-text-secondary hover:text-white hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center shrink-0"
                          >
                            <span className="material-symbols-outlined text-lg">arrow_back</span>
                          </button>
                          <div>
                            <p className="hidden lg:block text-xs text-primary font-black uppercase tracking-widest leading-none mb-1">Passo 3: Parâmetros do Exercício</p>
                            <h2 className="text-white font-black text-xl tracking-tight leading-tight">Configurar: {selectedLibraryExercise.name || "Exercício"}</h2>
                          </div>
                        </div>
                      </div>

                      <div className="p-6 flex flex-col gap-6">
                        {(isManualExercise || isSpecialSeries) && (
                          <label className="flex flex-col gap-2">
                            <span className="text-text-primary text-xs font-black tracking-widest uppercase">Nome Customizado do Exercício</span>
                            <input
                              type="text"
                              value={selectedLibraryExercise.name}
                              onChange={(e) => setSelectedLibraryExercise({...selectedLibraryExercise, name: e.target.value})}
                              className="w-full h-12 rounded-lg bg-background-dark/55 border border-border-dark text-white px-4 focus:outline-none focus:border-primary text-sm font-bold"
                              placeholder={isSpecialSeries ? "ex: Bi-set: Supino reto + Crucifixo" : "ex: Flexão declinada"}
                            />
                          </label>
                        )}

                        <div className="flex flex-col gap-2.5">
                          <span className="text-text-primary text-xs font-black tracking-widest uppercase">1 - Forma da Série</span>
                          <div className="grid grid-cols-3 gap-2">
                            {(["Repetição", "Minuto", "Segundo"] as const).map((form) => (
                              <button
                                key={form}
                                type="button"
                                onClick={() => setDetailSeriesForm(form)}
                                className={`h-11 rounded-lg text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                                  detailSeriesForm === form
                                    ? "bg-primary text-background-dark border-primary font-black shadow-md shadow-primary/10"
                                    : "bg-white/5 text-text-secondary border-border-dark hover:text-white hover:bg-white/10"
                                }`}
                              >
                                {form === "Repetição" ? "Repetições" : form === "Minuto" ? "Minutos" : "Segundos"}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2.5">
                          <span className="text-text-primary text-xs font-black tracking-widest uppercase">2 - Configuração de Carga</span>
                          <div className="grid grid-cols-4 gap-2">
                            {(["Kg", "Libras", "Pesos", "%"] as const).map((config) => (
                              <button
                                key={config}
                                type="button"
                                onClick={() => setDetailLoadConfig(config)}
                                className={`h-11 rounded-lg text-xs font-bold transition-all border flex items-center justify-center ${
                                  detailLoadConfig === config
                                    ? "bg-primary text-background-dark border-primary font-black shadow-md shadow-primary/10"
                                    : "bg-white/5 text-text-secondary border-border-dark hover:text-white hover:bg-white/10"
                                }`}
                              >
                                {config}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2.5 bg-background-dark/30 border border-border-dark p-4 rounded-xl">
                          <div className="flex justify-between items-center">
                            <span className="text-text-primary text-xs font-black tracking-widest uppercase">3 - Pausa entre as Séries</span>
                            <span className="text-primary font-black text-sm uppercase bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-md">
                              {detailRest >= 60 
                                ? `${Math.floor(detailRest / 60)}m ${detailRest % 60}s` 
                                : `${detailRest} seg`}
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="300"
                            step="5"
                            value={detailRest}
                            onChange={(e) => setDetailRest(parseInt(e.target.value))}
                            className="w-full accent-primary h-2 bg-border-dark rounded-lg appearance-none cursor-pointer mt-2"
                          />
                          <div className="flex justify-between text-[10px] text-text-secondary uppercase font-bold mt-1">
                            <span>Sem Pausa</span>
                            <span>1 M</span>
                            <span>2 M</span>
                            <span>3 M</span>
                            <span>5 M</span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-3">
                          <div className="flex items-center justify-between">
                            <span className="text-text-primary text-xs font-black tracking-widest uppercase">4 - Configuração das Séries</span>
                            <button
                              type="button"
                              onClick={() => {
                                setDetailSeries([
                                  ...detailSeries,
                                  { id: `s-${Date.now()}-${Math.random()}`, reps: "10", weight: "" }
                                ]);
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-lg text-[11px] font-black transition-all"
                            >
                              <span className="material-symbols-outlined text-[12px]">add</span>
                              Adicionar Série
                            </button>
                          </div>

                          <div className="flex flex-col gap-2.5">
                            {detailSeries.map((set, sIdx) => (
                              <div 
                                key={set.id || sIdx}
                                className="bg-background-dark/40 border border-border-dark p-3 rounded-lg flex items-center justify-between gap-4 animate-in fade-in zoom-in-95"
                              >
                                <span className="text-white text-xs font-black uppercase tracking-wider shrink-0 min-w-[50px]">Série {sIdx + 1}</span>
                                
                                <div className="flex-1 flex items-center gap-3 min-w-0">
                                  <div className="flex-1 flex flex-col gap-1 min-w-0">
                                    <span className="text-[9px] font-bold text-text-secondary uppercase tracking-widest leading-none">Reps / Tempo</span>
                                    <input
                                      type="text"
                                      value={set.reps}
                                      onChange={(e) => {
                                        const updated = [...detailSeries];
                                        updated[sIdx].reps = e.target.value;
                                        setDetailSeries(updated);
                                      }}
                                      placeholder="Ex: 8 a 10"
                                      className="w-full h-10 rounded bg-card-dark border border-border-dark text-white text-xs text-center font-bold focus:border-primary focus:outline-none"
                                    />
                                  </div>

                                  <div className="flex-1 flex flex-col gap-1 min-w-0">
                                    <span className="text-[9px] font-bold text-text-secondary uppercase tracking-widest leading-none">Carga ({detailLoadConfig})</span>
                                    <input
                                      type="text"
                                      value={set.weight}
                                      onChange={(e) => {
                                        const updated = [...detailSeries];
                                        updated[sIdx].weight = e.target.value;
                                        setDetailSeries(updated);
                                      }}
                                      placeholder="P. Corporal"
                                      className="w-full h-10 rounded bg-card-dark border border-border-dark text-white text-xs text-center font-bold focus:border-primary focus:outline-none"
                                    />
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  disabled={detailSeries.length <= 1}
                                  onClick={() => {
                                    setDetailSeries(detailSeries.filter((_, i) => i !== sIdx));
                                  }}
                                  className="size-9 rounded bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white flex items-center justify-center transition-all disabled:opacity-20 shrink-0 font-bold"
                                  title="Excluir"
                                >
                                  <span className="material-symbols-outlined text-sm font-bold">close</span>
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <span className="text-text-primary text-xs font-black tracking-widest uppercase">5 - Link de Vídeo demonstrativo (YouTube)</span>
                          <input
                            type="url"
                            value={detailVideoUrl}
                            onChange={(e) => setDetailVideoUrl(e.target.value)}
                            placeholder="https://www.youtube.com/watch?v=..."
                            className="w-full h-12 rounded-lg bg-background-dark/55 border border-border-dark text-white px-4 text-xs focus:outline-none focus:border-primary font-mono font-bold"
                          />
                        </div>

                        <div className="flex flex-col gap-2">
                          <span className="text-text-primary text-xs font-black tracking-widest uppercase">6 - Instruções / Observações do Personal</span>
                          <textarea
                            value={detailNotes}
                            onChange={(e) => setDetailNotes(e.target.value)}
                            placeholder="Descreva a amplitude de movimento, cadência, pico de contração ou observações técnicas..."
                            className="w-full rounded-lg bg-background-dark/55 border border-border-dark text-white p-4 focus:outline-none focus:border-primary text-xs min-h-[90px] transition-all font-bold"
                          />
                        </div>

                        <div className="flex justify-between gap-4 pt-4 border-t border-border-dark mt-2 font-bold">
                          <button
                            type="button"
                            onClick={() => setWorkoutEditorStep("prescrever")}
                            className="px-6 py-3 border border-border-dark text-text-primary hover:text-white hover:bg-white/5 rounded-lg text-xs font-bold transition-all shrink-0"
                          >
                            Descartar e Voltar
                          </button>
                          <button
                            type="button"
                            onClick={saveExerciseDetail}
                            className="flex-1 max-w-xs h-12 bg-primary text-background-dark rounded-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center font-black text-sm shadow-lg shadow-primary/10"
                          >
                            Confirmar e Salvar Exercício
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                {/* Botão Salvar Ficha Fixo Mobile (Viewport screen fixed) */}
                {workoutEditorStep === "ficha" && (
                  <div className="fixed bottom-0 left-0 right-0 p-4 border-t border-border-dark bg-background-dark/95 backdrop-blur-md z-[1000] flex items-center justify-center lg:hidden pb-[calc(1rem+env(safe-area-inset-bottom))] animate-in slide-in-from-bottom duration-300">
                    <button
                      onClick={saveEntireFicha}
                      className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary text-background-dark hover:brightness-110 active:scale-[0.98] transition-all rounded-xl font-black shadow-lg shadow-primary/20 text-sm cursor-pointer select-none"
                    >
                      <span className="material-symbols-outlined text-base font-black">save</span>
                      Salvar Ficha
                    </button>
                  </div>
                )}

                {/* BOTTOM SHEET PARA GESTÃO DO SUB-TREINO (MOBILE) - MOVIDO PARA FORA DO CARD */}
                {mobileWorkoutActionIndex !== null && (
                  <div className="fixed inset-0 z-[1100] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    {/* Clique fora fecha */}
                    <div 
                      className="absolute inset-0 cursor-pointer" 
                      onClick={() => {
                        setMobileWorkoutActionIndex(null);
                        setEditingWorkoutNameIndex(null);
                        setIsEditingInlineName(false);
                      }} 
                    />

                    <div className="relative w-full sm:max-w-md bg-card-dark border-t border-border-dark rounded-t-[2rem] p-6 pb-12 flex flex-col gap-6 z-10 animate-in slide-in-from-bottom duration-300 shadow-[0_-8px_30px_rgba(0,0,0,0.8)] text-left">
                      <div className="mx-auto w-12 h-1.5 bg-white/15 rounded-full" />

                      {/* Detalhes / título do bottom sheet */}
                      <div className="text-center pb-2">
                        <h3 className="text-white font-bold text-lg">
                          Opções do {subWorkouts[mobileWorkoutActionIndex]?.name}
                        </h3>
                        <p className="text-xs text-text-secondary mt-1">
                          Escolha o que deseja fazer com este treino.
                        </p>
                      </div>

                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                          <label className="text-xs text-text-secondary font-bold uppercase tracking-wider">Nome do Treino</label>
                          <div className="flex gap-2 items-center bg-background-dark/50 border border-border-dark rounded-xl px-3 py-1 transition-all">
                            <input
                              type="text"
                              value={tempWorkoutName}
                              onChange={(e) => setTempWorkoutName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  if (!tempWorkoutName.trim()) {
                                    alert("O nome do treino não pode ficar vazio.");
                                    return;
                                  }
                                  const updated = [...subWorkouts];
                                  updated[mobileWorkoutActionIndex].name = tempWorkoutName.trim();
                                  setSubWorkouts(updated);
                                  setMobileWorkoutActionIndex(null);
                                }
                              }}
                              className="flex-1 bg-transparent border-none text-white text-sm font-bold focus:outline-none focus:ring-0 focus:ring-offset-0 focus:border-none outline-none py-2"
                              placeholder="Nome do Treino"
                              autoFocus
                            />
                            <button
                              onClick={() => {
                                if (!tempWorkoutName.trim()) {
                                  alert("O nome do treino não pode ficar vazio.");
                                  return;
                                }
                                const updated = [...subWorkouts];
                                updated[mobileWorkoutActionIndex].name = tempWorkoutName.trim();
                                setSubWorkouts(updated);
                                setMobileWorkoutActionIndex(null);
                              }}
                              className="size-8 rounded-lg bg-primary flex items-center justify-center text-background-dark transition-all active:scale-90"
                              title="Salvar"
                            >
                              <span className="material-symbols-outlined text-sm font-black">check</span>
                            </button>
                          </div>
                        </div>

                        {isConfirmingDeleteSubWorkout ? (
                          <div className="flex flex-col gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl animate-in fade-in zoom-in-95 duration-200">
                            <p className="text-white text-xs font-semibold leading-relaxed">
                              Deseja excluir o <span className="text-red-400 font-bold">{subWorkouts[mobileWorkoutActionIndex]?.name || "treino"}</span>? Todos os exercícios acoplados serão apagados permanentemente.
                            </p>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => setIsConfirmingDeleteSubWorkout(false)}
                                className="flex-1 py-2 px-3 rounded-lg border border-border-dark text-white font-bold hover:bg-white/5 transition-all text-xs cursor-pointer select-none"
                              >
                                Cancelar
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = subWorkouts.filter((_, i) => i !== mobileWorkoutActionIndex);
                                  setSubWorkouts(updated);
                                  setMobileWorkoutActionIndex(null);
                                  setIsConfirmingDeleteSubWorkout(false);
                                }}
                                className="flex-1 py-2 px-3 rounded-lg bg-red-500 text-white font-bold hover:brightness-110 transition-all text-xs cursor-pointer select-none"
                              >
                                Confirmar Exclusão
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setIsConfirmingDeleteSubWorkout(true);
                            }}
                            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 rounded-xl text-sm font-bold transition-all"
                          >
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                            Excluir Treino
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* BOTTOM SHEET PARA GESTÃO DA FICHA DE TREINO (MOBILE) - NO PAINEL DE EDICAO */}
                {isFichaMenuOpen && (
                  <div className="fixed inset-0 z-[1100] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    {/* Clique fora do bottom sheet para fechar */}
                    <div 
                      className="absolute inset-0 cursor-pointer" 
                      onClick={() => setIsFichaMenuOpen(false)} 
                    />

                    <div className="relative w-full sm:max-w-md bg-card-dark border-t border-border-dark rounded-t-[2rem] p-6 pb-12 flex flex-col gap-6 z-10 animate-in slide-in-from-bottom duration-300 shadow-[0_-8px_30px_rgba(0,0,0,0.8)] text-left">
                      <div className="mx-auto w-12 h-1.5 bg-white/15 rounded-full" />

                      {/* Header do Bottom Sheet */}
                      <div className="text-center pb-2">
                        <h3 className="text-white font-bold text-lg">
                          Opções da Ficha
                        </h3>
                        <p className="text-xs text-text-secondary mt-1">
                          Gerencie as definições gerais desta ficha de treino.
                        </p>
                      </div>

                      {/* Conteúdo */}
                      <div className="flex flex-col gap-4">
                        {/* 1. Nome da Ficha (Editar diretamente) */}
                        <div className="flex flex-col gap-2">
                          <label className="text-xs text-text-secondary font-bold uppercase tracking-wider">Nome da Ficha</label>
                          <div className="flex gap-2 items-center bg-background-dark/50 border border-border-dark rounded-xl px-3 py-1 transition-all">
                            <input
                              type="text"
                              value={workoutName}
                              onChange={(e) => setWorkoutName(e.target.value)}
                              className="flex-1 bg-transparent border-none text-white text-sm font-bold focus:outline-none focus:ring-0 focus:ring-offset-0 focus:border-none outline-none py-2"
                              placeholder="Nome da Ficha"
                            />
                          </div>
                        </div>

                        {/* 2. Ativar Ficha */}
                        <div className="flex flex-col gap-2">
                          <label className="text-xs text-text-secondary font-bold uppercase tracking-wider">Status da Ficha</label>
                          <button
                            type="button"
                            onClick={() => setFichaIsActive(!fichaIsActive)}
                            className="w-full flex items-center justify-between gap-3 px-4 py-3.5 bg-white/5 hover:bg-white/10 border border-border-dark text-white rounded-xl text-sm font-bold transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <span className={`material-symbols-outlined text-[20px] ${fichaIsActive ? 'text-primary' : 'text-text-secondary'}`}>
                                {fichaIsActive ? 'toggle_on' : 'toggle_off'}
                              </span>
                              <span>{fichaIsActive ? 'Ficha Ativa' : 'Ficha Inativa'}</span>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded font-black ${fichaIsActive ? 'bg-primary/20 text-primary' : 'bg-white/10 text-text-secondary'}`}>
                              {fichaIsActive ? 'ATIVO' : 'INATIVO'}
                            </span>
                          </button>
                        </div>

                        {/* 3. Periodização */}
                        <div className="flex flex-col gap-3">
                          <label className="text-xs text-text-secondary font-bold uppercase tracking-wider">Periodização</label>
                          <div className="grid grid-cols-3 gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setFichaPeriodizationType(null);
                                setFichaPeriodizationValue("");
                              }}
                              className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition-all border ${
                                fichaPeriodizationType === null
                                  ? 'bg-primary/25 border-primary text-primary font-black'
                                  : 'bg-white/5 border-border-dark text-text-secondary hover:text-white'
                              }`}
                            >
                              Nenhum
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setFichaPeriodizationType("treinos");
                                setFichaPeriodizationValue("15");
                              }}
                              className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition-all border ${
                                fichaPeriodizationType === "treinos"
                                  ? 'bg-primary/25 border-primary text-primary font-black'
                                  : 'bg-white/5 border-border-dark text-text-secondary hover:text-white'
                              }`}
                            >
                              Nº Treinos
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const defaultDate = new Date();
                                defaultDate.setDate(defaultDate.getDate() + 30);
                                const dateStr = defaultDate.toISOString().split('T')[0];
                                setFichaPeriodizationType("data");
                                setFichaPeriodizationValue(dateStr);
                              }}
                              className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition-all border ${
                                fichaPeriodizationType === "data"
                                  ? 'bg-primary/25 border-primary text-primary font-black'
                                  : 'bg-white/5 border-border-dark text-text-secondary hover:text-white'
                              }`}
                            >
                              Data Venc.
                            </button>
                          </div>

                          {fichaPeriodizationType === "treinos" && (
                            <div className="flex items-center gap-3 bg-background-dark/50 border border-border-dark rounded-xl px-3 py-1 mt-1 animate-in fade-in zoom-in-95 duration-100">
                              <span className="material-symbols-outlined text-text-secondary text-lg">calendar_today</span>
                              <input
                                type="number"
                                min="1"
                                value={fichaPeriodizationValue}
                                onChange={(e) => setFichaPeriodizationValue(e.target.value)}
                                className="flex-1 bg-transparent border-none text-white text-sm font-bold focus:outline-none focus:ring-0 outline-none py-2"
                                placeholder="Ex: 20 treinos"
                              />
                              <span className="text-xs text-text-secondary font-bold pr-2">Treinos</span>
                            </div>
                          )}

                          {fichaPeriodizationType === "data" && (
                            <div className="flex items-center gap-3 bg-background-dark/50 border border-border-dark rounded-xl px-3 py-1 mt-1 animate-in fade-in zoom-in-95 duration-100">
                              <span className="material-symbols-outlined text-text-secondary text-lg">date_range</span>
                              <input
                                type="date"
                                value={fichaPeriodizationValue}
                                onChange={(e) => setFichaPeriodizationValue(e.target.value)}
                                className="flex-1 bg-transparent border-none text-white text-sm font-bold focus:outline-none focus:ring-0 outline-none py-2 filter invert brightness-90"
                              />
                            </div>
                          )}
                        </div>

                        {/* 4. Remover / Excluir Ficha */}
                        <div className="border-t border-border-dark/60 pt-4 mt-2">
                          {isConfirmingDeleteFicha ? (
                            <div className="flex flex-col gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl animate-in fade-in zoom-in-95 duration-200">
                              <p className="text-white text-xs font-semibold leading-relaxed">
                                Deseja realmente excluir esta ficha? Todos os treinos serão apagados permanentemente do sistema.
                              </p>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => setIsConfirmingDeleteFicha(false)}
                                  className="flex-1 py-2 px-3 rounded-lg border border-border-dark text-white font-bold hover:bg-white/5 transition-all text-xs cursor-pointer select-none"
                                >
                                  Cancelar
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      if (editingWorkoutId && editingWorkoutId !== "new") {
                                        await dataService.deleteWorkout(editingWorkoutId);
                                      }
                                      setEditingWorkoutId(null);
                                      setIsFichaMenuOpen(false);
                                      setIsConfirmingDeleteFicha(false);
                                    } catch (e) {
                                      console.error(e);
                                    }
                                  }}
                                  className="flex-1 py-2 px-3 rounded-lg bg-red-500 text-white font-bold hover:brightness-110 transition-all text-xs cursor-pointer select-none"
                                >
                                  Confirmar Exclusão
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setIsConfirmingDeleteFicha(true);
                              }}
                              className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 rounded-xl text-sm font-bold transition-all"
                            >
                              <span className="material-symbols-outlined text-[20px]">delete_forever</span>
                              Excluir Ficha de Treino
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            );
            } else {
              return (
                <div className="bg-card-dark/80 backdrop-blur-md rounded-xl border border-border-dark p-12 shadow-sm flex flex-col items-center justify-center text-center gap-4">
                  <div className="size-16 rounded-full bg-white/5 flex items-center justify-center text-text-secondary border border-border-dark">
                    <span className="material-symbols-outlined text-4xl text-primary/70">
                      fitness_center
                    </span>
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">
                      Nenhuma Ficha Selecionada
                    </h3>
                    <p className="text-text-secondary text-sm max-w-xs mx-auto">
                      Selecione uma ficha ao lado ou crie uma nova para começar a editar os treinos e prescrever exercícios de forma avançada.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setPreAssignedStudentId(null);
                      startEditingWorkout('new');
                    }}
                    className="mt-2 flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-background-dark hover:brightness-110 transition-colors text-sm font-bold shadow-lg shadow-primary/20"
                  >
                    <span className="material-symbols-outlined text-base">add</span>
                    Nova Ficha de Treino
                  </button>
                </div>
              );
            }
          })()}
        </div>
      </div>

      {/* Bottom Sheet de Exercícios Configurados para Mobile (Reposicionado e Independente) */}
      {isMobileScreen && editingWorkoutId !== null && workoutEditorStep === "prescrever" && activeSubWorkoutIndex !== null && (
        <AnimatePresence>
          {isMobileBottomSheetExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileBottomSheetExpanded(false)}
              className="fixed inset-0 bg-[#000]/60 z-40"
            />
          )}

          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: isMobileBottomSheetExpanded ? 0 : "calc(100% - 64px)" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="fixed bottom-0 left-0 right-0 bg-[#102216] border-t border-border-dark shadow-[0_-10px_30px_rgba(0,0,0,0.6)] z-50 rounded-t-3xl flex flex-col pointer-events-auto"
            style={{ height: isMobileBottomSheetExpanded ? "70vh" : "64px" }}
          >
            {/* Barra de Toque e Resumo (recolhido/expandido) */}
            <div 
              onClick={() => setIsMobileBottomSheetExpanded(!isMobileBottomSheetExpanded)}
              className="flex flex-col items-center justify-center h-16 w-full cursor-pointer select-none px-6 shrink-0 border-b border-border-dark/30"
            >
              <div className="w-12 h-1 bg-white/20 rounded-full mb-1" />
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-xl">fact_check</span>
                  <span className="text-white text-sm font-bold">
                    {subWorkouts[activeSubWorkoutIndex]?.exercises?.length || 0} Exercícios Configurados
                  </span>
                </div>
                <span className="material-symbols-outlined text-text-secondary select-none">
                  {isMobileBottomSheetExpanded ? "keyboard_arrow_down" : "keyboard_arrow_up"}
                </span>
              </div>
            </div>

            {/* Conteúdo Expandido */}
            {isMobileBottomSheetExpanded && (
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-[#102216] min-h-0 pb-[calc(4rem+env(safe-area-inset-bottom))] animate-in fade-in duration-200">
                {(subWorkouts[activeSubWorkoutIndex]?.exercises || []).map((ex: any, idx: number) => (
                  <div 
                    key={`mobile-bottomsheet-ex-${ex.id || idx}`}
                    className="bg-card-dark border border-border-dark/60 p-3.5 rounded-xl flex items-center justify-between gap-4 transition-all"
                    onClick={() => {
                      openExerciseDetailForEdit(ex);
                      setIsMobileBottomSheetExpanded(false);
                    }}
                  >
                    <div className="flex-1 min-w-0 cursor-pointer">
                      <h5 className="text-white font-bold text-sm leading-tight">{ex.name}</h5>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-text-secondary mt-1.5 uppercase tracking-wider">
                        <span>{ex.series?.length || 0} Séries ({ex.seriesForm})</span>
                        <span>•</span>
                        <span>Pausa: {ex.rest}s</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => {
                          openExerciseDetailForEdit(ex);
                          setIsMobileBottomSheetExpanded(false);
                        }}
                        className="size-8 rounded bg-white/5 border border-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-all"
                        title="Editar"
                      >
                        <span className="material-symbols-outlined text-base">edit</span>
                      </button>
                      <button
                        onClick={() => deleteConfiguredExercise(ex.id)}
                        className="size-8 rounded bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center transition-all"
                        title="Remover"
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                    </div>
                  </div>
                ))}

                {(subWorkouts[activeSubWorkoutIndex]?.exercises || []).length === 0 && (
                  <div className="py-12 text-center text-text-secondary flex flex-col items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-4xl opacity-30">checklist</span>
                    <p className="text-xs">Nenhum exercício configurado ainda neste treino.</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
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
                  {deletingLibExerciseId === libEx.id ? (
                    <div className="flex-1 flex gap-2 animate-in fade-in duration-200">
                      <button
                        onClick={() => setDeletingLibExerciseId(null)}
                        className="flex-1 py-2 rounded-lg bg-background-dark border border-border-dark text-text-secondary hover:text-white transition-all text-xs font-bold"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={async () => {
                          await dataService.deleteExercise(libEx.id);
                          setDeletingLibExerciseId(null);
                        }}
                        className="flex-1 py-2 rounded-lg bg-red-500 text-white transition-all text-xs font-bold"
                      >
                        Confirmar
                      </button>
                    </div>
                  ) : (
                    <>
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
                        onClick={() => {
                          setDeletingLibExerciseId(libEx.id);
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg text-xs font-bold transition-colors border border-transparent hover:border-red-600"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          delete
                        </span>
                        Excluir
                      </button>
                    </>
                  )}
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
        return (
          <TrainerChat 
            user={user} 
            onChatStateChange={setIsChatOpenOnMobile} 
            initialStudentId={chatInitialStudentId}
            onBackToStudentProfile={() => {
              if (chatBackToStudent) {
                setMobileSelectedStudent(chatBackToStudent);
                setActiveTab('students');
                setChatBackToStudent(null);
                setChatInitialStudentId(null);
              }
            }}
            onExitChat={() => {
              if (tabBeforeChat) {
                setActiveTab(tabBeforeChat);
                setTabBeforeChat(null);
              } else {
                setActiveTab('students');
              }
            }}
          />
        );
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

  const hideTopNav = (activeTab === "chat" && isChatOpenOnMobile) || 
    (activeTab === "students" && (mobileSelectedStudent !== null || editingStudentProfile !== null));

  const hideBottomNav = activeTab === "chat" || 
    activeTab === "workouts" ||
    (activeTab === "students" && (mobileSelectedStudent !== null || editingStudentProfile !== null));

  return (
    <div className="flex h-[100dvh] bg-background-dark overflow-hidden">
      <Sidebar
        user={user}
        onLogout={onLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <main className="flex-1 flex flex-col min-w-0 h-[100dvh] overflow-hidden">
        {/* Mobile Header / Top Navbar */}
        <header className={`md:hidden flex items-center justify-between px-4 h-16 bg-primary border-b border-primary shrink-0 z-40 fixed top-0 w-full left-0 right-0 transition-transform duration-300 ease-in-out ${hideTopNav ? '-translate-y-[100%] pointer-events-none' : 'translate-y-0'}`}>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-background-dark fill text-2xl">
              fitness_center
            </span>
            <span className="font-black text-xl tracking-tighter text-background-dark">
              StarFit
            </span>
          </div>
          <div className="flex items-center gap-2">
             {user.username && (
               <>
                 <button
                    onClick={() => setShowQRCode(true)}
                    className="flex items-center justify-center size-10 rounded-lg text-background-dark hover:bg-background-dark/10 transition-all font-bold"
                 >
                    <span className="material-symbols-outlined">qr_code</span>
                 </button>
                 <button
                    onClick={() => {
                       setTabBeforeChat(activeTab);
                       setActiveTab('chat');
                    }}
                    className="flex items-center justify-center size-10 rounded-lg text-background-dark hover:bg-background-dark/10 transition-all font-bold"
                 >
                    <span className="material-symbols-outlined">chat</span>
                 </button>
               </>
             )}
            <motion.button 
              onClick={markAnnouncementsRead}
              animate={unreadAnnouncements > 0 ? {
                borderColor: ["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 0.4)", "rgba(0, 0, 0, 0)"],
                backgroundColor: ["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 0.1)", "rgba(0, 0, 0, 0)"],
              } : {}}
              transition={unreadAnnouncements > 0 ? { repeat: Infinity, duration: 2 } : {}}
              className="relative flex items-center justify-center size-10 text-background-dark hover:bg-background-dark/10 border border-transparent rounded-lg transition-all font-bold"
            >
              <span className="material-symbols-outlined">notifications</span>
              {unreadAnnouncements > 0 && (
                <span className="absolute top-1 right-1 bg-background-dark text-primary text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-primary">
                  {unreadAnnouncements}
                </span>
              )}
            </motion.button>
          </div>
        </header>

        {/* Padding for mobile top nav */}
        <div className={`md:hidden shrink-0 transition-[height] duration-300 ease-in-out ${hideTopNav ? 'h-0' : 'h-16'}`}></div>

        <div className={`flex-1 overflow-hidden flex flex-col ${activeTab === 'chat' ? 'p-0 pb-0 md:pb-0' : hideTopNav ? 'overflow-y-auto p-4 md:p-8 pb-10' : 'overflow-y-auto p-4 md:p-8 pb-[calc(10rem+env(safe-area-inset-bottom))] md:pb-8'}`}>
          <div className={`${activeTab === 'chat' ? 'w-full h-full' : 'max-w-7xl mx-auto w-full'}`}>{renderContent()}</div>
        </div>

        {/* Mobile Bottom Navbar */}
        <nav className={`md:hidden fixed bottom-1 left-0 right-0 h-[84px] z-50 transition-transform duration-300 ease-in-out ${hideBottomNav ? 'translate-y-[100%] pointer-events-none' : 'translate-y-0'}`}>
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 375 84" preserveAspectRatio="none">
            <path
              d="M0 0 H120 C135 0 140 3 145 10 C 158 52 217 52 230 10 C 235 3 240 0 255 0 H375 V84 H0 Z"
              className="fill-card-dark"
            />
            <path
              d="M0 0 H120 C135 0 140 3 145 10 C 158 52 217 52 230 10 C 235 3 240 0 255 0 H375"
              className="stroke-primary"
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
            <div className={`relative w-[80px] h-[80px] -mt-[110px] flex items-center justify-center transition-transform duration-300 ease-in-out ${hideBottomNav ? 'translate-y-[100%] pointer-events-none' : 'translate-y-0'} z-50`}>
              {/* Floating Menu options */}
              {isMobileActionMenuOpen && (
                <div className="absolute bottom-[95px] left-1/2 -translate-x-1/2 flex flex-col gap-3 min-w-[245px] items-center z-[1000] drop-shadow-2xl">
                  {/* Option 1: Criar ficha para aluno */}
                  <div className="w-full transition-all animate-in slide-in-from-bottom-4 duration-300 ease-out fill-mode-both">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsMobileActionMenuOpen(false);
                        setIsCreatingWorkoutForStudentFlow(true);
                        setActiveTab("students");
                      }}
                      className="w-full bg-card-dark/95 backdrop-blur-md border border-border-dark active:border-primary/50 text-white rounded-2xl p-3 flex items-center gap-3.5 shadow-[0_12px_30px_rgba(0,0,0,0.7)] hover:brightness-110 active:scale-95 transition-all text-left"
                    >
                      <div className="size-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                        <span className="material-symbols-outlined font-bold text-xl">person_add</span>
                      </div>
                      <div className="flex flex-col select-none">
                        <span className="text-sm font-black text-white leading-tight">Criar ficha para aluno</span>
                        <span className="text-[9px] text-text-secondary leading-normal">Selecionar aluno da lista</span>
                      </div>
                    </button>
                  </div>

                  {/* Option 2: Criar ficha modelo */}
                  <div className="w-full transition-all animate-in slide-in-from-bottom-4 duration-300 ease-out delay-75 fill-mode-both">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingWorkoutId("new");
                        setPreAssignedStudentId(null);
                        setWorkoutName("Ficha Modelo");
                        setSubWorkouts([]);
                        setActiveTab("workouts");
                        setIsMobileActionMenuOpen(false);
                      }}
                      className="w-full bg-card-dark/95 backdrop-blur-md border border-border-dark active:border-primary/50 text-white rounded-2xl p-3 flex items-center gap-3.5 shadow-[0_12px_30px_rgba(0,0,0,0.7)] hover:brightness-110 active:scale-95 transition-all text-left"
                    >
                      <div className="size-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                        <span className="material-symbols-outlined font-bold text-xl">layers</span>
                      </div>
                      <div className="flex flex-col select-none">
                        <span className="text-sm font-black text-white leading-tight">Criar ficha modelo</span>
                        <span className="text-[9px] text-text-secondary leading-normal">Sem vincular a aluno</span>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              <button
                  onClick={() => setIsMobileActionMenuOpen(!isMobileActionMenuOpen)}
                  className={`flex items-center justify-center rounded-full transition-all ease-out duration-250 active:scale-95 ${
                    isMobileActionMenuOpen 
                      ? 'size-[68px] bg-primary text-background-dark border-0 border-transparent shadow-[0_12px_35px_rgba(19,236,91,0.4)]' 
                      : (activeTab === 'workouts')
                        ? 'size-[80px] bg-primary text-background-dark scale-105 border-4 border-background-dark shadow-[0_12px_35px_rgba(19,236,91,0.4)]' 
                        : 'size-[80px] bg-primary text-background-dark/90 border-4 border-background-dark shadow-[0_12px_30px_rgba(0,0,0,0.5),0_0_20px_rgba(19,236,91,0.25)] hover:brightness-110'
                  }`}
              >
                  {isMobileActionMenuOpen ? (
                    <span className="material-symbols-outlined text-[28px] drop-shadow-sm font-bold animate-in spin-in-12 duration-250">close</span>
                  ) : (
                    <span className="material-symbols-outlined text-[40px] drop-shadow-sm font-bold animate-in zoom-in-50 duration-200">fitness_center</span>
                  )}
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

        {/* Mobile floating action menu blurred backdrop overlay */}
        {isMobileActionMenuOpen && (
          <div 
            onClick={() => setIsMobileActionMenuOpen(false)}
            className="md:hidden fixed inset-0 bg-background-dark/60 backdrop-blur-sm z-40 transition-all duration-300 animate-in fade-in cursor-pointer"
          />
        )}

        {/* Student selection modal for mobile workout creation */}
        {isSelectingStudentForWorkout && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-background-dark/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card-dark border border-border-dark w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
              <div className="flex items-center justify-between p-4 border-b border-border-dark bg-background-dark/50 shrink-0">
                <h3 className="text-white font-bold tracking-tight text-sm">
                  Selecionar Aluno para o Treino
                </h3>
                <button 
                  onClick={() => {
                    setIsSelectingStudentForWorkout(false);
                    setStudentSearchForWorkout("");
                  }}
                  className="text-text-secondary hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Student Search */}
              <div className="p-3 bg-background-dark/20 border-b border-border-dark shrink-0">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-sm">
                    search
                  </span>
                  <input
                    type="text"
                    placeholder="Pesquisar aluno..."
                    value={studentSearchForWorkout}
                    onChange={(e) => setStudentSearchForWorkout(e.target.value)}
                    className="w-full bg-background-dark/50 border border-border-dark/60 rounded-xl py-2 pl-9 pr-4 text-white text-sm focus:outline-none focus:border-primary transition-all"
                  />
                </div>
              </div>

              {/* Student List */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
                {studentsData.filter(s => s.name.toLowerCase().includes(studentSearchForWorkout.toLowerCase())).length === 0 ? (
                  <div className="text-center py-8 text-text-secondary">
                    <span className="material-symbols-outlined text-4xl mb-2 opacity-55">group_off</span>
                    <p className="text-sm">Nenhum aluno encontrado</p>
                  </div>
                ) : (
                  studentsData
                    .filter(s => s.name.toLowerCase().includes(studentSearchForWorkout.toLowerCase()))
                    .map((student) => (
                      <button
                        key={student.id}
                        onClick={() => {
                          setEditingWorkoutId("new");
                          setPreAssignedStudentId(student.id);
                          setWorkoutName(`Treino Exclusivo - ${student.name}`);
                          setExercises([]);
                          setActiveTab("workouts");
                          setIsSelectingStudentForWorkout(false);
                          setStudentSearchForWorkout("");
                        }}
                        className="w-full flex items-center gap-3 p-3 bg-background-dark/40 hover:bg-white/5 border border-border-dark/50 rounded-xl hover:border-primary/30 transition-all text-left"
                      >
                        <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col overflow-hidden">
                          <span className="text-sm font-bold text-white truncate">{student.name}</span>
                          {student.username && <span className="text-xs text-text-secondary truncate">{student.username}</span>}
                        </div>
                        <span className="material-symbols-outlined text-sm text-text-secondary ml-auto shrink-0">arrow_forward</span>
                      </button>
                    ))
                )}
              </div>
            </div>
          </div>
        )}
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
