import type { Lesson } from "../domain/types";

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
  {
    slug: "signs-to-watch-for",
    title: "Signs to watch for",
    blurb: "The quiet signals worth noticing at a meal.",
    level: "awareness",
    minutes: 2,
    body:
      "Most meals go smoothly. But it helps to know the quiet signals that your " +
      "swallow is having a harder day — so you can slow down, or ask for help.\n\n" +
      "Things worth noticing:\n\n" +
      "• A cough or throat-clear during or just after eating or drinking.\n" +
      "• A wet or gurgly voice after a mouthful.\n" +
      "• Food that feels stuck, or that you need to swallow twice.\n" +
      "• Feeling more tired or breathless as the meal goes on.\n\n" +
      "One cough now and then is normal. A pattern — coughing most meals, or a voice " +
      "that stays wet — is worth telling your speech and language therapist about.\n\n" +
      "And if someone ever truly can't breathe, cough, or speak, that's choking, not " +
      "a swallow to wait out. Call for help straight away.",
  },
  {
    slug: "after-a-brain-injury",
    title: "Mealtimes after a brain injury",
    blurb: "Why eating can feel different, and what steadies it.",
    level: "awareness",
    minutes: 3,
    body:
      "A brain injury changes more than your swallow. It can change how quickly you " +
      "tire, how easily you're distracted, and how fast you want to eat — sometimes " +
      "faster than feels safe.\n\n" +
      "None of that is a failing. It's the injury, not you. And there's a lot that " +
      "helps:\n\n" +
      "• Eat when you're rested. A tired brain swallows less reliably — earlier in " +
      "the day is often easier.\n" +
      "• One thing at a time. Eating while talking, or with the TV on, splits your " +
      "attention. Quiet helps.\n" +
      "• Small mouthfuls, every time. If you notice yourself rushing, put the fork " +
      "down between bites.\n" +
      "• Finish one mouthful before the next. Check your mouth feels clear.\n\n" +
      "If you live with family or a carer, it's okay to let them gently remind you to " +
      "slow down. You're not being managed — you're being backed up on a harder day.",
  },
  {
    slug: "texture-made-simple",
    title: "Texture, made simple",
    blurb: "The why behind softer, moister food.",
    level: "everyday",
    minutes: 2,
    body:
      "You might have been told your food should be a certain texture — softer, " +
      "moister, easier to chew. It can sound technical, but the idea is simple: match " +
      "the food to what your swallow can handle today.\n\n" +
      "Why it matters: firmer, drier, or crumbly foods take more work to chew and " +
      "control. Softer, moist foods move more smoothly and give you more time.\n\n" +
      "A few everyday swaps:\n\n" +
      "• Moisten it. A little gravy, sauce, or custard turns a dry plate into an " +
      "easy one.\n" +
      "• Cook it soft. Slow-cooked meat, well-cooked vegetables, tender fish.\n" +
      "• Watch the mixed textures. Soup with bits, or cereal in milk, asks you to " +
      "manage solid and liquid at once.\n\n" +
      "Your therapist will have set the right texture for you. This is just the why " +
      "behind it.",
  },
  {
    slug: "taking-your-medicines",
    title: "Taking your medicines",
    blurb: "Small pills, a few safer habits.",
    level: "everyday",
    minutes: 2,
    body:
      "Pills can be one of the trickiest things to swallow — small, hard, and easy " +
      "to rush. A few changes make them safer.\n\n" +
      "Worth knowing:\n\n" +
      "• Take them one at a time, not a handful together.\n" +
      "• Try them with a soft spoonful — yoghurt, custard, or purée — rather than a " +
      "gulp of water, if that's easier for you.\n" +
      "• Sit upright, and stay sitting for a little while after.\n\n" +
      "One important note: don't crush or split tablets, or open capsules, without " +
      "checking first. Some medicines stop working — or become unsafe — when they're " +
      "changed. Your pharmacist or therapist can tell you which of yours can be " +
      "crushed, and suggest a liquid version where one exists.\n\n" +
      "A quick question now saves a lot of worry later.",
  },
  {
    slug: "mouth-care",
    title: "Mouth care that protects you",
    blurb: "Two quiet minutes after each meal.",
    level: "everyday",
    minutes: 2,
    body:
      "Mouth care might feel like the least important part of eating. It's actually " +
      "one of the most protective.\n\n" +
      "Here's why: food can hide after a meal — tucked in a cheek, or under the " +
      "tongue — especially if your swallow leaves a little behind. Left there, it can " +
      "be swallowed later when you're not ready, or raise the risk of a chest " +
      "infection.\n\n" +
      "A simple routine:\n\n" +
      "• After eating, check your mouth feels empty. A gentle sweep of the tongue, " +
      "or a look in the mirror.\n" +
      "• Rinse, or brush gently with a soft toothbrush.\n" +
      "• Do the same after medicines.\n\n" +
      "Two quiet minutes after each meal. It keeps your mouth comfortable, your " +
      "breath fresh, and your chest clearer.",
  },
  {
    slug: "the-feelings-too",
    title: "The feelings that come too",
    blurb: "The emotional side of eating, and that it's allowed.",
    level: "confidence",
    minutes: 3,
    body:
      "Swallowing trouble isn't only physical. Meals are how we celebrate, comfort, " +
      "and connect — so when eating changes, the feelings can run deep. Frustration. " +
      "Grief for the old, easy way. Worry at the table. Sometimes embarrassment in " +
      "front of others.\n\n" +
      "All of that is normal, and you're allowed to feel it.\n\n" +
      "Some things that help:\n\n" +
      "• Name it. \"I'm finding this hard today\" is a full sentence, and saying it " +
      "often lightens it.\n" +
      "• Keep the parts of mealtimes you love. The company, the chat, the table set " +
      "nicely — those still belong to you.\n" +
      "• Go gently on the hard days. One rushed or coughy meal isn't a setback. " +
      "Tomorrow is a fresh plate.\n\n" +
      "And if the low days outnumber the good ones, tell someone — your therapist, " +
      "your GP, someone close. This is worth support, not silence.",
  },
];

export function getLesson(slug: string) {
  return lessons.find((l) => l.slug === slug);
}
