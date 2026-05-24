/**
 * Shared domain types for the Gwinya app.
 *
 * Keeping these in one file means the lesson catalog, the checklists, the
 * storage layer, and the UI all agree on shape. Add new fields here first.
 */

export type LessonLevel = "awareness" | "everyday" | "confidence";

export type Lesson = {
  slug: string;
  title: string;
  /** One-sentence hook shown on the lesson card. */
  blurb: string;
  /** ~2-minute body. Plain language. */
  body: string;
  level: LessonLevel;
  /** Minutes to complete. Used for the "2-min read" chip. */
  minutes: number;
};

export type ChecklistItemTone = "neutral" | "watch" | "warn";

export type ChecklistItem = {
  id: string;
  prompt: string;
  /** Optional helper text shown under the prompt. */
  helper?: string;
  tone?: ChecklistItemTone;
};

export type Checklist = {
  slug: "before-meal" | "after-meal";
  title: string;
  intro: string;
  items: ChecklistItem[];
};

export type SymptomLog = {
  date: string; // ISO yyyy-mm-dd
  coughing: boolean;
  wetVoice: boolean;
  fatigue: 0 | 1 | 2 | 3;
  confidence: 1 | 2 | 3 | 4 | 5;
  usedStrategy: boolean;
  notes?: string;
};

export type StreakState = {
  count: number;
  lastCheckIn: string | null; // ISO yyyy-mm-dd
};
