export type MetricType = 'load' | 'reps' | 'time' | 'distance' | 'rom';

export type RepsType = 'standard' | 'tempo' | 'isometric';

export interface Exercise {
    id: string;
    name: string;
    enabledMetrics: MetricType[];
    repsType?: RepsType; // Only relevant if 'reps' is in enabledMetrics
    trackBodyWeight?: boolean;
    description?: string;
    // Future: tags, muscle groups
}

export interface SetLog {
    id: string;
    exerciseId: string;
    setNumber: number;

    // Metrics (Nullable because optional per exercise)
    loadKg?: number;
    reps?: number;
    timeSeconds?: number;
    distanceMeters?: number;
    romCm?: number;

    // Per-set subjective
    rpe?: number; // 0-10
    rir?: number; // 0-10

    // Tempo details (if repsType == tempo)
    tempo?: string; // e.g., "3010"

    completed: boolean;
    notes?: string;

    // Targets (for ghost values/reference)
    targetLoad?: number;
    targetReps?: string;
    targetTempo?: string;
    targetTime?: number;
    targetDistance?: number;
    targetRom?: string;
}

export interface PainEntry {
    intensity: number; // 0-10
    location?: string; // e.g. "Knee"
    type: 'joint' | 'injury' | 'other';
    notes?: string;
}

export interface WorkoutSession {
    id: string;
    date: string; // ISO String
    name?: string; // e.g., "Morning Upper Body"

    // Session Level
    durationSeconds?: number;
    preSessionFatigue?: number; // 0-10
    painEntries: PainEntry[];

    sets: SetLog[]; // Flat list of sets, ordered by timestamp/creation

    // Or grouped by exercise? 
    // Flat list is easier for "active" view where order changes
}

export interface WeightEntry {
    id: string;
    date: string;
    weightKg: number;
}

export interface UserProfile {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    sex: 'male' | 'female' | 'other';
    avatarUrl?: string; // Optional
    preferences?: {
        trackRpe?: boolean;
        theme?: 'light' | 'dark';
    };
    weightHistory: WeightEntry[];
}

export interface TemplateSet {
    targetReps?: string;
    targetLoad?: number;
    targetTempo?: string;
    targetTime?: number;
    targetDistance?: number;
    targetRom?: string;
}

export interface TemplateExercise {
    exerciseId: string;
    // We now support individual sets. If 'sets' is present, it overrides 'targetSets'.
    // Use targetSets count for backward compatibility or simple initialization 
    // if 'sets' array is empty.
    sets: TemplateSet[];

    // Deprecated but potentially kept for legacy template migration?
    // Actually, let's just use 'sets' length to determine set count.

    // Legacy support (optional)
    targetSets?: number;
    targetReps?: string;
    targetLoad?: number;
    targetTempo?: string;
    targetTime?: number;
    targetDistance?: number;
    targetRom?: string;
}

export interface WorkoutTemplate {
    id: string;
    name: string;
    exercises: TemplateExercise[];
}
