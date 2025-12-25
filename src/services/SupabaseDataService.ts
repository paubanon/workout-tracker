import { supabase } from './supabase';
import { Exercise, WorkoutTemplate, WorkoutSession, UserProfile, WeightEntry, ExerciseGoal, SetLog } from '../models';

class SupabaseDataService {
    // --- Exercises ---
    async getExercises(): Promise<Exercise[]> {
        const { data, error } = await supabase
            .from('exercises')
            .select('*');

        if (error) {
            console.error('Error fetching exercises:', error);
            return [];
        }
        return (data || []).map((e: any) => ({
            id: e.id,
            name: e.name,
            enabledMetrics: e.enabled_metrics || [],
            repsType: e.reps_type,
            trackBodyWeight: e.track_body_weight,
            description: e.description
        }));
    }

    async addExercise(exercise: Exercise): Promise<void> {
        const { error } = await supabase
            .from('exercises')
            .insert({
                name: exercise.name,
                enabled_metrics: exercise.enabledMetrics,
                reps_type: exercise.repsType,
                track_body_weight: exercise.trackBodyWeight
            });

        if (error) console.error('Error adding exercise:', error);
    }

    async deleteExercise(id: string): Promise<void> {
        const { error } = await supabase
            .from('exercises')
            .delete()
            .eq('id', id);

        if (error) console.error('Error deleting exercise:', error);
    }

    async updateExercise(exercise: Exercise): Promise<void> {
        const { error } = await supabase
            .from('exercises')
            .update({
                name: exercise.name,
                enabled_metrics: exercise.enabledMetrics,
                reps_type: exercise.repsType,
                track_body_weight: exercise.trackBodyWeight
            })
            .eq('id', exercise.id);

        if (error) console.error('Error updating exercise:', error);
    }

    async getUsedExerciseIds(): Promise<string[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        // Fetch all sets from all sessions (optimized query)
        // Since we store sets as JSONB, we have to fetch and parse.
        // For scalability, this should eventually be an RPC or normalized table.
        const { data, error } = await supabase
            .from('workout_sessions')
            .select('sets')
            .eq('user_id', user.id);

        if (error) {
            console.error('Error fetching history for used exercises:', error);
            return [];
        }

        const usedIds = new Set<string>();
        data?.forEach((session: any) => {
            if (Array.isArray(session.sets)) {
                session.sets.forEach((s: any) => {
                    if (s.exerciseId) usedIds.add(s.exerciseId);
                });
            }
        });

        return Array.from(usedIds);
    }

    // --- Templates ---
    async getTemplates(): Promise<WorkoutTemplate[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('workout_templates')
            .select('*')
            .eq('user_id', user.id);

        if (error) return [];

        // Map DB snake_case to model camelCase
        return (data || []).map((t: any) => ({
            id: t.id,
            name: t.name,
            exercises: t.exercises || []
        }));
    }

    async addTemplate(template: WorkoutTemplate): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        if (template.id) {
            // Update existing
            const { error } = await supabase
                .from('workout_templates')
                .update({
                    name: template.name,
                    exercises: template.exercises
                })
                .eq('id', template.id);
            if (error) console.error('Error updating template:', error);
        } else {
            // Create new
            const { error } = await supabase
                .from('workout_templates')
                .insert({
                    user_id: user.id,
                    name: template.name,
                    exercises: template.exercises
                });
            if (error) console.error('Error adding template:', error);
        }
    }

    async deleteTemplate(id: string): Promise<void> {
        const { error } = await supabase
            .from('workout_templates')
            .delete()
            .eq('id', id);
        if (error) console.error('Error deleting template:', error);
    }

    // --- Profile ---
    async getUserProfile(): Promise<UserProfile | null> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (error) return null;

        return {
            id: data.id,
            email: data.email,
            firstName: data.first_name || '',
            lastName: data.last_name || '',
            sex: data.sex || 'male',
            preferences: data.preferences || {},
            weightHistory: data.weight_history || [],
            avatarUrl: data.avatar_url
        };
    }

    async updateUserProfile(updates: Partial<UserProfile>): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const dbUpdates: any = {};
        if (updates.firstName !== undefined) dbUpdates.first_name = updates.firstName;
        if (updates.lastName !== undefined) dbUpdates.last_name = updates.lastName;
        if (updates.sex !== undefined) dbUpdates.sex = updates.sex;
        if (updates.preferences !== undefined) dbUpdates.preferences = updates.preferences;

        const { error } = await supabase
            .from('profiles')
            .update(dbUpdates)
            .eq('id', user.id);

        if (error) console.error('Error updating profile:', error);
    }

    async updateUserPassword(password: string): Promise<{ error: any }> {
        const { error } = await supabase.auth.updateUser({ password });
        return { error };
    }

    async addWeightEntry(weight: number, date?: Date): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get current weight history from profile
        const { data: profile, error: fetchError } = await supabase
            .from('profiles')
            .select('weight_history')
            .eq('id', user.id)
            .single();

        if (fetchError) {
            console.error('Error fetching profile for weight:', fetchError);
            return;
        }

        const currentHistory: any[] = profile?.weight_history || [];
        const newEntry = {
            id: Math.random().toString(36).substring(2, 11),
            date: (date || new Date()).toISOString(),
            weightKg: weight
        };

        // Add new entry at the beginning (most recent first)
        const updatedHistory = [newEntry, ...currentHistory];

        const { error } = await supabase
            .from('profiles')
            .update({ weight_history: updatedHistory })
            .eq('id', user.id);

        if (error) console.error('Error adding weight:', error);
    }

    async getWeightHistory(limit = 50, offset = 0): Promise<{ id: string; weightKg: number; date: string }[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data: profile, error } = await supabase
            .from('profiles')
            .select('weight_history')
            .eq('id', user.id)
            .single();

        if (error) {
            console.error('Error fetching weight history:', error);
            return [];
        }

        const history: any[] = profile?.weight_history || [];
        // Sort by date descending and apply pagination
        const sorted = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return sorted.slice(offset, offset + limit).map((w: any) => ({
            id: w.id,
            weightKg: w.weightKg,
            date: w.date,
        }));
    }

    async updateWeightEntry(id: string, weight: number, date: string): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile, error: fetchError } = await supabase
            .from('profiles')
            .select('weight_history')
            .eq('id', user.id)
            .single();

        if (fetchError) {
            console.error('Error fetching profile for weight update:', fetchError);
            return;
        }

        const currentHistory: any[] = profile?.weight_history || [];
        const updatedHistory = currentHistory.map((entry: any) =>
            entry.id === id ? { ...entry, weightKg: weight, date } : entry
        );

        const { error } = await supabase
            .from('profiles')
            .update({ weight_history: updatedHistory })
            .eq('id', user.id);

        if (error) console.error('Error updating weight:', error);
    }

    async deleteWeightEntry(id: string): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile, error: fetchError } = await supabase
            .from('profiles')
            .select('weight_history')
            .eq('id', user.id)
            .single();

        if (fetchError) {
            console.error('Error fetching profile for weight delete:', fetchError);
            return;
        }

        const currentHistory: any[] = profile?.weight_history || [];
        const updatedHistory = currentHistory.filter((entry: any) => entry.id !== id);

        const { error } = await supabase
            .from('profiles')
            .update({ weight_history: updatedHistory })
            .eq('id', user.id);

        if (error) console.error('Error deleting weight:', error);
    }

    // --- History ---
    async getWorkoutSessions(limit = 20, offset = 0): Promise<WorkoutSession[]> {
        const { data, error } = await supabase
            .from('workout_sessions')
            .select('*')
            .order('date', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('Error fetching sessions:', error);
            return [];
        }

        return data.map((s: any) => ({
            id: s.id,
            date: s.date,
            name: s.name,
            sets: s.sets || [],
            painEntries: s.pain_entries || [],
            preSessionFatigue: s.pre_session_fatigue,
            durationSeconds: s.duration_seconds
        }));

    }

    async getWorkoutSession(id: string): Promise<WorkoutSession | null> {
        const { data, error } = await supabase
            .from('workout_sessions')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) {
            console.error('Error fetching session:', error);
            return null;
        }

        return {
            id: data.id,
            date: data.date,
            name: data.name,
            sets: data.sets || [],
            painEntries: data.pain_entries || [],
            preSessionFatigue: data.pre_session_fatigue,
            durationSeconds: data.duration_seconds
        };
    }

    async addWorkoutSession(session: WorkoutSession): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
            .from('workout_sessions')
            .insert({
                user_id: user.id,
                date: session.date,
                name: session.name,
                sets: session.sets,
                pain_entries: session.painEntries,
                // pre_session_fatigue: session.preSessionFatigue, // Column apparently missing in DB for now
                duration_seconds: session.durationSeconds
            });

        if (error) console.error('Error adding session:', error);
    }

    async updateWorkoutSession(session: WorkoutSession): Promise<void> {
        const { error } = await supabase
            .from('workout_sessions')
            .update({
                date: session.date,
                name: session.name,
                sets: session.sets,
                pain_entries: session.painEntries,
                duration_seconds: session.durationSeconds
            })
            .eq('id', session.id);

        if (error) console.error('Error updating session:', error);
    }

    async deleteWorkoutSession(id: string): Promise<void> {
        const { error } = await supabase
            .from('workout_sessions')
            .delete()
            .eq('id', id);

        if (error) console.error('Error deleting session:', error);
    }
    // --- Exercise Goals ---
    async getGoals(): Promise<ExerciseGoal[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('exercise_goals')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching goals:', error);
            return [];
        }

        return (data || []).map((g: any) => ({
            id: g.id,
            userId: g.user_id,
            exerciseId: g.exercise_id,
            name: g.name,
            targetLoad: g.target_load,
            targetReps: g.target_reps,
            targetTime: g.target_time,
            targetDistance: g.target_distance,
            targetRom: g.target_rom,
            completed: g.completed,
            completedAt: g.completed_at,
            createdAt: g.created_at
        }));
    }

    async getGoalsForExercise(exerciseId: string): Promise<ExerciseGoal[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('exercise_goals')
            .select('*')
            .eq('user_id', user.id)
            .eq('exercise_id', exerciseId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching goals for exercise:', error);
            return [];
        }

        return (data || []).map((g: any) => ({
            id: g.id,
            userId: g.user_id,
            exerciseId: g.exercise_id,
            name: g.name,
            targetLoad: g.target_load,
            targetReps: g.target_reps,
            targetTime: g.target_time,
            targetDistance: g.target_distance,
            targetRom: g.target_rom,
            completed: g.completed,
            completedAt: g.completed_at,
            createdAt: g.created_at
        }));
    }

    async addGoal(goal: Omit<ExerciseGoal, 'id' | 'createdAt'>): Promise<ExerciseGoal | null> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data, error } = await supabase
            .from('exercise_goals')
            .insert({
                user_id: user.id,
                exercise_id: goal.exerciseId,
                name: goal.name,
                target_load: goal.targetLoad,
                target_reps: goal.targetReps,
                target_time: goal.targetTime,
                target_distance: goal.targetDistance,
                target_rom: goal.targetRom,
                target_isometric_time: goal.targetIsometricTime,
                target_tempo: goal.targetTempo,
                completed: false
            })
            .select()
            .single();

        if (error) {
            console.error('Error adding goal:', error);
            return null;
        }

        return {
            id: data.id,
            userId: data.user_id,
            exerciseId: data.exercise_id,
            name: data.name,
            targetLoad: data.target_load,
            targetReps: data.target_reps,
            targetTime: data.target_time,
            targetDistance: data.target_distance,
            targetRom: data.target_rom,
            targetIsometricTime: data.target_isometric_time,
            targetTempo: data.target_tempo,
            completed: data.completed,
            completedAt: data.completed_at,
            createdAt: data.created_at
        };
    }

    async updateGoal(goal: ExerciseGoal): Promise<void> {
        const { error } = await supabase
            .from('exercise_goals')
            .update({
                name: goal.name,
                target_load: goal.targetLoad,
                target_reps: goal.targetReps,
                target_time: goal.targetTime,
                target_distance: goal.targetDistance,
                target_rom: goal.targetRom,
                target_isometric_time: goal.targetIsometricTime,
                target_tempo: goal.targetTempo
            })
            .eq('id', goal.id);

        if (error) console.error('Error updating goal:', error);
    }

    async deleteGoal(id: string): Promise<void> {
        const { error } = await supabase
            .from('exercise_goals')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting goal:', error);
            throw new Error('Failed to delete goal');
        }
    }

    async markGoalCompleted(id: string): Promise<void> {
        const { error } = await supabase
            .from('exercise_goals')
            .update({
                completed: true,
                completed_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) console.error('Error marking goal completed:', error);
    }
    // --- Data Management ---
    async exportAllUserData(): Promise<any> {
        const profile = await this.getUserProfile();
        const templates = await this.getTemplates();
        const { data: userData } = await supabase.auth.getUser();

        // Fetch all sessions (paginated fetch loop or just large limit) - for now large limit
        // Using getWorkoutSessions(1000) for MVP export
        const sessions = await this.getWorkoutSessions(1000);

        // Fetch weight history (need new method or direct query)
        const { data: weightHistory } = await supabase
            .from('weight_history')
            .select('*')
            .eq('user_id', userData.user?.id);

        return {
            version: 1,
            timestamp: new Date().toISOString(),
            profile,
            templates,
            sessions,
            weightHistory: weightHistory || []
        };
    }

    async importUserData(jsonData: any): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 1. Profile
        if (jsonData.profile) {
            await this.updateUserProfile(jsonData.profile);
        }

        // 2. Weight History
        if (jsonData.weightHistory && Array.isArray(jsonData.weightHistory)) {
            const { error } = await supabase
                .from('weight_history')
                .upsert(jsonData.weightHistory.map((w: any) => ({
                    ...w,
                    user_id: user.id // Ensure it belongs to current user
                })));
            if (error) console.error("Import Weight Error", error);
        }

        // 3. Templates
        if (jsonData.templates && Array.isArray(jsonData.templates)) {
            const { error } = await supabase
                .from('workout_templates')
                .upsert(jsonData.templates.map((t: any) => ({
                    id: t.id,
                    user_id: user.id,
                    name: t.name,
                    exercises: t.exercises
                })));
            if (error) console.error("Import Templates Error", error);
        }

        // 4. Sessions
        if (jsonData.sessions && Array.isArray(jsonData.sessions)) {
            const batchSize = 50;
            const sessions = jsonData.sessions;
            for (let i = 0; i < sessions.length; i += batchSize) {
                const batch = sessions.slice(i, i + batchSize).map((s: any) => ({
                    id: s.id,
                    user_id: user.id,
                    date: s.date,
                    name: s.name,
                    sets: s.sets,
                    pain_entries: s.painEntries || s.pain_entries, // Support both if JSON format varies
                    duration_seconds: s.durationSeconds || s.duration_seconds
                }));

                const { error } = await supabase
                    .from('workout_sessions')
                    .upsert(batch);

                if (error) console.error("Import Sessions Error", error);
            }
        }
    }

    async getExerciseHistory(exerciseId: string): Promise<SetLog[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('workout_sessions')
            .select('sets, date')
            .eq('user_id', user.id)
            .contains('sets', JSON.stringify([{ exerciseId }]));

        if (error) {
            console.error('Error fetching exercise history:', error);
            return [];
        }

        const allSets: SetLog[] = [];
        data?.forEach((session: any) => {
            if (Array.isArray(session.sets)) {
                // Attach the date to the set for reference (optional, but useful)
                const matchingSets = session.sets
                    .filter((s: SetLog) => s.exerciseId === exerciseId)
                    .map((s: SetLog) => ({ ...s, completedAt: session.date }));
                allSets.push(...matchingSets);
            }
        });

        return allSets;
    }

    async deleteUserAccount(password: string): Promise<{ error: any }> {
        // 1. Re-authenticate to confirm ownership
        const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
            email: (await supabase.auth.getUser()).data.user?.email || '',
            password: password
        });

        if (authError || !user) {
            return { error: authError || new Error("Authentication failed") };
        }

        // 2. Delete all data associated with user_id
        const tables = ['workout_sessions', 'workout_templates', 'profiles'];

        for (const table of tables) {
            const { error } = await supabase
                .from(table)
                .delete()
                .eq(table === 'profiles' ? 'id' : 'user_id', user.id);

            if (error) {
                // Ignore "table not found" errors (Postgres: 42P01, PostgREST: PGRST205)
                if (error.code === '42P01' || error.code === 'PGRST205' || error.message?.includes('does not exist') || error.message?.includes('Could not find the table')) {
                    console.warn(`Table ${table} not found, skipping delete.`);
                    continue;
                }
                console.error(`Error deleting from ${table}`, error);
                return { error };
            }
        }

        // 3. Delete the user from auth.users using our database function
        const { error: deleteAuthError } = await supabase.rpc('delete_user');
        if (deleteAuthError) {
            console.error('Error deleting auth user:', deleteAuthError);
            // Still sign out even if auth deletion fails
        }

        await supabase.auth.signOut();
        return { error: deleteAuthError };
    }
}

export const supabaseService = new SupabaseDataService();
