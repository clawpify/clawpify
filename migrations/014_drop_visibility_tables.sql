-- Remove visibility feature tables (leftover if DB was migrated from a branch that created them).
-- Safe to run when these tables exist; no-op for missing relations due to IF EXISTS.

DROP TABLE IF EXISTS visibility_schedules;
DROP TABLE IF EXISTS visibility_runs;
DROP TABLE IF EXISTS prompts;
DROP TABLE IF EXISTS prompt_sets;
DROP TABLE IF EXISTS tracked_brands;
DROP TABLE IF EXISTS visibility_projects;
