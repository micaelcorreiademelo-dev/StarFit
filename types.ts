
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
