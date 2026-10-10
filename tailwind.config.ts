import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: { colors: { mora: '#ff0a89' } } },
  plugins: [],
} satisfies Config;
