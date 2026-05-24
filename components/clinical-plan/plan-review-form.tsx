"use client";

import { useState, useTransition } from "react";
import { Loader2, Plus, Trash2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { saveClinicalPlan, type SaveClinicalPlanInput } from "@/app/plan/actions";
import type { EducationalLink } from "@/lib/db/schema";
import type { SLTSlipResult } from "@/lib/ai/slt-slip-schema";
import { cn } from "@/lib/utils";

type Props = {
  scanId: string;
  imagePath: string | null;
  parsed: SLTSlipResult;
  prescribedNow: {
    textureLevel: number | null;
    fluidLevel: number | null;
  } | null;
};

/**
 * Editable form for every parsed field. Low-confidence parses get an
 * amber border + helper text so the user knows which fields the model
 * was unsure about. Submits via the saveClinicalPlan server action,
 * which redirects to /plan on success.
 */
export function PlanReviewForm({ imagePath, parsed, prescribedNow }: Props) {
  const lowConf = parsed.confidence === "low";

  const [textureLevel, setTextureLevel] = useState<number | null>(parsed.textureLevel);
  const [fluidLevel, setFluidLevel] = useState<number | null>(parsed.fluidLevel);
  const [posture, setPosture] = useState(parsed.posture ?? "");
  const [strategies, setStrategies] = useState<string[]>(parsed.strategies ?? []);
  const [exercises, setExercises] = useState<string[]>(parsed.exercises ?? []);
  const [foodsToAvoid, setFoodsToAvoid] = useState<string[]>(parsed.foodsToAvoid ?? []);
  const [redFlags, setRedFlags] = useState<string[]>(parsed.redFlags ?? []);
  const [specialPrecautions, setSpecialPrecautions] = useState<string[]>(
    parsed.specialPrecautions ?? [],
  );
  const [warningSigns, setWarningSigns] = useState<string[]>(parsed.warningSigns ?? []);
  const [educationalLinks, setEducationalLinks] = useState<EducationalLink[]>(
    parsed.educationalLinks ?? [],
  );
  const [sltName, setSltName] = useState(parsed.sltName ?? "");
  const [reviewDate, setReviewDate] = useState(parsed.reviewDate ?? "");
  const [rawPlanText, setRawPlanText] = useState(parsed.rawPlanText ?? "");

  const [pending, startTransition] = useTransition();
  const textureChanged =
    prescribedNow?.textureLevel != null &&
    textureLevel != null &&
    prescribedNow.textureLevel !== textureLevel;

  function onSubmit() {
    const input: SaveClinicalPlanInput = {
      textureLevel,
      fluidLevel,
      posture,
      specialPrecautions,
      warningSigns,
      strategies,
      exercises,
      foodsToAvoid,
      redFlags,
      educationalLinks,
      sltName: sltName.trim() || null,
      reviewDate: reviewDate.trim() || null,
      rawPlanText,
      parsedConfidence: parsed.confidence,
      sourceImagePath: imagePath,
    };
    startTransition(async () => {
      try {
        await saveClinicalPlan(input);
        // redirect happens inside saveClinicalPlan; this line is unreachable
        // on success. On error the action throws and we land in catch.
      } catch (e) {
        // Next throws NEXT_REDIRECT to perform the post-action redirect;
        // it is not an error and we should not surface it as one.
        if (e instanceof Error && /NEXT_REDIRECT/.test(e.message)) return;
        const msg = e instanceof Error ? e.message : "Couldn't save plan";
        toast.error("Save failed", { description: msg });
      }
    });
  }

  return (
    <div className="space-y-5">
      {parsed.caveats && parsed.caveats.length > 0 ? (
        <Card className="space-y-2 p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-honey-deep, #7a5300)]" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[var(--color-ink)]">
                Things to double-check
              </p>
              <ul className="space-y-1 text-xs text-[var(--color-ink-soft)]">
                {parsed.caveats.map((c, i) => (
                  <li key={i}>· {c}</li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      ) : null}

      <FieldCard title="Texture (IDDSI level)" lowConf={lowConf}>
        <LevelPicker
          value={textureLevel}
          onChange={setTextureLevel}
          max={7}
          ariaLabel="Texture level"
        />
        {textureChanged ? (
          <p className="text-xs text-[var(--color-clay-deep)]">
            You&apos;re changing from L{prescribedNow?.textureLevel} → L{textureLevel}.
          </p>
        ) : null}
      </FieldCard>

      <FieldCard title="Fluids (IDDSI level)" lowConf={lowConf}>
        <LevelPicker
          value={fluidLevel}
          onChange={setFluidLevel}
          max={4}
          ariaLabel="Fluid level"
        />
      </FieldCard>

      <FieldCard title="Posture" lowConf={lowConf}>
        <TextInput value={posture} onChange={setPosture} placeholder="Sit upright for all swallowing" />
      </FieldCard>

      <ListField
        title="Your strategies"
        items={strategies}
        onChange={setStrategies}
        placeholder="Take a small sip between mouthfuls"
        lowConf={lowConf}
      />

      <ListField
        title="Foods to avoid"
        items={foodsToAvoid}
        onChange={setFoodsToAvoid}
        placeholder="Hard crusts"
        lowConf={lowConf}
      />

      <ListField
        title="Personalised red flags"
        subtitle="Items your SLT specifically flagged for you."
        items={redFlags}
        onChange={setRedFlags}
        placeholder="Wet voice that does not clear"
        lowConf={lowConf}
      />

      <ListField
        title="Exercises"
        items={exercises}
        onChange={setExercises}
        placeholder="Mendelsohn manoeuvre × 10 before meals"
        lowConf={lowConf}
      />

      <ListField
        title="Special precautions (ticked on the form)"
        items={specialPrecautions}
        onChange={setSpecialPrecautions}
        placeholder="No straws"
        lowConf={false}
      />

      <ListField
        title="Warning signs (printed form list)"
        subtitle="The form's standard list — usually identical between slips."
        items={warningSigns}
        onChange={setWarningSigns}
        placeholder="Wet or gurgly voice"
        lowConf={false}
      />

      <LinksField
        title="Educational links"
        items={educationalLinks}
        onChange={setEducationalLinks}
      />

      <div className="grid grid-cols-2 gap-3">
        <FieldCard title="SLT name" lowConf={lowConf}>
          <TextInput value={sltName} onChange={setSltName} placeholder="J. Smith" />
        </FieldCard>
        <FieldCard title="Review date" lowConf={false}>
          <input
            type="date"
            value={reviewDate}
            onChange={(e) => setReviewDate(e.target.value)}
            className="flex h-12 w-full rounded-2xl border border-[var(--input)] bg-[var(--color-paper)] px-3 text-base"
          />
        </FieldCard>
      </div>

      <FieldCard
        title="Verbatim PLAN-box text"
        subtitle="Audit trail. Save preserves this exactly."
        lowConf={false}
      >
        <Textarea
          value={rawPlanText}
          onChange={(e) => setRawPlanText(e.target.value)}
          rows={4}
        />
      </FieldCard>

      <Button size="lg" className="w-full" disabled={pending} onClick={onSubmit}>
        {pending ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Saving plan…
          </>
        ) : (
          "Save this plan"
        )}
      </Button>
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/* Internal field primitives                                               */
/* ----------------------------------------------------------------------- */

function FieldCard({
  title,
  subtitle,
  lowConf,
  children,
}: {
  title: string;
  subtitle?: string;
  lowConf: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card
      className={cn(
        "space-y-2 p-4",
        lowConf ? "border-2 border-[var(--color-honey, #d49a3c)]" : null,
      )}
    >
      <div className="space-y-0.5">
        <p className="text-[0.7rem] font-medium uppercase tracking-[0.16em] text-[var(--color-muted)]">
          {title}
        </p>
        {subtitle ? (
          <p className="text-xs text-[var(--color-muted)]">{subtitle}</p>
        ) : null}
        {lowConf ? (
          <p className="text-xs text-[var(--color-clay-deep)]">
            I might have got this wrong — please double-check.
          </p>
        ) : null}
      </div>
      {children}
    </Card>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="flex h-12 w-full rounded-2xl border border-[var(--input)] bg-[var(--color-paper)] px-4 text-base"
    />
  );
}

function LevelPicker({
  value,
  onChange,
  max,
  ariaLabel,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  max: number;
  ariaLabel: string;
}) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label={ariaLabel}>
      <button
        type="button"
        onClick={() => onChange(null)}
        className={cn(
          "h-9 rounded-full px-3 text-xs font-medium transition-colors",
          value == null
            ? "bg-[var(--color-clay)] text-white"
            : "bg-[var(--color-linen-2)] text-[var(--color-ink-soft)]",
        )}
      >
        Not specified
      </button>
      {Array.from({ length: max + 1 }, (_, i) => i).map((lvl) => (
        <button
          key={lvl}
          type="button"
          onClick={() => onChange(lvl)}
          className={cn(
            "h-9 rounded-full px-3 text-xs font-semibold transition-colors",
            value === lvl
              ? "bg-[var(--color-clay)] text-white"
              : "bg-[var(--color-linen-2)] text-[var(--color-ink)]",
          )}
        >
          L{lvl}
        </button>
      ))}
    </div>
  );
}

function ListField({
  title,
  subtitle,
  items,
  onChange,
  placeholder,
  lowConf,
}: {
  title: string;
  subtitle?: string;
  items: string[];
  onChange: (xs: string[]) => void;
  placeholder?: string;
  lowConf: boolean;
}) {
  function update(i: number, v: string) {
    const next = items.slice();
    next[i] = v;
    onChange(next);
  }
  function remove(i: number) {
    onChange(items.filter((_, idx) => idx !== i));
  }
  function add() {
    onChange([...items, ""]);
  }
  return (
    <FieldCard title={title} subtitle={subtitle} lowConf={lowConf}>
      {items.length === 0 ? (
        <p className="text-xs text-[var(--color-muted)]">Nothing here yet.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((it, i) => (
            <li key={i} className="flex items-center gap-2">
              <input
                type="text"
                value={it}
                onChange={(e) => update(i, e.target.value)}
                placeholder={placeholder}
                className="flex h-11 w-full rounded-xl border border-[var(--input)] bg-[var(--color-paper)] px-3 text-sm"
              />
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label="Remove item"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[var(--color-muted)] hover:text-[var(--color-rose)]"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        onClick={add}
        className="inline-flex h-9 items-center gap-1 rounded-full bg-[var(--color-linen-2)] px-3 text-xs font-medium text-[var(--color-ink)]"
      >
        <Plus className="h-3.5 w-3.5" />
        Add
      </button>
    </FieldCard>
  );
}

function LinksField({
  title,
  items,
  onChange,
}: {
  title: string;
  items: EducationalLink[];
  onChange: (xs: EducationalLink[]) => void;
}) {
  function update(i: number, patch: Partial<EducationalLink>) {
    const next = items.slice();
    next[i] = { ...next[i], ...patch };
    onChange(next);
  }
  function remove(i: number) {
    onChange(items.filter((_, idx) => idx !== i));
  }
  function add() {
    onChange([...items, { label: "", url: "" }]);
  }
  return (
    <FieldCard title={title} lowConf={false}>
      {items.length === 0 ? (
        <p className="text-xs text-[var(--color-muted)]">No links from your slip.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((link, i) => (
            <li key={i} className="space-y-1.5">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={link.label}
                  onChange={(e) => update(i, { label: e.target.value })}
                  placeholder="Label"
                  className="flex h-10 w-full rounded-xl border border-[var(--input)] bg-[var(--color-paper)] px-3 text-sm"
                />
                <button
                  type="button"
                  onClick={() => remove(i)}
                  aria-label="Remove link"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[var(--color-muted)] hover:text-[var(--color-rose)]"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <input
                type="url"
                value={link.url}
                onChange={(e) => update(i, { url: e.target.value })}
                placeholder="https://…"
                className="flex h-10 w-full rounded-xl border border-[var(--input)] bg-[var(--color-paper)] px-3 text-sm"
              />
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        onClick={add}
        className="inline-flex h-9 items-center gap-1 rounded-full bg-[var(--color-linen-2)] px-3 text-xs font-medium text-[var(--color-ink)]"
      >
        <Plus className="h-3.5 w-3.5" />
        Add link
      </button>
    </FieldCard>
  );
}
