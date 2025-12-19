const {
    defineConfig,
} = require("eslint/config");

const tsParser = require("@typescript-eslint/parser");
const typescriptEslint = require("@typescript-eslint/eslint-plugin");
const prettier = require("eslint-plugin-prettier");
const playwrightPlugin = require("eslint-plugin-plugin:playwright/playwright-test");
const js = require("@eslint/js");

const {
    FlatCompat,
} = require("@eslint/eslintrc");

const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});
var tsConfigs = ["./tsconfig.json"];
var tsConfigEmail = ["./tsconfig-emails.json"];

var ruleOverrides = {
    "@typescript-eslint/no-unused-vars": "warn",
};

var srcRuleOverrides = {
    "prettier/prettier": 1,
    "@typescript-eslint/no-unused-vars": "warn",
};

module.exports = defineConfig([{}, {
    extends: compat.extends(
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:@next/next/recommended",
        "prettier",
    ),

    languageOptions: {
        parser: tsParser,

        parserOptions: {
            project: tsConfigs,
        },
    },

    plugins: {
        "@typescript-eslint": typescriptEslint,
        prettier,
    },

    rules: srcRuleOverrides,
    files: ["src/**/*.ts", "src/**/*.tsx"],
}, {
    extends: compat.extends(
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:@next/next/recommended",
        "prettier",
    ),

    languageOptions: {
        parser: tsParser,

        parserOptions: {
            project: tsConfigEmail,
        },
    },

    plugins: {
        "@typescript-eslint": typescriptEslint,
        prettier,
    },

    rules: srcRuleOverrides,
    files: ["src/**/*.ts", "src/**/*.tsx", "emails/**/*.ts", "emails/**/*.tsx"],
}, {
    extends: compat.extends("eslint:recommended", "plugin:@typescript-eslint/recommended", "prettier"),

    languageOptions: {
        parser: tsParser,

        parserOptions: {
            project: tsConfigs,
        },
    },

    plugins: {
        "@typescript-eslint": typescriptEslint,
        "plugin:playwright/playwright-test": playwrightPlugin,
        prettier,
    },

    rules: srcRuleOverrides,
    files: ["e2e/**/*.spec.ts"],
}, {
    extends: compat.extends("eslint:recommended", "prettier", "esnext"),
    files: ["**/*.mjs"],
    rules: ruleOverrides,
}, {
    extends: compat.extends("eslint:recommended", "prettier", "node"),
    files: ["**/next.config.mjs"],
    rules: ruleOverrides,
}, {
    extends: compat.extends("prettier"),
    files: ["**/*.js"],
    rules: ruleOverrides,
}]);
