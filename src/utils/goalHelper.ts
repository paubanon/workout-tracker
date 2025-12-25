import { SetLog, ExerciseGoal } from '../models';
import { supabaseService } from '../services/SupabaseDataService';

/**
 * Check if a completed set meets any active goals for that exercise
 * Returns the goal that was achieved, or null if none
 */
export const checkGoalAchievement = async (
    set: SetLog,
    exerciseId: string
): Promise<ExerciseGoal | null> => {
    // Get active (incomplete) goals for this exercise
    const goals = await supabaseService.getGoalsForExercise(exerciseId);
    const activeGoals = goals.filter(g => !g.completed);

    if (activeGoals.length === 0) return null;

    for (const goal of activeGoals) {
        if (isGoalMet(set, goal)) {
            // Mark goal as completed
            await supabaseService.markGoalCompleted(goal.id);
            return goal;
        }
    }

    return null;
};

/**
 * Check if a set meets all target metrics of a goal
 */
const isGoalMet = (set: SetLog, goal: ExerciseGoal): boolean => {
    // Check each defined target - ALL must be met
    if (goal.targetLoad !== undefined && goal.targetLoad !== null) {
        if (!set.loadKg || set.loadKg < goal.targetLoad) return false;
    }

    if (goal.targetReps !== undefined && goal.targetReps !== null) {
        if (!set.reps || set.reps < goal.targetReps) return false;
    }

    if (goal.targetTime !== undefined && goal.targetTime !== null) {
        if (!set.timeSeconds || set.timeSeconds < goal.targetTime) return false;
    }

    if (goal.targetDistance !== undefined && goal.targetDistance !== null) {
        if (!set.distanceMeters || set.distanceMeters < goal.targetDistance) return false;
    }

    if (goal.targetRom !== undefined && goal.targetRom !== null) {
        if (!set.romCm || set.romCm < goal.targetRom) return false;
    }

    if (goal.targetIsometricTime !== undefined && goal.targetIsometricTime !== null) {
        // Assuming timeSeconds matches isometric hold time logic if reps Type is isometric
        if (!set.timeSeconds || set.timeSeconds < goal.targetIsometricTime) return false;
    }

    if (goal.targetTempo !== undefined && goal.targetTempo !== null) {
        // Exact string match for tempo? Or just existence?
        // Since tempo is a property of the set (usually not logged per set unless overridden, but let's assume it is)
        if (!set.tempo || set.tempo !== goal.targetTempo) return false;
    }

    return true;
};

/**
 * Calculate the progress percentage (0-100) for a goal based on history
 */
export const calculateGoalProgress = (goal: ExerciseGoal, history: SetLog[]): number => {
    if (history.length === 0) return 0;

    let bestProgress = 0;

    for (const set of history) {
        let metricsCount = 0;
        let totalProgress = 0;

        // Calculate progress for each metric
        if (goal.targetLoad) {
            metricsCount++;
            const load = set.loadKg || 0;
            totalProgress += Math.min(100, (load / goal.targetLoad) * 100);
        }

        if (goal.targetReps) {
            metricsCount++;
            const reps = set.reps || 0;
            totalProgress += Math.min(100, (reps / goal.targetReps) * 100);
        }

        if (goal.targetTime) {
            metricsCount++;
            const time = set.timeSeconds || 0;
            totalProgress += Math.min(100, (time / goal.targetTime) * 100);
        }

        if (goal.targetDistance) {
            metricsCount++;
            const dist = set.distanceMeters || 0;
            totalProgress += Math.min(100, (dist / goal.targetDistance) * 100);
        }

        if (goal.targetRom) {
            metricsCount++;
            const rom = set.romCm || 0;
            totalProgress += Math.min(100, (rom / goal.targetRom) * 100);
        }

        if (goal.targetIsometricTime) {
            metricsCount++;
            const time = set.timeSeconds || 0; // Assuming isometric time is logged in timeSeconds
            totalProgress += Math.min(100, (time / goal.targetIsometricTime) * 100);
        }

        // Tempo is binary (match or no match), so we don't really 'progress' towards it unless we count it.
        // For now, let's ignore tempo in progress bar unless it's the ONLY target?
        // If it is binary, it's 0 or 100.
        if (goal.targetTempo) {
            metricsCount++;
            const match = set.tempo === goal.targetTempo ? 100 : 0;
            totalProgress += match;
        }

        if (metricsCount > 0) {
            const setProgress = totalProgress / metricsCount;
            if (setProgress > bestProgress) {
                bestProgress = setProgress;
            }
        }
    }

    return Math.round(bestProgress);
};

/**
 * Calculate time difference in days between two dates
 */
export const getDaysToComplete = (createdAt: string): number => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
};

/**
 * Generate goal display name from targets
 */
export const getGoalDisplayName = (goal: ExerciseGoal): string => {
    if (goal.name) return goal.name;
    const parts: string[] = [];
    if (goal.targetLoad) parts.push(`${goal.targetLoad}kg`);
    if (goal.targetReps) parts.push(`${goal.targetReps} reps`);
    if (goal.targetTime) parts.push(`${goal.targetTime}s`);
    if (goal.targetDistance) parts.push(`${goal.targetDistance}m`);
    if (goal.targetRom) parts.push(`ROM ${goal.targetRom}cm`);
    if (goal.targetIsometricTime) parts.push(`${goal.targetIsometricTime}s Iso`);
    if (goal.targetTempo) parts.push(`Tempo ${goal.targetTempo}`);
    return parts.join(' × ') || 'Goal';
};
