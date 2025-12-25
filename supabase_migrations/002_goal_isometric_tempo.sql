-- Add isometric time and tempo columns to exercise_goals
-- Run this in Supabase SQL Editor

ALTER TABLE exercise_goals ADD COLUMN IF NOT EXISTS target_isometric_time INTEGER;
ALTER TABLE exercise_goals ADD COLUMN IF NOT EXISTS target_tempo TEXT;
