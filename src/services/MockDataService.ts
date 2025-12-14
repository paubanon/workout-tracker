import { Exercise, WorkoutTemplate, WorkoutSession } from '../models';

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
        exerciseIds: ['1', '3', '5'],
    },
    {
        id: 't2',
        name: 'Upper Body',
        exerciseIds: ['2'],
    },
];

class DataService {
    private exercises: Exercise[] = [...MOCK_EXERCISES];
    private templates: WorkoutTemplate[] = [...MOCK_TEMPLATES];
    private sessions: WorkoutSession[] = [];

    getExercises(): Exercise[] {
        return this.exercises;
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
