
export interface Plan {
  id: number;
  name: string;
  price: string;
  durationDays: number;
  features: string[];
  isPopular?: boolean;
  displayOnLandingPage?: boolean;
  showPriceOnLandingPage?: boolean;
  hiddenGlobal?: boolean;
  allowHiddenRenewal?: boolean;
}

export type UserRole = 'ADMIN' | 'TRAINER' | 'STUDENT';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  username?: string;
  specialty?: string;
  bio?: string;
  financialSettings?: {
    mpAccessToken?: string;
    mpPublicKey?: string;
    autoReminders?: boolean;
  };
  notifications?: {
    newStudent?: boolean;
    evaluationReminder?: boolean;
    chatMessages?: boolean;
  };
  subscriptionExpiry?: string;
  activePlan?: string;
  paymentStatus?: 'paid' | 'pending' | 'expired';
  trainerId?: string | null;
  trainerCode?: string;
  onboardingCompleted?: boolean;
  status?: string;
  plan?: string;
  trialUntil?: any;
  createdAt?: any;
  updatedAt?: any;
  studentsCount?: number;
  privacy?: {
    publicProfile?: boolean;
  };
}

export interface Exercise {
  id: string;
  name: string;
  category: string;
  equipment: string;
  difficulty: 'Iniciante' | 'Intermediário' | 'Avançado';
  imageUrl: string;
}

export interface Workout {
  id: string;
  name: string;
  assignedDate: string;
  duration: string;
  exercisesCount: number;
}

export interface MetricPoint {
  date: string;
  value: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: any;
  avatar?: string;
}

export interface Chat {
  id: string;
  trainerId: string;
  studentId: string;
  lastMessage?: string;
  lastMessageTime?: any;
  unreadCount?: Record<string, number>;
}
