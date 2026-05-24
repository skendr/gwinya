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
