import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

// Regras do react-hooks incluem a que barra setState direto no corpo de um efeito
// (react-hooks/set-state-in-effect): carregue dados com TanStack Query ou no callback da promessa.
export default tseslint.config(
  { ignores: ["dist/**", "node_modules/**"] },
  {
    files: ["**/*.{ts,tsx}"],
    extends: [js.configs.recommended, ...tseslint.configs.recommended, reactHooks.configs.flat.recommended],
    languageOptions: { ecmaVersion: 2022, globals: globals.browser },
  },
  {
    files: ["vite.config.ts"],
    languageOptions: { globals: globals.node },
  },
);
