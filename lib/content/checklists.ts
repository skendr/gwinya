import type { Checklist, ChecklistItem } from "@/lib/domain/types";
import type { ClinicalPlan } from "@/lib/db/schema";

export const beforeMeal: Checklist = {
  slug: "before-meal",
  title: "Before I eat",
  intro:
    "A short, gentle readiness check. Tick what's true. There are no wrong answers — this is just for you.",
  items: [
    {
      id: "alert",
      prompt: "I feel alert enough to eat or drink",
      helper: "If you're sleepy or your eyes are heavy, it may help to wait.",
    },
    {
      id: "upright",
      prompt: "I'm sitting upright",
      helper: "Hips and shoulders square; head not tilted back.",
    },
    {
      id: "texture",
      prompt: "My food is within my plan",
      helper: "Within plan means at your prescribed IDDSI level or softer. Less modified than your prescribed level is outside plan — worth a second look.",
    },
    {
      id: "strategies",
      prompt: "I remember my strategies for today",
      helper: "Small sips, slow pace, sitting upright — whatever your SLT suggested.",
    },
    {
      id: "calm",
      prompt: "I feel calm enough to start",
      helper: "Feeling worried or breathless? Take a moment first.",
      tone: "watch",
    },
  ],
};

export const afterMeal: Checklist = {
  slug: "after-meal",
  title: "After I ate",
  intro: "Just a quick note — patterns over time are what matter.",
  items: [
    { id: "cough", prompt: "I coughed during the meal", tone: "watch" },
    { id: "wet", prompt: "My voice felt wet or gurgly", tone: "watch" },
    { id: "tired", prompt: "I felt tired before finishing" },
    { id: "avoid", prompt: "I avoided a food or drink I usually have" },
    { id: "used", prompt: "I used at least one of my strategies" },
  ],
};

export const checklists = { beforeMeal, afterMeal };

/**
 * Convert a strategy bullet into a yes/no checklist prompt the user
 * can tick before a meal. Best-effort transformation: a strategy like
 * "Take a small sip between mouthfuls" becomes "Will you take a small
 * sip between mouthfuls?".
 */
function strategyToPrompt(strategy: string): string {
  const trimmed = strategy.trim().replace(/[.?!]+$/, "");
  if (!trimmed) return "";
  const lower = trimmed[0].toLowerCase() + trimmed.slice(1);
  // Common imperative starts → "will you …?"
  if (/^(take|use|do|try|keep|stay|sit|tuck|chew|sip|eat|drink|avoid|practice|practise)\b/i.test(trimmed)) {
    return `Will you ${lower}?`;
  }
  return `Will you remember: ${trimmed}?`;
}

/**
 * Build the before-meal checklist personalised for a given plan. Falls
 * back to the static list when no plan is loaded. Appended strategy
 * items get stable ids derived from a numeric hash of the prompt so
 * the ReadinessChecklist `state` map keys stay sensible.
 */
export function buildBeforeMeal(plan: ClinicalPlan | null): Checklist {
  if (!plan || !plan.strategies || plan.strategies.length === 0) return beforeMeal;

  // Cap personalised items so the list stays scannable (5 base + up to 3).
  const extras: ChecklistItem[] = plan.strategies
    .slice(0, 3)
    .map((s, i) => ({
      id: `plan-strategy-${i}`,
      prompt: strategyToPrompt(s) || s,
      helper: "From your SLT plan.",
    }))
    .filter((item) => item.prompt.length > 0);

  return {
    ...beforeMeal,
    items: [...beforeMeal.items, ...extras],
  };
}
