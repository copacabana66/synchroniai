import { MatchingLogo } from '../components/MatchingLogo';
import type { PageName } from '../types';
import { candidates } from '../data/candidates';
import { offers } from '../data/offers';
import { testimonials } from '../data/testimonials';
import { ScoreBadge } from '../components/ScoreBadge';
import { Avatar } from '../components/Avatar';

interface LandingProps {
  setPage: (p: PageName) => void;
}

const benefits = {
  candidats: [
    {
      icon: '🎯',
      title: 'Trouvez une entreprise qui marche comme vous',
      desc: 'Compatibilité management, ambiance équipe et rythme de travail.',
    },
    {
      icon: '📊',
      title: 'Comprenez pourquoi vous matchez',
      desc: 'Scores transparents sur 7 dimensions — aucune boîte noire.',
    },
    {
      icon: '⚡',
      title: 'Offres ciblées, zéro spam',
      desc: 'Recevez uniquement les opportunités compatibles avec votre profil.',
    },
    {
      icon: '🔒',
      title: 'Vos données vous appartiennent',
      desc: 'Conformité RGPD totale. Vous contrôlez ce que vous partagez.',
    },
  ],
  recruteurs: [
    {
      icon: '📉',
      title: 'Diminuez votre turnover',
      desc: 'Recrutez pour la durée. Réduisez le coût des départs prématurés.',
    },
    {
      icon: '🤝',
      title: 'Matching organisationnel précis',
      desc: 'Compatibilité management, équipe et environnement mesurée.',
    },
    {
      icon: '⚖️',
      title: 'Conforme AI Act européen',
      desc: 'Audit trail, supervision humaine, zéro décision automatisée.',
    },
    {
      icon: '⏱️',
      title: 'Gagnez 3 semaines par recrutement',
      desc: 'Présélection structurée. Moins de temps CVs, plus d\'entretiens vrais.',
    },
  ],
};

export function Landing({ setPage }: LandingProps) {
  return (
    <div className="min-h-screen">
      {/* HERO */}
      <section className="bg-primary py-20 px-8 text-center">
        <span className="inline-block mb-5 px-4 py-1.5 rounded-full bg-teal/15 border border-teal/30 text-teal text-xs font-bold tracking-widest uppercase">
          ✦ CONFORME AI ACT EUROPÉEN — MATCHING EXPLICABLE
        </span>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight max-w-2xl mx-auto mb-5">
          Le recrutement qui réduit{' '}
          <span className="text-teal">le turnover</span>
        </h1>
        <p className="text-white/60 text-lg max-w-xl mx-auto mb-12">
          Matching professionnel augmenté par IA sur 7 dimensions. Transparent,
          explicable, centré humain.
        </p>

        {/* Three-element hero row */}
        <div className="flex items-center justify-center gap-0 flex-wrap max-w-3xl mx-auto">
          {/* Left card */}
          <button
            onClick={() => setPage('candidat')}
            className="flex-1 max-w-xs text-center rounded-2xl p-8 cursor-pointer border-[1.5px] border-white/12 transition-all duration-200 hover:border-teal/40"
            style={{ background: 'rgba(255,255,255,0.05)' }}
            onMouseEnter={e =>
              ((e.currentTarget as HTMLElement).style.background =
                'rgba(255,255,255,0.10)')
            }
            onMouseLeave={e =>
              ((e.currentTarget as HTMLElement).style.background =
                'rgba(255,255,255,0.05)')
            }
          >
            <div className="text-5xl mb-4">👤</div>
            <h3 className="text-xl font-extrabold text-white mb-2">
              Espace Candidat
            </h3>
            <p className="text-white/50 text-sm leading-relaxed mb-5">
              Trouvez un poste aligné avec votre personnalité, vos valeurs et
              votre style de travail.
            </p>
            <span className="inline-block px-5 py-2.5 rounded-btn bg-teal text-primary font-bold text-sm">
              Accéder →
            </span>
          </button>

          {/* Center logo */}
          <div className="flex flex-col items-center gap-1.5 px-5 flex-shrink-0">
            <div className="w-16 h-16 rounded-full bg-teal/10 border-2 border-teal/30 flex items-center justify-center animate-pulse-soft">
              <MatchingLogo size={40} color="#09C4A0" animated={true} />
            </div>
          </div>

          {/* Right card */}
          <button
            onClick={() => setPage('recruteur')}
            className="flex-1 max-w-xs text-center rounded-2xl p-8 cursor-pointer border-[1.5px] border-white/12 transition-all duration-200 hover:border-orange/40"
            style={{ background: 'rgba(255,255,255,0.05)' }}
            onMouseEnter={e =>
              ((e.currentTarget as HTMLElement).style.background =
                'rgba(255,255,255,0.10)')
            }
            onMouseLeave={e =>
              ((e.currentTarget as HTMLElement).style.background =
                'rgba(255,255,255,0.05)')
            }
          >
            <div className="text-5xl mb-4">🏢</div>
            <h3 className="text-xl font-extrabold text-white mb-2">
              Espace Recruteur
            </h3>
            <p className="text-white/50 text-sm leading-relaxed mb-5">
              Identifiez les candidats qui durent. Matching organisationnel en
              7 dimensions expliquées.
            </p>
            <span className="inline-block px-5 py-2.5 rounded-btn bg-orange text-white font-bold text-sm">
              Accéder →
            </span>
          </button>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="bg-teal py-4 px-8">
        <div className="flex flex-wrap justify-center gap-8 md:gap-16">
          {[
            { value: '2 400+', label: 'candidats actifs' },
            { value: '180+', label: 'entreprises' },
            { value: '91%', label: 'satisfaction DRH' },
            { value: '−38%', label: 'turnover moyen' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className="text-2xl font-extrabold text-primary">
                {s.value}
              </div>
              <div className="text-xs text-primary/60 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* BENEFITS */}
      <section className="bg-bg py-20 px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold text-teal tracking-widest uppercase mb-2">
              POURQUOI SYNCHRONIAI
            </p>
            <h2 className="text-3xl font-extrabold text-primary tracking-tight">
              Conçu pour chaque acteur du recrutement
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Candidats */}
            <div>
              <div className="border-l-4 border-teal bg-teal-light rounded-xl px-5 py-3 mb-4 flex items-center gap-3">
                <span className="text-2xl">👤</span>
                <div>
                  <div className="font-extrabold text-primary">
                    Pour les candidats
                  </div>
                  <div className="text-teal text-xs font-medium">
                    Trouvez où vous vous épanouissez vraiment
                  </div>
                </div>
              </div>
              {benefits.candidats.map(b => (
                <div
                  key={b.title}
                  className="bg-card border border-border rounded-xl p-4 flex gap-3 mb-3"
                >
                  <div className="w-10 h-10 rounded-lg bg-teal-light flex items-center justify-center flex-shrink-0 text-lg">
                    {b.icon}
                  </div>
                  <div>
                    <div className="font-semibold text-primary text-sm mb-0.5">
                      {b.title}
                    </div>
                    <div className="text-muted text-sm">{b.desc}</div>
                  </div>
                </div>
              ))}
              <button
                onClick={() => setPage('candidat-profil')}
                className="w-full bg-teal text-primary font-bold rounded-btn py-3 mt-2 hover:opacity-90 transition-all"
              >
                Créer mon profil candidat →
              </button>
            </div>

            {/* Recruteurs */}
            <div>
              <div className="border-l-4 border-orange bg-orange-light rounded-xl px-5 py-3 mb-4 flex items-center gap-3">
                <span className="text-2xl">🏢</span>
                <div>
                  <div className="font-extrabold text-primary">
                    Pour les recruteurs
                  </div>
                  <div className="text-orange text-xs font-medium">
                    Recrutez pour la durée, pas pour le CV
                  </div>
                </div>
              </div>
              {benefits.recruteurs.map(b => (
                <div
                  key={b.title}
                  className="bg-card border border-border rounded-xl p-4 flex gap-3 mb-3"
                >
                  <div className="w-10 h-10 rounded-lg bg-orange-light flex items-center justify-center flex-shrink-0 text-lg">
                    {b.icon}
                  </div>
                  <div>
                    <div className="font-semibold text-primary text-sm mb-0.5">
                      {b.title}
                    </div>
                    <div className="text-muted text-sm">{b.desc}</div>
                  </div>
                </div>
              ))}
              <button
                onClick={() => setPage('recruteur')}
                className="w-full bg-orange text-white font-bold rounded-btn py-3 mt-2 hover:opacity-90 transition-all"
              >
                Accéder au tableau de bord →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* DASHBOARD PREVIEW */}
      <section className="bg-primary py-20 px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-white tracking-tight mb-3">
              Aperçu de la plateforme
            </h2>
            <p className="text-white/50">
              Deux espaces dédiés, une seule plateforme intelligente
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recruteur preview */}
            <div
              className="rounded-2xl p-6 border"
              style={{
                background: 'rgba(255,255,255,0.06)',
                borderColor: 'rgba(255,255,255,0.08)',
              }}
            >
              <p className="text-orange text-xs font-bold uppercase tracking-widest mb-4">
                ESPACE RECRUTEUR
              </p>
              {candidates.slice(0, 4).map(c => (
                <button
                  key={c.id}
                  onClick={() => setPage('recruteur')}
                  className="w-full flex items-center gap-3 rounded-xl p-3 mb-2 cursor-pointer hover:opacity-90 transition-all"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                >
                  <Avatar initials={c.initials} color={c.avatarColor} size={36} />
                  <div className="flex-1 text-left">
                    <div className="text-sm font-semibold text-white">
                      {c.name}
                    </div>
                    <div className="text-xs text-white/50">{c.role}</div>
                  </div>
                  <ScoreBadge score={c.score} />
                </button>
              ))}
              <button
                onClick={() => setPage('recruteur')}
                className="w-full mt-3 py-2.5 rounded-btn bg-orange text-white text-sm font-bold hover:opacity-90 transition-all"
              >
                Voir tous les candidats →
              </button>
            </div>

            {/* Candidat preview */}
            <div
              className="rounded-2xl p-6 border"
              style={{
                background: 'rgba(255,255,255,0.06)',
                borderColor: 'rgba(255,255,255,0.08)',
              }}
            >
              <p className="text-teal text-xs font-bold uppercase tracking-widest mb-4">
                ESPACE CANDIDAT
              </p>
              {offers.map(o => (
                <button
                  key={o.id}
                  onClick={() => setPage('candidat')}
                  className="w-full flex items-center gap-3 rounded-xl p-3 mb-2 cursor-pointer hover:opacity-90 transition-all"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{
                      background: o.accentColor + '26',
                      color: o.accentColor,
                    }}
                  >
                    {o.logoInitials}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-semibold text-white">
                      {o.role}
                    </div>
                    <div className="text-xs text-white/50">
                      {o.company} · {o.location}
                    </div>
                  </div>
                  <ScoreBadge score={o.score} />
                </button>
              ))}
              <button
                onClick={() => setPage('candidat')}
                className="w-full mt-3 py-2.5 rounded-btn bg-teal text-primary text-sm font-bold hover:opacity-90 transition-all"
              >
                Voir mes offres →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="bg-bg py-20 px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-bold text-teal tracking-wider uppercase mb-2">
              VALIDÉ PAR 10 DRH DE PERPIGNAN
            </p>
            <h2 className="text-3xl font-extrabold text-primary tracking-tight mb-2">
              Ils ont testé SynchroniAI
            </h2>
            <p className="text-muted">
              Retours terrain de professionnels RH de la région
            </p>
          </div>
          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            }}
          >
            {testimonials.map(t => (
              <div
                key={t.name}
                className="bg-card rounded-2xl p-6 border border-border"
                style={{ borderTop: `3px solid ${t.accentColor}` }}
              >
                <p className="italic text-sm text-primary leading-relaxed mb-4">
                  "{t.quote}"
                </p>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-sm text-primary">
                      {t.name}
                    </div>
                    <div className="text-xs text-muted">{t.title}</div>
                    <div className="text-xs text-muted">{t.location}</div>
                  </div>
                  <span
                    className="text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap flex-shrink-0"
                    style={{
                      background: t.accentColor + '26',
                      color: t.accentColor,
                    }}
                  >
                    {t.kpi}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="bg-primary py-16 px-8 text-center">
        <h2 className="text-3xl font-extrabold text-white tracking-tight mb-3">
          Prêt à recruter autrement ?
        </h2>
        <p className="text-white/50 mb-8 max-w-lg mx-auto">
          Rejoignez 180+ entreprises qui réduisent leur turnover avec le
          matching explicable SynchroniAI.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <button
            onClick={() => setPage('recruteur')}
            className="px-8 py-3.5 rounded-btn bg-orange text-white font-bold hover:opacity-90 transition-all"
          >
            Je suis recruteur →
          </button>
          <button
            onClick={() => setPage('candidat')}
            className="px-8 py-3.5 rounded-btn bg-teal text-primary font-bold hover:opacity-90 transition-all"
          >
            Je suis candidat →
          </button>
        </div>
        <p className="text-white/20 text-xs mt-6">
          ✦ Conforme RGPD · AI Act européen · Données hébergées en France
        </p>
      </section>
    </div>
  );
}
