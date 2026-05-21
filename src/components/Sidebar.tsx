import { useState } from 'react';
import type { PageName, AuthUser } from '../types';
import { MatchingLogo } from './MatchingLogo';

interface Props {
  page: PageName;
  setPage: (p: PageName) => void;
  user: AuthUser;
  onLogout: () => void;
}

interface NavItem {
  icon: string;
  label: string;
  page: PageName;
  description?: string;
}

const CANDIDAT_NAV: NavItem[] = [
  { icon: '🏠', label: 'Tableau de bord',  page: 'candidat',           description: 'Mes offres compatibles' },
  { icon: '📋', label: 'Mon profil',        page: 'candidat-profil',    description: 'CV, questionnaire, audio' },
  { icon: '🧠', label: 'Mon test',          page: 'candidat-test',      description: 'Cognitif & personnalité' },
  { icon: '📬', label: 'Mes candidatures',  page: 'candidat-avancement',description: 'Suivi en temps réel' },
];

const RECRUTEUR_NAV: NavItem[] = [
  { icon: '🏠', label: 'Tableau de bord',    page: 'recruteur',              description: 'Candidats compatibles' },
  { icon: '🧬', label: 'ADN de mon équipe',   page: 'recruteur-team',         description: 'Profil collectif' },
  { icon: '📝', label: 'Fiches de poste',     page: 'recruteur-fiche-poste',  description: 'Créer / éditer' },
];

export function Sidebar({ page, setPage, user, onLogout }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const nav = user.role === 'recruteur' ? RECRUTEUR_NAV : CANDIDAT_NAV;
  const accent = user.role === 'recruteur' ? '#FB7185' : '#14B8A6';
  const accentLight = user.role === 'recruteur' ? '#FFE4E6' : '#ECFDF5';
  const roleLabel = user.role === 'recruteur' ? 'Recruteur' : 'Candidat';

  return (
    <>
      {/* Bouton mobile */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3 left-3 z-50 w-10 h-10 rounded-btn bg-white border border-border shadow-soft flex items-center justify-center"
        aria-label="Ouvrir le menu"
      >
        <span className="text-primary">☰</span>
      </button>

      {/* Overlay mobile */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="md:hidden fixed inset-0 bg-primary/40 backdrop-blur-sm z-40"
        />
      )}

      <aside
        className={`
          fixed md:sticky top-0 left-0 z-50 h-screen bg-primary text-white
          flex flex-col transition-all duration-300 ease-out
          ${collapsed ? 'md:w-16' : 'md:w-60'}
          ${mobileOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full md:translate-x-0'}
          shadow-2xl md:shadow-none
        `}
      >
        {/* Header logo + collapse */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
          <button
            onClick={() => { setPage('landing'); setMobileOpen(false); }}
            className="flex items-center gap-2 group"
          >
            <MatchingLogo size={28} variant="white" animated={false} />
            {!collapsed && (
              <span className="font-extrabold text-base tracking-tight whitespace-nowrap">SynchroniAI</span>
            )}
          </button>
          <button
            onClick={() => setCollapsed(c => !c)}
            className="hidden md:flex text-white/40 hover:text-white text-xs w-6 h-6 items-center justify-center rounded hover:bg-white/10 transition"
            aria-label="Réduire la barre"
          >
            {collapsed ? '→' : '←'}
          </button>
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden text-white/60 hover:text-white text-xl"
            aria-label="Fermer"
          >
            ×
          </button>
        </div>

        {/* User badge */}
        <div className="px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: accentLight, color: accent }}
            >
              {user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-sm truncate">{user.name.split(' ')[0]}</div>
                <div className="text-[10px] uppercase tracking-wider opacity-60" style={{ color: accent }}>
                  {roleLabel}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {nav.map(item => {
            const isActive = page === item.page;
            return (
              <button
                key={item.page}
                onClick={() => { setPage(item.page); setMobileOpen(false); }}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-btn text-left transition-all group
                  ${isActive
                    ? 'bg-white/10 border-l-2 -ml-px'
                    : 'hover:bg-white/5 border-l-2 border-transparent -ml-px text-white/70 hover:text-white'}
                `}
                style={isActive ? { borderLeftColor: accent } : undefined}
                title={collapsed ? item.label : undefined}
              >
                <span className="text-lg flex-shrink-0">{item.icon}</span>
                {!collapsed && (
                  <div className="min-w-0 flex-1">
                    <div className={`text-sm font-semibold truncate ${isActive ? 'text-white' : ''}`}>
                      {item.label}
                    </div>
                    {item.description && (
                      <div className="text-[10px] text-white/40 truncate">{item.description}</div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer : support + logout */}
        <div className="px-2 pb-4 pt-2 border-t border-white/10 space-y-1">
          {!collapsed && (
            <a
              href="mailto:renatoprojetrecrutement@gmail.com?subject=Support%20SynchroniAI"
              className="flex items-center gap-3 px-3 py-2 rounded-btn text-white/60 hover:text-white hover:bg-white/5 transition-all text-xs"
            >
              <span>💬</span>
              <span className="truncate">Contacter le support</span>
            </a>
          )}
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-btn text-white/60 hover:text-white hover:bg-white/5 transition-all"
            title={collapsed ? 'Déconnexion' : undefined}
          >
            <span>↪</span>
            {!collapsed && <span className="text-sm">Déconnexion</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
