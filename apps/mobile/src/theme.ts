/**
 * Gwinya design tokens, ported from the web app's `app/globals.css` @theme
 * block so the mobile app shares the identical palette, radii, and type. We
 * express them as a typed object (consumed via StyleSheet) rather than
 * Tailwind classes — same tokens, no extra bundler integration.
 *
 * Font family strings match the keys registered with `useFonts` in
 * `app/_layout.tsx` (the @expo-google-fonts naming convention).
 */

export const colors = {
  // Surfaces
  linen: "#f5ede0",
  linen2: "#ead9be",
  paper: "#fdf9f0",
  // Ink / text
  ink: "#1f1812",
  inkSoft: "#4f4136",
  muted: "#8b7a68",
  // Clay (primary / warm accent)
  clay: "#d55a3a",
  clayDeep: "#a3402a",
  claySoft: "#fadccf",
  // Moss (positive / within-plan)
  moss: "#3f7d55",
  mossDeep: "#2a5a3c",
  mossSoft: "#d4ead7",
  // Honey (highlight / streak)
  honey: "#e6a33a",
  honeySoft: "#fbe6bd",
  // Rose (warn / urgent)
  rose: "#c14d4d",
  roseSoft: "#f7d9d9",
  // Hairlines
  border: "#e3d6c2",
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const fonts = {
  display: "Fraunces_600SemiBold",
  displayRegular: "Fraunces_400Regular",
  body: "InstrumentSans_400Regular",
  bodyMedium: "InstrumentSans_500Medium",
  bodySemibold: "InstrumentSans_600SemiBold",
} as const;

/** The fonts to register with expo-font's useFonts in the root layout. */
export type ThemeColors = typeof colors;

/** Minimum comfortable tap target for this audience (web uses 3.25rem ≈ 52px). */
export const TAP_TARGET = 52;
