export type MetricType = 'load' | 'reps' | 'time' | 'distance' | 'rom';

export type RepsType = 'standard' | 'tempo' | 'isometric';

export interface Exercise {
    id: string;
    name: string;
    enabledMetrics: MetricType[];
    repsType?: RepsType; // Only relevant if 'reps' is in enabledMetrics
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
    preSessionFatigue?: number; // 0-10
    painEntries: PainEntry[];

    sets: SetLog[]; // Flat list of sets, ordered by timestamp/creation

    // Or grouped by exercise? 
    // Flat list is easier for "active" view where order changes
}

export interface WorkoutTemplate {
    id: string;
    name: string;
    exerciseIds: string[]; // Ordered list of exercises
}
