// Tipos de contexto de comida
export type MealContext = 'fasting' | 'post-meal';

// Clasificaciones de glucosa
export type GlucoseClassification =
  | 'Normal'
  | 'Prediabetes'
  | 'Diabetes'
  | 'Elevado'
  | 'Hipoglucemia';

// Tipos de alerta
export type AlertSeverity = 'red' | 'yellow';
export type AlertType =
  | 'hypoglycemia'
  | 'frequent_post_meal_high'
  | 'frequent_high'
  | 'critical';

export interface GlucoseRecord {
  id: number;
  date: string;
  time: string;
  hadMeal: boolean;
  hoursSinceMeal: number | null;
  valueMmol: number;
  valueMgdl: number;
  classification: GlucoseClassification;
  createdAt: string;
  updatedAt: string;
}

export interface GlucoseInput {
  date: string;
  time: string;
  hadMeal: boolean;
  hoursSinceMeal?: number;
  valueMgdl: number;
}

export interface GlucoseMetrics {
  weeklyAverage: number;
  weeklyMax: number;
  trend: 'ascending' | 'descending' | 'stable';
  previousWeekAverage: number;
}

export interface GlucoseAlert {
  type: AlertType;
  severity: AlertSeverity;
  message: string;
}

export interface BloodPressureRecord {
  id: number;
  date: string;
  time: string;
  systolic: number;
  diastolic: number;
  pulse: number;
  createdAt: string;
  updatedAt: string;
}

export interface BloodPressureInput {
  date: string;
  time: string;
  systolic: number;
  diastolic: number;
  pulse: number;
}

export interface BPMetrics {
  avgSystolic: number;
  avgDiastolic: number;
  avgPulse: number;
  month: string;
}

export interface WeightRecord {
  id: number;
  date: string;
  weightKg: number;
  comments: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WeightInput {
  date: string;
  weightKg: number;
  comments?: string;
}

export interface ExerciseWeek {
  id: number;
  weekStart: string;
  days: Record<string, boolean>;
  avgMinutesPerDay: number | null;
}

// Tipos de ejercicio
export type ExerciseType = 'Caminata' | 'Carrera' | 'Bicicleta' | 'Fuerza' | 'Estiramientos';

export const EXERCISE_TYPES: ExerciseType[] = ['Caminata', 'Carrera', 'Bicicleta', 'Fuerza', 'Estiramientos'];

export interface ExerciseRecord {
  id: number;
  date: string;
  exerciseType: ExerciseType;
  durationMinutes: number;
  createdAt: string;
  updatedAt: string;
}

export interface ExerciseInput {
  date: string;
  exerciseType: ExerciseType;
  durationMinutes: number;
}

// Tipos de medicamento
export type MedicationType = 'Pastilla' | 'Inyección' | 'Jarabe' | 'Gotas' | 'Otro';
export const MEDICATION_TYPES: MedicationType[] = ['Pastilla', 'Inyección', 'Jarabe', 'Gotas', 'Otro'];

export type MedicationFrequency = 'each_8h' | 'each_12h' | 'once_daily' | 'each_6h' | 'each_24h' | 'custom';
export const MEDICATION_FREQUENCIES: { value: MedicationFrequency; label: string; hours: number }[] = [
  { value: 'each_6h', label: 'Cada 6 horas', hours: 6 },
  { value: 'each_8h', label: 'Cada 8 horas', hours: 8 },
  { value: 'each_12h', label: 'Cada 12 horas', hours: 12 },
  { value: 'once_daily', label: 'Una vez al día', hours: 24 },
  { value: 'each_24h', label: 'Cada 24 horas', hours: 24 },
];

export interface MedicationRecord {
  id: number;
  name: string;
  type: MedicationType;
  frequency: MedicationFrequency;
  frequencyHours: number;
  startTime: string;
  endDate: string | null;
  days: Record<string, boolean>;
  active: boolean;
  createdAt: string;
}

export interface MedicationInput {
  name: string;
  type: MedicationType;
  frequency: MedicationFrequency;
  frequencyHours: number;
  startTime: string;
  endDate?: string;
  days: Record<string, boolean>;
}
