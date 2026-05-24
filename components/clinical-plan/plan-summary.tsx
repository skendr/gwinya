import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IddsiLevelBadge } from "@/components/food-scan";
import type { IddsiLevel } from "@/lib/content/iddsi";
import type { ClinicalPlan } from "@/lib/db/schema";

/**
 * Reusable plan summary. Used by /plan as the main view, and by the
 * home page card in Block C ("today's strategies"). Renders only the
 * fields actually present in the plan — early returns avoid empty
 * "Strategies: [empty]" boxes when the user hasn't scanned a slip yet.
 */
export function PlanSummary({ plan }: { plan: ClinicalPlan }) {
  return (
    <div className="space-y-4">
      <Card className="space-y-3 p-5">
        <p className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-[var(--color-muted)]">
          Prescribed levels
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <IddsiLevelBadge
            level={(plan.textureLevel ?? null) as IddsiLevel | null}
            size="lg"
          />
          {plan.fluidLevel != null ? (
            <Badge tone="cream">Fluids: L{plan.fluidLevel}</Badge>
          ) : null}
          {plan.parsedConfidence ? (
            <Badge
              tone={
                plan.parsedConfidence === "high"
                  ? "teal"
                  : plan.parsedConfidence === "low"
                    ? "rose"
                    : "gold"
              }
            >
              {plan.parsedConfidence} confidence parse
            </Badge>
          ) : null}
        </div>
        {plan.posture ? (
          <p className="text-sm leading-relaxed text-[var(--color-ink)]">
            <span className="font-semibold">Posture:</span> {plan.posture}
          </p>
        ) : null}
      </Card>

      {plan.strategies && plan.strategies.length > 0 ? (
        <BulletCard title="Your strategies" items={plan.strategies} tone="teal" />
      ) : null}

      {plan.foodsToAvoid && plan.foodsToAvoid.length > 0 ? (
        <BulletCard title="Foods to avoid" items={plan.foodsToAvoid} tone="coral" />
      ) : null}

      {plan.redFlags && plan.redFlags.length > 0 ? (
        <BulletCard
          title="Personalised red flags"
          subtitle="Your SLT specifically called these out for you."
          items={plan.redFlags}
          tone="rose"
        />
      ) : null}

      {plan.exercises && plan.exercises.length > 0 ? (
        <BulletCard title="Exercises" items={plan.exercises} tone="cream" />
      ) : null}

      {plan.specialPrecautions && plan.specialPrecautions.length > 0 ? (
        <BulletCard
          title="Special precautions"
          subtitle="Items ticked on the printed form."
          items={plan.specialPrecautions}
          tone="gold"
        />
      ) : null}

      {plan.warningSigns && plan.warningSigns.length > 0 ? (
        <BulletCard
          title="Warning signs (form)"
          subtitle="The standard list printed on the slip — for reference."
          items={plan.warningSigns}
          tone="cream"
        />
      ) : null}

      {plan.educationalLinks && plan.educationalLinks.length > 0 ? (
        <Card className="space-y-2 p-5">
          <p className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-[var(--color-muted)]">
            Resources from your slip
          </p>
          <ul className="space-y-1.5 text-sm">
            {plan.educationalLinks.map((link, i) => (
              <li key={i}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--color-clay-deep)] underline underline-offset-4"
                >
                  {link.label}
                </a>{" "}
                <span className="text-xs text-[var(--color-muted)]">(opens in new tab)</span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {plan.sltName || plan.reviewDate ? (
        <Card className="space-y-1 p-5 text-sm text-[var(--color-ink-soft)]">
          {plan.sltName ? (
            <p>
              <span className="font-semibold text-[var(--color-ink)]">SLT:</span>{" "}
              {plan.sltName}
            </p>
          ) : null}
          {plan.reviewDate ? (
            <p>
              <span className="font-semibold text-[var(--color-ink)]">Next review:</span>{" "}
              {plan.reviewDate}
            </p>
          ) : null}
        </Card>
      ) : null}
    </div>
  );
}

function BulletCard({
  title,
  subtitle,
  items,
  tone,
}: {
  title: string;
  subtitle?: string;
  items: string[];
  tone: "teal" | "gold" | "coral" | "cream" | "rose";
}) {
  return (
    <Card className="space-y-2 p-5">
      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          <Badge tone={tone}>{title}</Badge>
        </div>
        {subtitle ? (
          <p className="text-xs text-[var(--color-muted)]">{subtitle}</p>
        ) : null}
      </div>
      <ul className="space-y-1.5 text-sm leading-relaxed text-[var(--color-ink)]">
        {items.map((it, i) => (
          <li key={i} className="flex items-start gap-2">
            <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-current opacity-50" />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
