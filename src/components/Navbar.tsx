import { MatchingLogo } from './MatchingLogo';
import type { PageName } from '../types';

interface NavbarProps {
  page: PageName;
  setPage: (p: PageName) => void;
}

export function Navbar({ page, setPage }: NavbarProps) {
  const isLanding = page === 'landing';

  return (
    <nav
      className={`sticky top-0 z-50 flex items-center justify-between px-6 py-3 ${
        isLanding
          ? 'bg-primary'
          : 'bg-white border-b border-border shadow-sm'
      }`}
    >
      <button
        onClick={() => setPage('landing')}
        className="flex items-center gap-2.5 cursor-pointer"
      >
        <div className="w-8 h-8 rounded-lg bg-teal flex items-center justify-center flex-shrink-0">
          <MatchingLogo size={22} color="#1A3E6E" animated={false} />
        </div>
        <span
          className={`font-bold text-lg tracking-tight ${
            isLanding ? 'text-white' : 'text-primary'
          }`}
        >
          SynchroniAI
        </span>
      </button>

      <div className="flex items-center gap-3">
        <button
          className={`px-4 py-2 rounded-btn text-sm font-semibold border transition-all ${
            isLanding
              ? 'border-white/30 text-white hover:bg-white/10'
              : 'border-border text-muted hover:bg-bg'
          }`}
        >
          Connexion
        </button>
        <button
          onClick={() => setPage('recruteur')}
          className="px-4 py-2 rounded-btn text-sm font-semibold bg-teal text-primary hover:opacity-90 transition-all"
        >
          Essai gratuit
        </button>
      </div>
    </nav>
  );
}
