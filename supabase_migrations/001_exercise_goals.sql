-- Exercise Goals Table for Phase 1
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS exercise_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    name TEXT,
    target_load NUMERIC,
    target_reps INTEGER,
    target_time INTEGER,
    target_distance INTEGER,
    target_rom NUMERIC,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_exercise_goals_user_id ON exercise_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_exercise_goals_exercise_id ON exercise_goals(exercise_id);
CREATE INDEX IF NOT EXISTS idx_exercise_goals_completed ON exercise_goals(completed);

-- Enable Row Level Security
ALTER TABLE exercise_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see/modify their own goals
CREATE POLICY "Users can view own goals" ON exercise_goals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals" ON exercise_goals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals" ON exercise_goals
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals" ON exercise_goals
    FOR DELETE USING (auth.uid() = user_id);
