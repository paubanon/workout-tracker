import { supabaseService } from '../services/SupabaseDataService';
import { WorkoutSession, SetLog } from '../models';

// Simple ID generator since UUID is not available
const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

const MOCK_DATA = [
    { date: '2025-11-15T12:00:00Z', sets: [{ reps: 5, load: 40 }, { reps: 6, load: 40 }, { reps: 6, load: 40 }, { reps: 5, load: 40 }] },
    { date: '2025-11-17T12:00:00Z', sets: [{ reps: 6, load: 40 }, { reps: 5, load: 44 }, { reps: 6, load: 44 }, { reps: 6, load: 44 }] },
    { date: '2025-11-19T12:00:00Z', sets: [{ reps: 6, load: 40 }, { reps: 5, load: 44 }, { reps: 5, load: 44 }, { reps: 5, load: 44 }, { reps: 5, load: 44 }] },
    { date: '2025-11-22T12:00:00Z', sets: [{ reps: 6, load: 40 }, { reps: 6, load: 44 }, { reps: 6, load: 44 }, { reps: 5, load: 44 }] },
    { date: '2025-11-26T12:00:00Z', sets: [{ reps: 6, load: 40 }, { reps: 6, load: 44 }, { reps: 6, load: 44 }] },
    { date: '2025-11-29T12:00:00Z', sets: [{ reps: 6, load: 40 }, { reps: 5, load: 44 }, { reps: 5, load: 44 }, { reps: 5, load: 44 }] },
    { date: '2025-12-01T12:00:00Z', sets: [{ reps: 6, load: 40 }, { reps: 6, load: 44 }, { reps: 6, load: 48 }] },
    { date: '2025-12-03T12:00:00Z', sets: [{ reps: 6, load: 40 }, { reps: 6, load: 48 }, { reps: 6, load: 48 }] },
    { date: '2025-12-06T12:00:00Z', sets: [{ reps: 8, load: 44 }, { reps: 6, load: 48 }, { reps: 4, load: 48 }, { reps: 7, load: 48 }] },
    { date: '2025-12-08T12:00:00Z', sets: [{ reps: 8, load: 44 }, { reps: 4, load: 48 }, { reps: 6, load: 48 }, { reps: 5, load: 48 }] },
    { date: '2025-12-10T12:00:00Z', sets: [{ reps: 8, load: 44 }, { reps: 6, load: 48 }, { reps: 5, load: 52 }, { reps: 4, load: 52 }, { reps: 2, load: 48 }] },
    { date: '2025-12-13T12:00:00Z', sets: [{ reps: 8, load: 44 }, { reps: 6, load: 48 }, { reps: 6, load: 48 }, { reps: 4, load: 52 }, { reps: 2, load: 48 }] },
];

export const seedAnalysisData = async (): Promise<{ success: boolean; message: string }> => {
    try {
        console.log("Starting seed process...");

        // 1. Find Exercise
        const exercises = await supabaseService.getExercises();
        const targetName = "Seated Inclined Shoulder Press with dumbells";
        // Flexible matching
        const exercise = exercises.find(e =>
            e.name.toLowerCase().trim() === targetName.toLowerCase().trim() ||
            e.name.includes("Seated Inclined Shoulder")
        );

        if (!exercise) {
            return { success: false, message: `Exercise "${targetName}" not found. Please ensure it exists exactly.` };
        }

        console.log(`Found exercise: ${exercise.name} (${exercise.id})`);

        // 2. Insert Sessions
        let count = 0;
        for (const data of MOCK_DATA) {
            const sessionSets: SetLog[] = data.sets.map((s, index) => ({
                id: generateId(),
                exerciseId: exercise.id,
                setNumber: index + 1,
                reps: s.reps,
                loadKg: s.load,
                completed: true,
                rpe: 8, // Mock RPE
            }));

            const session: WorkoutSession = {
                id: generateId(), // Will be ignored by DB usually if auto-gen, but here we construct object
                date: data.date,
                name: `Shoulder Press Focus ${count + 1}`,
                sets: sessionSets,
                painEntries: [],
                durationSeconds: 3600,
                preSessionFatigue: 5
            };

            await supabaseService.addWorkoutSession(session);
            count++;
        }

        return { success: true, message: `Successfully added ${count} sessions for ${exercise.name}` };
    } catch (error: any) {
        console.error("Seed error:", error);
        return { success: false, message: `Error: ${error.message}` };
    }
};
