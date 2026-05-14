/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:       '#F5F7F0',
        primary:  '#1A3E6E',
        teal:     '#09C4A0',
        'teal-light': '#F0F8F5',
        'teal-mid':   '#D0F2EB',
        orange:   '#F06A28',
        'orange-light': '#FEF0E8',
        success:  '#23B574',
        'success-light': '#E8F8EF',
        violet:   '#6851C7',
        'violet-light': '#F0EDFB',
        muted:    '#6A6B80',
        border:   'rgba(26,62,110,0.08)',
        card:     '#FFFFFF',
      },
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
        btn:  '10px',
      },
      animation: {
        'spin-slow': 'spin 8s linear infinite',
        'pulse-soft': 'pulse-soft 2.2s ease-in-out infinite',
      },
      keyframes: {
        'pulse-soft': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%':       { transform: 'scale(0.94)', opacity: '0.72' },
        },
      },
    },
  },
  plugins: [],
}
