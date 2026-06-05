/**
 * Code generators for Gwinya.
 *
 * Run via:
 *   pnpm gen                  → interactive picker
 *   pnpm gen:component        → new component folder
 *   pnpm gen:lesson           → new lesson entry
 *   pnpm gen:page             → new app/ route
 *
 * Convention notes:
 *  - Components live in `components/<kebab-name>/` with an index.ts barrel
 *    and a `<kebab-name>.tsx` implementation. Co-located helpers go in the
 *    same folder.
 *  - shadcn primitives are NOT generated here — use `pnpm dlx shadcn add …`
 *    so they land in `components/ui/` per shadcn convention.
 *  - Lessons live in `packages/shared/src/content/lessons.ts` (shared by web
 *    and mobile); the generator writes a new stub under
 *    `packages/shared/src/content/lessons/` and reminds you to register it.
 */

const toKebab = (s) =>
  String(s)
    .trim()
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();

const toPascal = (s) =>
  toKebab(s)
    .split("-")
    .filter(Boolean)
    .map((p) => p[0].toUpperCase() + p.slice(1))
    .join("");

export default function plop(plop) {
  plop.setHelper("kebab", toKebab);
  plop.setHelper("pascal", toPascal);

  /* ------------------------------------------------------------------ */
  /* component                                                          */
  /* ------------------------------------------------------------------ */
  plop.setGenerator("component", {
    description: "Create a new component in its own folder with a barrel",
    prompts: [
      {
        type: "input",
        name: "name",
        message: "Component name (e.g. confidence-slider)",
        validate: (v) => (v && v.length ? true : "Required"),
      },
      {
        type: "confirm",
        name: "client",
        message: "Client component? (adds \"use client\")",
        default: false,
      },
    ],
    actions: [
      {
        type: "add",
        path: "components/{{kebab name}}/{{kebab name}}.tsx",
        templateFile: "plop-templates/component/component.tsx.hbs",
      },
      {
        type: "add",
        path: "components/{{kebab name}}/index.ts",
        templateFile: "plop-templates/component/index.ts.hbs",
      },
    ],
  });

  /* ------------------------------------------------------------------ */
  /* lesson                                                             */
  /* ------------------------------------------------------------------ */
  plop.setGenerator("lesson", {
    description: "Scaffold a new lesson entry",
    prompts: [
      {
        type: "input",
        name: "slug",
        message: "Lesson slug (e.g. small-sips)",
        validate: (v) => (/^[a-z0-9-]+$/.test(v) ? true : "Use kebab-case, lowercase only"),
      },
      {
        type: "input",
        name: "title",
        message: "Title",
      },
      {
        type: "list",
        name: "level",
        message: "Level",
        choices: ["awareness", "everyday", "confidence"],
      },
      {
        type: "input",
        name: "minutes",
        message: "Estimated minutes",
        default: "2",
      },
    ],
    actions: [
      {
        type: "add",
        path: "packages/shared/src/content/lessons/{{slug}}.ts",
        templateFile: "plop-templates/lesson/lesson.ts.hbs",
      },
      () =>
        "✏  Don't forget to import + push the new lesson into " +
        "`packages/shared/src/content/lessons.ts`. " +
        "We keep registration explicit so the order is intentional.",
    ],
  });

  /* ------------------------------------------------------------------ */
  /* page                                                               */
  /* ------------------------------------------------------------------ */
  plop.setGenerator("page", {
    description: "Scaffold a new app/ route",
    prompts: [
      {
        type: "input",
        name: "route",
        message:
          "Route segment (e.g. eating-out, or strategies/[id]). No leading slash.",
        validate: (v) => (v && v.length ? true : "Required"),
      },
      {
        type: "input",
        name: "title",
        message: "Page title (used in metadata + H1)",
      },
    ],
    actions: [
      {
        type: "add",
        path: "app/{{route}}/page.tsx",
        templateFile: "plop-templates/page/page.tsx.hbs",
      },
    ],
  });
}
