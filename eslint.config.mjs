import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Apostrophes in JSX text are fine — React renders them correctly and
      // the alternative (&apos;) hurts readability for body copy.
      "react/no-unescaped-entities": "off",
    },
  },
];

export default eslintConfig;
