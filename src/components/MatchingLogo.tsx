interface MatchingLogoProps {
  size?: number;
  animated?: boolean;
  variant?: 'gradient' | 'mono' | 'white';
}

/**
 * Logo SynchroniAI — un S formé par deux cercles qui s'unissent.
 * Métaphore visuelle : deux parties (recruteur + candidat) qui se rejoignent
 * au point de matching central. Le tracé S émerge de leur union.
 */
export function MatchingLogo({
  size = 56,
  animated = true,
  variant = 'gradient',
}: MatchingLogoProps) {
  const id = (variant === 'gradient') ? 'sai-grad' : variant;

  // Couleurs selon le variant
  const topColor    = variant === 'mono'  ? '#0F172A' : variant === 'white' ? '#FFFFFF' : 'url(#sai-grad-top)';
  const bottomColor = variant === 'mono'  ? '#0F172A' : variant === 'white' ? '#FFFFFF' : 'url(#sai-grad-bot)';
  const dotTop      = variant === 'mono'  ? '#0F172A' : variant === 'white' ? '#FFFFFF' : '#14B8A6';
  const dotBot      = variant === 'mono'  ? '#0F172A' : variant === 'white' ? '#FFFFFF' : '#FB7185';
  const centerDot   = variant === 'white' ? '#FFFFFF' : '#0F172A';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 56 64"
      fill="none"
      style={{ display: 'block' }}
      aria-label="SynchroniAI logo"
    >
      <defs>
        <linearGradient id={`${id}-top`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#14B8A6" />
          <stop offset="100%" stopColor="#0F766E" />
        </linearGradient>
        <linearGradient id={`${id}-bot`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#FB7185" />
          <stop offset="100%" stopColor="#E11D48" />
        </linearGradient>
      </defs>

      {/* Boucle haute : cercle qui forme le haut du S
          Centre (28, 22), rayon 12. De droite (40,22) → haut → gauche → bas (28,34) */}
      <path
        d="M 40 22 A 12 12 0 1 0 28 34"
        stroke={topColor}
        strokeWidth="5.5"
        strokeLinecap="round"
        fill="none"
        style={animated ? { strokeDasharray: 60, strokeDashoffset: 0, animation: 'logo-draw-top 1.4s ease-out' } : undefined}
      />

      {/* Boucle basse : cercle qui forme le bas du S
          Centre (28, 46), rayon 12. De haut (28,34) → droite → bas → gauche (16,46) */}
      <path
        d="M 28 34 A 12 12 0 1 1 16 46"
        stroke={bottomColor}
        strokeWidth="5.5"
        strokeLinecap="round"
        fill="none"
        style={animated ? { strokeDasharray: 60, strokeDashoffset: 0, animation: 'logo-draw-bot 1.4s ease-out 0.2s' } : undefined}
      />

      {/* Points d'extrémité — les deux parties qui se rencontrent */}
      <circle cx="40" cy="22" r="3.2" fill={dotTop} className={animated ? 'animate-pulse-soft' : ''} />
      <circle cx="16" cy="46" r="3.2" fill={dotBot} className={animated ? 'animate-pulse-soft' : ''} style={{ animationDelay: '0.7s' }} />

      {/* Point de matching central */}
      <circle cx="28" cy="34" r="2.4" fill={centerDot} />
    </svg>
  );
}
