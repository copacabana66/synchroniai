/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── Charte SynchroniAI ────────────────────────────────────
        // Inspirée des SaaS premium (Linear, Stripe, Notion) avec
        // une touche humaine et chaleureuse pour le RH/recrutement
        bg:        '#FAFAF7',            // crème pure — chaleur
        'bg-soft': '#F2F0EA',            // crème ombrée — sections
        primary:   '#0F172A',            // charbon profond — texte principal
        'primary-soft': '#1E293B',
        teal:      '#14B8A6',            // émeraude — confiance, croissance
        'teal-light': '#ECFDF5',
        'teal-mid':   '#A7F3D0',
        'teal-deep':  '#0F766E',
        coral:     '#FB7185',            // corail — humain, énergie (NOUVEAU)
        'coral-light': '#FFE4E6',
        gold:      '#F59E0B',            // or — valeur, succès
        'gold-light': '#FEF3C7',
        violet:    '#8B5CF6',            // violet doux — créativité
        'violet-light': '#F3E8FF',
        sage:      '#84CC16',            // vert sauge — apaisant, naturel (NOUVEAU)
        'sage-light': '#ECFCCB',
        ink:       '#475569',            // gris ardoise — texte secondaire
        muted:     '#64748B',
        border:    '#E2E8F0',
        'border-soft': '#F1F5F9',
        card:      '#FFFFFF',
        // legacy aliases — pour rétro-compatibilité du code existant
        orange:    '#FB7185',            // alias coral
        'orange-light': '#FFE4E6',
        success:   '#14B8A6',            // alias teal
        'success-light': '#ECFDF5',
      },
      fontFamily: {
        sans:    ['Outfit', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Hiérarchie typographique premium
        'display': ['clamp(2.5rem, 5vw, 4.5rem)', { lineHeight: '1.05', letterSpacing: '-0.03em', fontWeight: '800' }],
        'h1':      ['clamp(1.875rem, 3vw, 2.5rem)', { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '800' }],
        'h2':      ['clamp(1.5rem, 2.5vw, 1.875rem)', { lineHeight: '1.2', letterSpacing: '-0.015em', fontWeight: '700' }],
      },
      borderRadius: {
        card: '20px',
        btn:  '12px',
        pill: '999px',
      },
      boxShadow: {
        'soft':    '0 2px 8px -2px rgba(15,23,42,0.06), 0 1px 3px -1px rgba(15,23,42,0.04)',
        'medium':  '0 8px 24px -6px rgba(15,23,42,0.08), 0 4px 8px -2px rgba(15,23,42,0.04)',
        'glow':    '0 0 32px -8px rgba(20,184,166,0.35)',
        'glow-coral': '0 0 32px -8px rgba(251,113,133,0.35)',
      },
      animation: {
        'spin-slow':   'spin 8s linear infinite',
        'pulse-soft':  'pulse-soft 2.2s ease-in-out infinite',
        'fade-in':     'fade-in 0.6s ease-out forwards',
        'fade-up':     'fade-up 0.6s ease-out forwards',
        'slide-in':    'slide-in 0.4s ease-out forwards',
        'marquee':     'marquee 30s linear infinite',
        'shimmer':     'shimmer 2.4s ease-in-out infinite',
        'float':       'float 6s ease-in-out infinite',
        'word-cycle':  'word-cycle 8s ease-in-out infinite',
        'bg-pan':      'bg-pan 14s ease-in-out infinite',
      },
      keyframes: {
        'pulse-soft': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%':       { transform: 'scale(0.94)', opacity: '0.72' },
        },
        'fade-in': {
          'from': { opacity: '0' },
          'to':   { opacity: '1' },
        },
        'fade-up': {
          'from': { opacity: '0', transform: 'translateY(12px)' },
          'to':   { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          'from': { opacity: '0', transform: 'translateX(-12px)' },
          'to':   { opacity: '1', transform: 'translateX(0)' },
        },
        'marquee': {
          'from': { transform: 'translateX(0)' },
          'to':   { transform: 'translateX(-50%)' },
        },
        'shimmer': {
          '0%, 100%': { opacity: '0.5' },
          '50%':       { opacity: '1' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':       { transform: 'translateY(-8px)' },
        },
        'word-cycle': {
          '0%, 22%':   { opacity: '0', transform: 'translateY(10px)' },
          '5%, 18%':   { opacity: '1', transform: 'translateY(0)' },
          '20%, 100%': { opacity: '0', transform: 'translateY(-10px)' },
        },
        'bg-pan': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%':       { backgroundPosition: '100% 50%' },
        },
      },
    },
  },
  plugins: [],
}
