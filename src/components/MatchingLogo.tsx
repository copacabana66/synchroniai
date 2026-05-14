interface MatchingLogoProps {
  size?: number;
  color?: string;
  animated?: boolean;
}

export function MatchingLogo({
  size = 56,
  color = '#09C4A0',
  animated = true,
}: MatchingLogoProps) {
  return (
    <div
      style={{ width: size, height: size, position: 'relative' }}
      className={animated ? 'animate-pulse-soft' : ''}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: `1.5px solid ${color}`,
          opacity: 0.28,
        }}
      />
      <svg
        width={size}
        height={size}
        viewBox="0 0 56 56"
        fill="none"
        className={animated ? 'animate-spin-slow' : ''}
        style={{ display: 'block' }}
      >
        <path
          d="M 10 28 A 18 18 0 0 1 46 28"
          stroke={color}
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <path
          d="M 43 21 L 46 28 L 40 29.5"
          stroke={color}
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 46 28 A 18 18 0 0 1 10 28"
          stroke={color}
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <path
          d="M 13 35 L 10 28 L 16 26.5"
          stroke={color}
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="28" cy="28" r="5.5" fill={color} opacity="0.2" />
        <circle cx="28" cy="28" r="3.5" fill={color} />
      </svg>
    </div>
  );
}
