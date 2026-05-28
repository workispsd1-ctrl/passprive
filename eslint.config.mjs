import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Next.js route files are discovered by the framework, not imported
    "**/page.tsx",
    "**/layout.tsx",
    "**/route.ts",
    "**/loading.tsx",
    "**/error.tsx",
    "**/not-found.tsx",
  ]),
]);

export default eslintConfig;
