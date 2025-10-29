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
      // ❌ 완전히 꺼야 할 규칙
      "@typescript-eslint/no-unused-vars": "off",
      "prefer-const": "off",
      "react/no-unescaped-entities": "off",
      "@next/next/no-img-element": "off",
      
      // ✅ 유지할 규칙
      "@typescript-eslint/no-explicit-any": "off",
      "react-hooks/exhaustive-deps": "off", // ⚠️ 개발 중에는 off, 나중에 warn으로 변경 권장
      "react-hooks/rules-of-hooks": "error",
    },
  },
];

export default eslintConfig;
