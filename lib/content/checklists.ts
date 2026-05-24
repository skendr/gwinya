import type { Checklist } from "@/lib/domain/types";

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
      prompt: "My food and drink match my recommended texture",
    },
    {
      id: "strategies",
      prompt: "I remember my strategies for today",
      helper: "Small sips, slow pace, chin tuck — whatever your SLT suggested.",
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
