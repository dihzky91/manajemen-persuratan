// ESLint v9 flat config minimal — tanpa dependency tambahan.
// Untuk lint Next.js/TypeScript yang lebih ketat, install `eslint-config-next`
// lalu masukkan ke array di bawah lewat FlatCompat.
import js from "@eslint/js";
import prettier from "eslint-config-prettier";

export default [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "out/**",
      "dist/**",
      "drizzle/migrations/**",
      "public/**",
      "storage/**",
      "*.tsbuildinfo",
    ],
  },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        // Browser globals umum
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        localStorage: "readonly",
        sessionStorage: "readonly",
        fetch: "readonly",
        FormData: "readonly",
        File: "readonly",
        Blob: "readonly",
        URL: "readonly",
        URLSearchParams: "readonly",
        Headers: "readonly",
        Request: "readonly",
        Response: "readonly",
        ReadableStream: "readonly",
        crypto: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        // Node globals
        process: "readonly",
        Buffer: "readonly",
        console: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        global: "readonly",
        // React/JSX
        React: "readonly",
        JSX: "readonly",
      },
    },
    rules: {
      // Project pakai TS — biarkan tsc yang kerjakan no-undef untuk file TS.
      "no-undef": "off",
      "no-unused-vars": "off",
      "no-empty": ["warn", { allowEmptyCatch: true }],
    },
  },
  prettier,
];
