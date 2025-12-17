import { Exercise, WorkoutTemplate, WorkoutSession, UserProfile, WeightEntry } from '../models';

export const MOCK_EXERCISES: Exercise[] = [
    {
        id: '1',
        name: 'Back Squat',
        enabledMetrics: ['load', 'reps'],
        repsType: 'standard',
    },
    {
        id: '2',
        name: 'Bench Press',
        enabledMetrics: ['load', 'reps'],
        repsType: 'standard',
    },
    {
        id: '3',
        name: 'Deadlift',
        enabledMetrics: ['load', 'reps'],
    },
    {
        id: '4',
        name: 'Plank',
        enabledMetrics: ['time'],
    },
    {
        id: '5',
        name: 'Tempo Squat',
        enabledMetrics: ['load', 'reps'],
        repsType: 'tempo',
    },
];

export const MOCK_TEMPLATES: WorkoutTemplate[] = [
    {
        id: 't1',
        name: 'Leg Day',
        exercises: [
            { exerciseId: '1', targetSets: 3, targetReps: '5', targetLoad: 100, sets: [] },
            { exerciseId: '3', targetSets: 3, targetReps: '5', targetLoad: 120, sets: [] },
            { exerciseId: '5', targetSets: 3, targetTempo: '3010', sets: [] }
        ]
    },
    {
        id: 't2',
        name: 'Upper Body',
        exercises: [
            { exerciseId: '2', targetSets: 4, targetReps: '8-10', targetLoad: 80, sets: [] }
        ]
    },
];

class DataService {
    private exercises: Exercise[] = [...MOCK_EXERCISES];
    private templates: WorkoutTemplate[] = [...MOCK_TEMPLATES];
    private sessions: WorkoutSession[] = [];

    // Default Mock Profile
    private userProfile: UserProfile = {
        id: 'u1',
        firstName: 'Pablo',
        lastName: 'Banon',
        email: 'pablo@example.com',
        sex: 'male',
        weightHistory: [
            { id: 'w1', date: new Date(Date.now() - 86400000 * 7).toISOString(), weightKg: 75.5 },
            { id: 'w2', date: new Date().toISOString(), weightKg: 76.0 },
        ]
    };

    getExercises(): Exercise[] {
        return this.exercises;
    }

    getUserProfile(): UserProfile {
        return this.userProfile;
    }

    updateUserProfile(updates: Partial<UserProfile>) {
        this.userProfile = { ...this.userProfile, ...updates };
    }

    addWeightEntry(weightKg: number) {
        const entry: WeightEntry = {
            id: Math.random().toString(),
            date: new Date().toISOString(),
            weightKg
        };
        this.userProfile.weightHistory.push(entry);
        // Sort by date descending
        this.userProfile.weightHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    getTemplates(): WorkoutTemplate[] {
        return this.templates;
    }

    addExercise(exercise: Exercise) {
        this.exercises.push(exercise);
    }

    addTemplate(template: WorkoutTemplate) {
        this.templates.push(template);
    }

    // ... other methods
}

export const dataService = new DataService();
