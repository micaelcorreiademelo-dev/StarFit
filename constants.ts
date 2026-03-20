
import { Exercise, MetricPoint } from './types';

export const MOCK_EXERCISES: Exercise[] = [
  { id: '1', name: 'Supino Reto', category: 'Peito', equipment: 'Barra', difficulty: 'Intermediário', imageUrl: 'https://picsum.photos/400/300?random=1' },
  { id: '2', name: 'Agachamento Livre', category: 'Pernas', equipment: 'Barra', difficulty: 'Avançado', imageUrl: 'https://picsum.photos/400/300?random=2' },
  { id: '3', name: 'Remada Curvada', category: 'Costas', equipment: 'Barra', difficulty: 'Intermediário', imageUrl: 'https://picsum.photos/400/300?random=3' },
  { id: '4', name: 'Rosca Direta', category: 'Bíceps', equipment: 'Halteres', difficulty: 'Iniciante', imageUrl: 'https://picsum.photos/400/300?random=4' },
];

export const MOCK_WEIGHT_DATA: MetricPoint[] = [
  { date: 'Jan', value: 84 },
  { date: 'Fev', value: 83.5 },
  { date: 'Mar', value: 83 },
  { date: 'Abr', value: 82.8 },
  { date: 'Mai', value: 82.6 },
  { date: 'Jun', value: 82.5 },
];

export const MOCK_MRR_DATA: MetricPoint[] = [
  { date: 'Jan', value: 38000 },
  { date: 'Fev', value: 40000 },
  { date: 'Mar', value: 42500 },
  { date: 'Abr', value: 44000 },
  { date: 'Mai', value: 45200 },
  { date: 'Jun', value: 45870 },
];
