import type { Lesson } from "@/lib/domain/types";

/**
 * Lesson catalog.
 *
 * In production these would be authored content (markdown, MDX, CMS). For
 * the scaffold we keep them as typed objects so the lesson page can render
 * without extra infra and so the AI route can pass `lessonContext` to its
 * cache-friendly system prompt.
 *
 * Add a new lesson via: `pnpm gen lesson`.
 */
export const lessons: Lesson[] = [
  {
    slug: "what-is-dysphagia",
    title: "What is dysphagia?",
    blurb: "A 2-minute primer in plain language.",
    level: "awareness",
    minutes: 2,
    body:
      "Dysphagia is the medical word for finding it harder to swallow. " +
      "It can affect food, drink, saliva, or medicines.\n\n" +
      "Lots of things can cause it — a stroke, dementia, head and neck conditions, " +
      "Parkinson's, or simply changes that come with age. It can be temporary or long-term.\n\n" +
      "What matters most is that you're not alone, and there are small things you can " +
      "do to make eating and drinking safer and more enjoyable.",
  },
  {
    slug: "pace-and-posture",
    title: "Pace & posture",
    blurb: "Two quiet habits that protect your swallow.",
    level: "everyday",
    minutes: 2,
    body:
      "Most people swallow faster than they realise. Slowing down — even a little — " +
      "gives your body more time to coordinate.\n\n" +
      "Try this at your next meal:\n\n" +
      "• Sit so your hips and shoulders are square to the table.\n" +
      "• Keep your chin level, not tipped back.\n" +
      "• Take one small mouthful. Pause. Swallow. Pause again before the next.\n\n" +
      "If your clinician has given you a specific strategy (like a chin tuck or " +
      "effortful swallow), use theirs — not this — as your default. This is a gentle " +
      "starting point only.",
  },
  {
    slug: "eating-out",
    title: "Eating out, with confidence",
    blurb: "Quiet ways to enjoy a meal beyond the kitchen.",
    level: "confidence",
    minutes: 3,
    body:
      "Eating out can feel scary when your swallow isn't reliable. But food is also " +
      "company, ritual, joy — you deserve those too.\n\n" +
      "A few things people in our community have found helpful:\n\n" +
      "• Pick a quieter time. Less rush, less noise to compete with.\n" +
      "• Look at the menu before you go. Choose something soft, moist, well-matched " +
      "  to your texture.\n" +
      "• Ask for what you need. A glass of water alongside. A jug to thin a sauce. " +
      "  A quieter table.\n" +
      "• Pace yourself. Put your fork down between bites.\n\n" +
      "It's OK to leave food on the plate. It's OK to say 'I'm done.' Safety first, " +
      "always.",
  },
];

export function getLesson(slug: string) {
  return lessons.find((l) => l.slug === slug);
}
