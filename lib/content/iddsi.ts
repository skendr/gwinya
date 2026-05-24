/**
 * IDDSI Framework — the international standard for dysphagia diet
 * descriptors, used by SLT communities worldwide.
 *
 * Reference: https://iddsi.org
 *
 * The framework has 8 levels (0-7). Levels 0-4 cover drinks; levels 3-7
 * cover foods; levels 3 and 4 span both (a Liquidised meal and a Pureed
 * meal are the same texture in different framings).
 *
 * Each entry below also lists *visual* heuristics — what the model should
 * look for in a photograph. Photographs cannot directly measure moisture
 * or cohesiveness, so these are proxies, not tests.
 */

export type IddsiLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type IddsiEntry = {
  level: IddsiLevel;
  name: string;
  altName?: string;
  applies: ("food" | "drink")[];
  /** Short description suitable for users (8th-grade reading level). */
  shortDescription: string;
  /** What this looks like in a photograph. */
  visualCues: string[];
};

export const iddsi: Record<IddsiLevel, IddsiEntry> = {
  0: {
    level: 0,
    name: "Thin",
    applies: ["drink"],
    shortDescription: "Flows like water. No thickener added.",
    visualCues: [
      "completely transparent or lightly coloured liquid",
      "moves freely when the cup is tilted",
      "no visible solids or thickness",
    ],
  },
  1: {
    level: 1,
    name: "Slightly Thick",
    applies: ["drink"],
    shortDescription: "A little thicker than water. Still drinks through a straw.",
    visualCues: [
      "liquid that drips smoothly off a spoon in a steady thin stream",
      "leaves a faint coating on the spoon",
    ],
  },
  2: {
    level: 2,
    name: "Mildly Thick",
    applies: ["drink"],
    shortDescription: "Sips slowly off a spoon. Pours but doesn't drip fast.",
    visualCues: [
      "pours from a cup but more slowly than water",
      "drips slowly off a spoon — single drops, not a stream",
      "like nectar or runny custard",
    ],
  },
  3: {
    level: 3,
    name: "Moderately Thick",
    altName: "Liquidised",
    applies: ["drink", "food"],
    shortDescription: "Drinkable from a cup but slow. Smooth — no lumps.",
    visualCues: [
      "smooth surface, no visible chunks",
      "drops off a spoon in dollops, not a thin stream",
      "often looks like thick soup, thin yogurt, or a smoothie",
    ],
  },
  4: {
    level: 4,
    name: "Extremely Thick",
    altName: "Pureed",
    applies: ["drink", "food"],
    shortDescription: "Eaten with a spoon, not drunk. Smooth and holds shape.",
    visualCues: [
      "holds its shape on a spoon as a single mound",
      "smooth surface with no visible particles or lumps",
      "looks like baby food, pâté, or thick mashed potato (without lumps)",
    ],
  },
  5: {
    level: 5,
    name: "Minced & Moist",
    applies: ["food"],
    shortDescription: "Small soft moist lumps (around the size of a grain of rice). Mashable with a fork.",
    visualCues: [
      "small visible lumps, none larger than ~4mm",
      "generally moist or saucy appearance",
      "no dry crusts, no skins, no long fibres",
    ],
  },
  6: {
    level: 6,
    name: "Soft & Bite-Sized",
    applies: ["food"],
    shortDescription: "Cut into pieces no bigger than ~1.5 cm (a fingernail). Soft enough to break with a fork.",
    visualCues: [
      "visible bite-sized pieces, none larger than ~1.5 cm cubes",
      "no skins, peels, seeds, or hard crusts",
      "no stringy or fibrous items still attached together",
    ],
  },
  7: {
    level: 7,
    name: "Regular / Easy to Chew",
    applies: ["food"],
    shortDescription: "Normal everyday foods. 'Easy to Chew' means softer-cooked but otherwise regular.",
    visualCues: [
      "full-size pieces of normal food",
      "may include skins, crusts, fibrous foods, or harder textures",
    ],
  },
};

export const iddsiLevels: IddsiLevel[] = [0, 1, 2, 3, 4, 5, 6, 7];

/**
 * High-risk visual flags that warrant extra caution regardless of which
 * IDDSI level the food appears to match. These are things SLT consensus
 * lists as commonly implicated in dysphagia incidents.
 */
export const visualRedFlags = [
  { id: "bones", label: "Visible bones or fish bones" },
  { id: "nuts-seeds", label: "Whole nuts, seeds, or pips" },
  { id: "skins", label: "Skins, peels, or sausage casings still on" },
  { id: "dry-crusts", label: "Dry crusts, hard bread, or toast edges" },
  { id: "long-fibres", label: "Long stringy fibres (celery, asparagus, fibrous meat)" },
  { id: "mixed-textures", label: "Mixed thin liquid with solid pieces (e.g. soup with veg, cereal with milk)" },
  { id: "sticky-bread", label: "Sticky white bread, soft doughy textures" },
  { id: "round-firm", label: "Round, firm foods that could lodge (grapes, cherry tomatoes, sweets)" },
] as const;

export type VisualRedFlagId = (typeof visualRedFlags)[number]["id"];

/* ----------------------------------------------------------------------- */
/* Plan-relationship helpers                                               */
/* ----------------------------------------------------------------------- */

/**
 * IDDSI clinical principle for FOODS (levels 3–7).
 *
 * Someone prescribed level N can safely eat any food at level N or
 * lower — lower-numbered levels are more modified (softer, smaller
 * pieces, smoother), which is safer than what the user actually needs.
 * The concern is foods ABOVE the prescribed level: less modified than
 * the SLT said is safe.
 *
 *   prescribed L7 → L3, L4, L5, L6, L7 all within plan
 *   prescribed L5 → L3, L4, L5 within plan; L6, L7 above plan
 *   prescribed L3 → only L3 within plan; L4–L7 above plan
 *
 * Returns null when either level is missing, so the UI can decide
 * between "no plan on file" and "outside plan" rather than forcing a
 * default that lies about safety.
 *
 * NOTE — drinks invert this. Prescribed L2 (mildly thick) means "L2 or
 * THICKER" is safe; thinner is the concern. The food scanner only
 * compares against textureLevel today, so this helper is food-axis
 * specific. Add isDrinkWithinPlan when the scanner learns to detect
 * drinks and compare against fluidLevel.
 */
export function isFoodWithinPlan(
  predicted: number | null,
  prescribed: number | null,
): boolean | null {
  if (predicted == null || prescribed == null) return null;
  return predicted <= prescribed;
}

/**
 * Resolve the model's matchesPrescribed enum into the binary
 * verdict the UI shows: WITHIN plan or OUTSIDE plan (or UNKNOWN).
 *
 * The rule, in user-facing words: a food is within plan when its
 * IDDSI level is at the user's prescribed level or more modified
 * (softer / smaller pieces / smoother) than it. A food is outside
 * plan when it is less modified than prescribed.
 *
 * In raw IDDSI numbers this means within-plan is a level equal to
 * or LOWER than the prescribed number — counterintuitive because
 * "lower number = safer" is an IDDSI quirk. The user-facing
 * vocabulary deliberately avoids leaning on the numbers.
 *
 *   "within"  — matches OR more-modified
 *   "outside" — less-modified
 *   "unknown" — model couldn't tell, or no plan on file
 *
 * Keeps the model's three-value enum (matches/more-modified/
 * less-modified) intact in the DB and the Zod schema; this helper
 * only collapses it for display.
 */
export type PlanVerdict = "within" | "outside" | "unknown";

export function planVerdict(
  matches: "matches" | "more-modified" | "less-modified" | "unknown" | null,
): PlanVerdict {
  if (matches === "matches" || matches === "more-modified") return "within";
  if (matches === "less-modified") return "outside";
  return "unknown";
}

/** Convenience: does this comparison count toward the within-plan rate? */
export function isWithinPlan(v: PlanVerdict): boolean {
  return v === "within";
}
