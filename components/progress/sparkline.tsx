/**
 * Tiny SVG sparkline. No axis, no labels — meant to be paired with a small
 * caption underneath so the eye reads the headline first and the shape
 * second. Domain auto-fits to data; gaps drawn dashed.
 */
export function Sparkline({
  values,
  tone = "clay",
  height = 36,
}: {
  values: (number | null)[];
  tone?: "clay" | "moss" | "honey";
  height?: number;
}) {
  if (!values.length) return null;
  const stroke = `var(--color-${tone})`;
  const fill = `color-mix(in oklab, var(--color-${tone}) 14%, transparent)`;

  const cleaned = values.map((v) => (v == null ? NaN : v));
  const finite = cleaned.filter((v) => Number.isFinite(v));
  if (!finite.length) return null;
  const min = Math.min(...finite);
  const max = Math.max(...finite);
  const span = Math.max(1e-6, max - min);

  const width = 200;
  const stepX = width / Math.max(1, values.length - 1);
  const yOf = (v: number) => height - ((v - min) / span) * (height - 6) - 3;

  const points: string[] = [];
  cleaned.forEach((v, i) => {
    const x = i * stepX;
    if (Number.isFinite(v)) points.push(`${x.toFixed(1)},${yOf(v).toFixed(1)}`);
  });
  const line = points.join(" ");
  const area = `0,${height} ${line} ${width.toFixed(1)},${height}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="h-9 w-full"
      aria-hidden
    >
      <polygon points={area} fill={fill} />
      <polyline points={line} fill="none" stroke={stroke} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
