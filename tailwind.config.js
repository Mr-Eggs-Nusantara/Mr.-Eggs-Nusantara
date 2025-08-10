/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/react-app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        'heading': ['Poppins', 'Plus Jakarta Sans', 'sans-serif'],
        'body': ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
        'mono': ['JetBrains Mono', 'Monaco', 'Menlo', 'monospace'],
        'brand': ['Poppins', 'sans-serif'],
        'display': ['Poppins', 'sans-serif'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1.1rem', letterSpacing: '0.01em' }],
        'sm': ['0.875rem', { lineHeight: '1.375rem', letterSpacing: '0.005em' }],
        'base': ['1rem', { lineHeight: '1.625rem', letterSpacing: '0em' }],
        'lg': ['1.125rem', { lineHeight: '1.875rem', letterSpacing: '-0.005em' }],
        'xl': ['1.25rem', { lineHeight: '2rem', letterSpacing: '-0.01em' }],
        '2xl': ['1.5rem', { lineHeight: '2.25rem', letterSpacing: '-0.015em' }],
        '3xl': ['1.875rem', { lineHeight: '2.625rem', letterSpacing: '-0.02em' }],
        '4xl': ['2.25rem', { lineHeight: '3rem', letterSpacing: '-0.025em' }],
        '5xl': ['3rem', { lineHeight: '3.75rem', letterSpacing: '-0.03em' }],
        '6xl': ['3.75rem', { lineHeight: '4.5rem', letterSpacing: '-0.035em' }],
      },
      fontWeight: {
        'light': '300',
        'normal': '400',
        'medium': '500',
        'semibold': '600',
        'bold': '700',
        'extrabold': '800',
        'black': '900',
      },
    },
  },
  plugins: [],
};
