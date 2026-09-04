export type TrainingType = 'calisthenics' | 'home' | 'gym'
export type Goal = 'fat_loss' | 'recomp' | 'hypertrophy' | 'strength' | 'definition' | 'fitness' | 'skill'
export type Experience = 'new' | 'beginner' | 'intermediate' | 'advanced'
export type DifficultyFeedback = 'too_easy' | 'good' | 'hard' | 'near_limit' | 'failed'
export type RecoveryState = 'ready' | 'recovering' | 'fatigued'
export type UIMode = 'simple' | 'advanced'
export type SecondaryGoal = 'pullup_10' | 'pushup_30' | 'dip_20' | 'l_sit_20' | 'handstand' | 'pistol_squat'
export type MovementPattern = 'horizontal_push' | 'vertical_push' | 'horizontal_pull' | 'vertical_pull' | 'squat' | 'hinge' | 'lunge' | 'core' | 'carry' | 'isolation' | 'mobility' | 'conditioning'
export type ActivityMode = 'walk' | 'run' | 'jump_rope'
export type CardioIntensity = 'easy' | 'steady' | 'hard'
export type TrainingPhase = 'base' | 'build' | 'deload'
export type ExercisePreference = 'prefer' | 'neutral' | 'avoid'

export interface Exercise {
  id: string
  nameEnglish: string
  nameVietnamese?: string
  trainingTypes: TrainingType[]
  category: 'warmup' | 'compound' | 'accessory' | 'core' | 'mobility' | 'conditioning'
  primaryMuscles: string[]
  secondaryMuscles: string[]
  equipment: string[]
  difficulty: number
  movementPattern: MovementPattern
  instructionsVietnamese: string[]
  commonMistakesVietnamese: string[]
  breathingVietnamese: string
  safetyNotesVietnamese: string
  easierProgression?: string
  harderProgression?: string
  minReps?: number
  maxReps?: number
  holdSeconds?: number
  recommendedRest: number
  contraindicationTags: string[]
  unilateral?: boolean
  weighted?: boolean
}

export interface CardioPreference {
  enabled: boolean
  modes: ActivityMode[]
  sessionsPerWeek: number
  minutesByMode: Record<ActivityMode, number>
  avoidLegDays: boolean
}

export interface UserProfile {
  id: string
  name: string
  gender?: 'male' | 'female' | 'other'
  age?: number
  heightCm?: number
  weightKg?: number
  targetWeightKg?: number
  trainingType: TrainingType
  goal: Goal
  secondaryGoals: SecondaryGoal[]
  uiMode: UIMode
  experience: Experience
  daysPerWeek: number
  trainingDays: number[]
  sessionMinutes: number
  activityLevel: 'low' | 'medium' | 'high'
  equipment: string[]
  dumbbell?: { fixed: boolean; minKg: number; maxKg: number; stepKg: number }
  benchmarks: Record<string, number>
  injuries: string[]
  cardio: CardioPreference
  exercisePreferences: Record<string, ExercisePreference>
  unit: 'kg' | 'lb'
  theme: 'light' | 'dark'
  createdAt: string
}

export interface Readiness {
  energy: number
  soreness: number
  sleep: number
  motivation: number
  minutes: number
  lighter: boolean
}

export interface PlannedExercise {
  exerciseId: string
  name: string
  sets: number
  minReps?: number
  maxReps?: number
  seconds?: number
  restSeconds: number
  weightKg?: number
  note?: string
  progressionReason?: string
  selectionReason?: string
  plateau?: boolean
}

export interface CardioPlan {
  mode: ActivityMode
  title: string
  minutes: number
  intensity: CardioIntensity
  note: string
}

export interface ProgramDay {
  key: string
  title: string
  focus: string
  weekday: number
  exercises: PlannedExercise[]
  cardio?: CardioPlan
}

export interface TrainingProgram {
  id: string
  createdAt: string
  blockWeek: number
  blockLength: number
  phase: TrainingPhase
  blockTitle: string
  splitName: string
  explanation: string
  days: ProgramDay[]
}

export interface CompletedSet {
  reps?: number
  seconds?: number
  weightKg?: number
  completed: boolean
}

export interface WorkoutExerciseLog {
  exerciseId: string
  name: string
  planned: PlannedExercise
  sets: CompletedSet[]
  feedback?: DifficultyFeedback
  skipped?: boolean
}

export interface WorkoutSession {
  id: string
  programDayKey: string
  title: string
  startedAt: string
  completedAt?: string
  readiness?: Readiness
  exercises: WorkoutExerciseLog[]
  overallDifficulty?: number
  fatigue?: number
  abnormalPain?: boolean
  painArea?: string
  note?: string
  completionPct?: number
}

export interface ActivitySession {
  id: string
  programDayKey?: string
  mode: ActivityMode
  startedAt: string
  completedAt: string
  durationSeconds: number
  distanceKm?: number
  jumpCount?: number
  avgPaceSecPerKm?: number
  plannedMinutes?: number
  effort?: number
}

export interface BodyMetric {
  id: string
  date: string
  weightKg?: number
  waistCm?: number
  chestCm?: number
  armCm?: number
  thighCm?: number
}

export interface AppState {
  schemaVersion: number
  profile?: UserProfile
  program?: TrainingProgram
  sessions: WorkoutSession[]
  activities: ActivitySession[]
  metrics: BodyMetric[]
  activeSession?: WorkoutSession
  demoMode: boolean
}
