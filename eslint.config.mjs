import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

// Next.js 및 TypeScript 규칙으로 소스 코드를 검사하고 생성 파일은 제외합니다.
export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  globalIgnores([
    ".next/**",
    "out/**",
    "next-env.d.ts",
    ".agents/**",
    ".claude/**",
    ".aider-desk/**",
    ".taste-skill/**",
    "test-results/**",
  ]),
]);
