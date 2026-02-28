import daisyui from 'daisyui'
import defaultTheme from 'daisyui/src/theming/themes'
import { Config } from 'tailwindcss'

const config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
    './src/scenes/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      boxShadow: {
        'inset-sm': 'inset 0 1px 10px 0 rgba(0, 0, 0, 0.05)',
      },
      fontFamily: {
        bai: ['var(--font-bai-jamjuree)'],
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        classroom: {
          ...defaultTheme.light,
          primary: '#2460E3',
          '.btn': {
            animation: 0,
          },
        },
      },
    ],
  },
} satisfies Config

export default config
