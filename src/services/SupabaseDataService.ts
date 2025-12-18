import { supabase } from './supabase';
import { Exercise, WorkoutTemplate, WorkoutSession, UserProfile, WeightEntry } from '../models';

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

    async addWeightEntry(weight: number): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
            .from('weight_history')
            .insert({
                user_id: user.id,
                weight_kg: weight,
                date: new Date().toISOString()
            });

        if (error) console.error('Error adding weight:', error);
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
    async getExerciseHistory(exerciseId: string): Promise<WorkoutSession[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        // Fetch all sessions. 
        // OPTIMIZATION: In the future, we might want to filter by date range or use a distinct query
        // but for now, we fetch all to perform client-side filtering/aggregation.
        // We select 'sets' to check for exerciseId inclusion.
        const { data, error } = await supabase
            .from('workout_sessions')
            .select('id, date, name, sets, duration_seconds')
            .eq('user_id', user.id)
            .order('date', { ascending: true });

        if (error) {
            console.error('Error fetching exercise history:', error);
            return [];
        }

        // Filter sessions that actually contain the exercise
        const relevantSessions = (data || []).filter((s: any) =>
            Array.isArray(s.sets) && s.sets.some((set: any) => set.exerciseId === exerciseId)
        );

        return relevantSessions.map((s: any) => ({
            id: s.id,
            date: s.date,
            name: s.name,
            sets: s.sets || [],
            painEntries: [], // distinct query didn't fetch this
            preSessionFatigue: 0,
            durationSeconds: s.duration_seconds
        }));
    }
}

export const supabaseService = new SupabaseDataService();
