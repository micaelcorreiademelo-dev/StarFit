
export type UserRole = 'ADMIN' | 'TRAINER' | 'STUDENT';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
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
