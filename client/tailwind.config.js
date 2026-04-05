/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // BudgetAI v2 palette
        'bg-primary': '#0A0A0F',
        'bg-surface': '#111118',
        'bg-elevated': '#1a1a2e',
        'accent-primary': '#6366F1',
        'accent-secondary': '#8B5CF6',
        positive: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        'text-primary': '#F9FAFB',
        'text-secondary': '#9CA3AF',
        'text-muted': '#6B7280',
        border: '#1E1E2E',
        // Keep legacy (used by old villain components)
        brand: '#E8341A',
        dark: '#0F0D0C',
        cream: '#F7F2EC',
        muted: '#8A7F76',
      },
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
        dm: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
