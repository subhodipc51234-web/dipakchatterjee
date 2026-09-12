// eslint.config.mjs
//
// `next lint` was removed in Next.js 16 (see
// node_modules/next/dist/docs/01-app/03-api-reference/05-config/03-eslint.md)
// in favor of running the ESLint CLI directly against this flat config.
// `npm run lint` now runs `eslint .` — see package.json.

import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
