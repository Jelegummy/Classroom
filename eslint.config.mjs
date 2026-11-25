// ESLint 9 flat config (replaces the legacy .eslintrc, which ESLint 9 ignores).
import js from '@eslint/js'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'
import prettier from 'eslint-config-prettier'
import unusedImports from 'eslint-plugin-unused-imports'
import globals from 'globals'
import tseslint from 'typescript-eslint'

const CLIENT = 'apps/client/**/*.{js,jsx,mjs,ts,tsx}'

// Next's presets ship their own repo-wide `files` globs; pin them to the client.
const scopeTo = (files, configs) =>
  configs.map(config =>
    config.ignores && Object.keys(config).length === 1
      ? config
      : { ...config, files },
  )

// eslint-config-next registers the `import` plugin; reuse the same instance for
// the rest of the monorepo so it is not defined twice.
const importPlugin = nextVitals.find(c => c.plugins?.import)?.plugins.import

const sharedRules = {
  'unused-imports/no-unused-imports': 'error',
  'unused-imports/no-unused-vars': [
    'warn',
    {
      vars: 'all',
      varsIgnorePattern: '^_',
      args: 'after-used',
      argsIgnorePattern: '^_',
      caughtErrors: 'none',
    },
  ],
  '@typescript-eslint/no-unused-vars': 'off',
  'padding-line-between-statements': [
    'error',
    { blankLine: 'always', prev: '*', next: 'return' },
  ],
  curly: 'error',
  'no-return-await': 'error',
  eqeqeq: ['error', 'smart'],
  'no-duplicate-imports': ['error', { includeExports: true }],
  'sort-imports': ['error', { ignoreDeclarationSort: true }],
  'no-await-in-loop': 'off',
  '@typescript-eslint/ban-ts-comment': 'off',
}

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/.turbo/**',
      '**/coverage/**',
      '**/.venv/**',
      'packages/db/src/generated/**',
      'apps/client/next-env.d.ts',
      'apps/client/public/**',
      'apps/bot/**',
      'apps/assignment-bot/**',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  // ── Next.js client ───────────────────────────────────────────────────────
  ...scopeTo([CLIENT], nextVitals),
  ...scopeTo([CLIENT], nextTypescript),
  {
    files: [CLIENT],
    settings: {
      next: { rootDir: 'apps/client' },
      react: { version: '19.3' },
    },
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      // React Compiler rules newly enabled by eslint-plugin-react-hooks v7.
      // They flag patterns that work today; kept visible as warnings until the
      // affected components (mainly the canvas game page) are refactored.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/purity': 'warn',
    },
  },

  // ── Server + shared packages ─────────────────────────────────────────────
  {
    files: [
      'apps/server/**/*.ts',
      'packages/**/*.ts',
      'scripts/**/*.mjs',
      '*.ts',
      '*.mjs',
    ],
    plugins: importPlugin ? { import: importPlugin } : {},
    languageOptions: { globals: globals.node },
    rules: {
      camelcase: [
        'error',
        {
          properties: 'never',
          ignoreDestructuring: true,
          ignoreImports: true,
          ignoreGlobals: true,
        },
      ],
      'import/order': [
        'error',
        {
          alphabetize: { order: 'asc' },
          groups: [
            ['external', 'builtin'],
            'internal',
            ['parent', 'sibling', 'index'],
          ],
          'newlines-between': 'always',
        },
      ],
    },
  },

  // ── Everywhere ───────────────────────────────────────────────────────────
  {
    files: ['**/*.{ts,tsx,js,mjs}'],
    plugins: { 'unused-imports': unusedImports },
    rules: sharedRules,
  },
  {
    files: ['**/*.js'],
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },

  prettier,
)
