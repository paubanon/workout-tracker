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
        return data || [];
    }

    async addExercise(exercise: Exercise): Promise<void> {
        const { error } = await supabase
            .from('exercises')
            .insert({
                name: exercise.name,
                enabled_metrics: exercise.enabledMetrics,
                reps_type: exercise.repsType
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
            exerciseIds: t.exercise_ids
        }));
    }

    async addTemplate(template: WorkoutTemplate): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
            .from('workout_templates')
            .insert({
                user_id: user.id,
                name: template.name,
                exercise_ids: template.exerciseIds
            });

        if (error) console.error('Error adding template:', error);
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

        const { error } = await supabase
            .from('profiles')
            .update(dbUpdates)
            .eq('id', user.id);

        if (error) console.error('Error updating profile:', error);
    }

    async addWeightEntry(weightKg: number): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // We need to fetch current history, append, and update (atomic update for jsonb in PG is better, but this is simple)
        const current = await this.getUserProfile();
        if (!current) return;

        const newEntry: WeightEntry = {
            id: Math.random().toString(36).substr(2, 9),
            date: new Date().toISOString(),
            weightKg
        };

        const newHistory = [newEntry, ...current.weightHistory];

        const { error } = await supabase
            .from('profiles')
            .update({ weight_history: newHistory })
            .eq('id', user.id);

        if (error) console.error('Error adding weight:', error);
    }
}

export const supabaseService = new SupabaseDataService();
