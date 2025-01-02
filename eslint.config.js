import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import typescriptEslintParser from "@typescript-eslint/parser";

export default [
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    {
    files: [
        "**/*.ts",
    ],
    languageOptions: {
        parser: typescriptEslintParser,
        ecmaVersion: 2022,
        sourceType: "module",
        globals: {
            vueStandings: "readonly",
        },
    },
}];