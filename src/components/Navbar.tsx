import { MatchingLogo } from './MatchingLogo';
import type { PageName, AuthUser } from '../types';

interface NavbarProps {
  page: PageName;
  setPage: (p: PageName) => void;
  user: AuthUser | null;
  onLogout: () => void;
}

export function Navbar({ page, setPage, user, onLogout }: NavbarProps) {
  const isLanding = page === 'landing';

  return (
    <nav
      className={`sticky top-0 z-50 flex items-center justify-between px-6 py-3 ${
        isLanding
          ? 'bg-primary'
          : 'bg-white border-b border-border shadow-sm'
      }`}
    >
      {/* Logo */}
      <button
        onClick={() => setPage('landing')}
        className="flex items-center gap-2.5 cursor-pointer"
      >
        <div className="w-8 h-8 rounded-lg bg-teal flex items-center justify-center flex-shrink-0">
          <MatchingLogo size={22} color="#1A3E6E" animated={false} />
        </div>
        <span className={`font-bold text-lg tracking-tight ${isLanding ? 'text-white' : 'text-primary'}`}>
          SynchroniAI
        </span>
      </button>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {user ? (
          /* Connecté */
          <>
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                style={user.role === 'recruteur'
                  ? { background: '#FEF0E8', color: '#F06A28' }
                  : { background: '#F0F8F5', color: '#09C4A0' }}
              >
                {user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
              </div>
              <span className={`text-sm font-medium hidden md:block ${isLanding ? 'text-white/80' : 'text-primary'}`}>
                {user.name.split(' ')[0]}
              </span>
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full hidden md:block"
                style={user.role === 'recruteur'
                  ? { background: '#FEF0E8', color: '#F06A28' }
                  : { background: '#F0F8F5', color: '#09C4A0' }}
              >
                {user.role === 'recruteur' ? 'Recruteur' : 'Candidat'}
              </span>
            </div>
            <button
              onClick={() => setPage(user.role === 'recruteur' ? 'recruteur' : 'candidat')}
              className={`px-4 py-2 rounded-btn text-sm font-semibold transition-all ${
                isLanding
                  ? 'bg-teal text-primary hover:opacity-90'
                  : 'bg-teal text-primary hover:opacity-90'
              }`}
            >
              Mon espace
            </button>
            <button
              onClick={onLogout}
              className={`px-4 py-2 rounded-btn text-sm font-semibold border transition-all ${
                isLanding
                  ? 'border-white/30 text-white hover:bg-white/10'
                  : 'border-border text-muted hover:bg-bg'
              }`}
            >
              Déconnexion
            </button>
          </>
        ) : (
          /* Non connecté */
          <>
            <button
              onClick={() => setPage('login')}
              className={`px-4 py-2 rounded-btn text-sm font-semibold border transition-all ${
                isLanding
                  ? 'border-white/30 text-white hover:bg-white/10'
                  : 'border-border text-muted hover:bg-bg'
              }`}
            >
              Connexion
            </button>
            <button
              onClick={() => setPage('pricing')}
              className="px-4 py-2 rounded-btn text-sm font-semibold bg-teal text-primary hover:opacity-90 transition-all"
            >
              Essai gratuit
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
