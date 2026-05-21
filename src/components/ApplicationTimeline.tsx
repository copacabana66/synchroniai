import type { ApplicationStatus } from '../lib/applicationsService';

interface Props {
  status: ApplicationStatus;
  compact?: boolean;
}

/**
 * Timeline visuelle des étapes d'une candidature.
 * 5 étapes : envoyée → vue → en analyse → entretien → décision finale
 *
 * Mapping :
 *   pending     → 1 (envoyée)
 *   reviewed    → 2 (vue)
 *   interview   → 4 (entretien)
 *   accepted    → 5 ✓ (décision positive)
 *   rejected    → 5 ✗ (décision négative)
 */
const STEPS = [
  { key: 'sent',     label: 'Envoyée',     icon: '📤' },
  { key: 'received', label: 'Reçue',       icon: '👁' },
  { key: 'analysis', label: 'En analyse',  icon: '🔍' },
  { key: 'interview',label: 'Entretien',   icon: '💬' },
  { key: 'decision', label: 'Décision',    icon: '🎯' },
] as const;

function stepIndexFor(status: ApplicationStatus): number {
  switch (status) {
    case 'pending':   return 0;
    case 'reviewed':  return 1;
    case 'interview': return 3;
    case 'accepted':  return 4;
    case 'rejected':  return 4;
    default:          return 0;
  }
}

export function ApplicationTimeline({ status, compact = false }: Props) {
  const currentIdx = stepIndexFor(status);
  const finalRejected = status === 'rejected';
  const finalAccepted = status === 'accepted';

  return (
    <div className={`w-full ${compact ? 'py-2' : 'py-4'}`}>
      {/* Étapes */}
      <div className="relative flex items-center justify-between">
        {/* Ligne de fond */}
        <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-gray-200 -translate-y-1/2 -z-0" />
        {/* Ligne de progression */}
        <div
          className="absolute top-1/2 left-4 h-0.5 -translate-y-1/2 z-0 transition-all duration-700"
          style={{
            width: `calc(${(currentIdx / (STEPS.length - 1)) * 100}% - 16px)`,
            background: finalRejected
              ? 'linear-gradient(90deg, #14B8A6, #E11D48)'
              : 'linear-gradient(90deg, #14B8A6, #0F766E)',
          }}
        />

        {STEPS.map((step, i) => {
          const isDone   = i < currentIdx;
          const isActive = i === currentIdx;
          const isFuture = i > currentIdx;

          // Cas particulier : étape "Décision" finale
          let bg = '#E5E7EB', fg = '#9CA3AF', border = '#E5E7EB';
          if (i === STEPS.length - 1 && finalAccepted) {
            bg = '#14B8A6'; fg = '#fff'; border = '#0F766E';
          } else if (i === STEPS.length - 1 && finalRejected) {
            bg = '#E11D48'; fg = '#fff'; border = '#9F1239';
          } else if (isDone || isActive) {
            bg = '#14B8A6'; fg = '#fff'; border = '#0F766E';
          }

          return (
            <div key={step.key} className="flex flex-col items-center gap-1.5 relative z-10">
              <div
                className={`flex items-center justify-center rounded-full border-2 font-bold transition-all ${
                  compact ? 'w-7 h-7 text-xs' : 'w-10 h-10 text-sm'
                } ${isActive && !finalAccepted && !finalRejected ? 'animate-pulse-soft scale-110' : ''}`}
                style={{ background: bg, color: fg, borderColor: border }}
              >
                {isFuture ? (i + 1) : compact ? '✓' : step.icon}
              </div>
              {!compact && (
                <span
                  className={`text-[10px] font-semibold uppercase tracking-wider text-center transition-colors ${
                    isActive ? 'text-primary' : isDone ? 'text-teal' : 'text-muted'
                  }`}
                >
                  {step.label}
                  {i === STEPS.length - 1 && finalAccepted && ' ✓'}
                  {i === STEPS.length - 1 && finalRejected && ' ✗'}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
