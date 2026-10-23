import { LessonSize } from '../preferences';

export interface ProfileRecord {
  id: string;
  display_name: string | null;
  lesson_size: LessonSize;
  onboarding_completed: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface FlagProgressRecord {
  user_id: string;
  country_code: string;
  introduced: boolean;
  mastery: number;
  recall_attempts: number;
  correct_attempts: number;
  updated_at?: string;
}

export interface MigrationState {
  eligibleForMigration: boolean;
  localIntroducedCount: number;
  cloudIntroducedCount: number;
  localAttemptsCount: number;
}
