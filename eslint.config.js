import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "CallExpression[callee.type='MemberExpression'][callee.property.name=/^(slice|split|substring|substr)$/][callee.object.type='CallExpression'][callee.object.callee.property.name='toISOString']",
          message:
            "Don't derive a date-only string from toISOString() — it converts to UTC and returns the previous day in timezones ahead of UTC (BST). Use todayString() / toDateString() / monthRange() from src/lib/dateRange.ts.",
        },
      ],
    },
  },
])
