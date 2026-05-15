import type { Config } from 'tailwindcss'

// Thin shim per D-18 — Tailwind v4 sources design tokens from src/styles/theme.css @theme block.
// This file exists for content paths and plugin registration only; no theme.extend.colors here.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  plugins: [],
} satisfies Config
