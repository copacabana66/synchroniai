import type { PageName } from '../types';
import { MatchingLogo } from '../components/MatchingLogo';

interface PricingProps {
  setPage: (p: PageName) => void;
  setPlanChoice: (plan: 'recruteur' | 'candidat') => void;
}

const candidatFeatures = [
  '✓ Profil complet sur 7 dimensions',
  '✓ Matching avec les offres compatibles',
  '✓ Scores de compatibilité transparents',
  '✓ Suivi de candidatures en temps réel',
  '✓ Messagerie avec les recruteurs',
  '✓ Conformité RGPD totale',
];

const recruteurFeatures = [
  '✓ Tableau de bord illimité',
  '✓ Analyse IA sur 7 dimensions',
  '✓ Radar de compatibilité Recharts',
  '✓ Recommandations explicables (AI Act)',
  '✓ Export PDF des comptes rendus',
  '✓ Support prioritaire 7j/7',
];

export function Pricing({ setPage, setPlanChoice }: PricingProps) {
  function choose(plan: 'recruteur' | 'candidat') {
    setPlanChoice(plan);
    setPage('register');
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <div className="bg-primary py-14 px-8 text-center">
        <button onClick={() => setPage('landing')} className="flex items-center gap-2.5 mx-auto mb-8">
          <div className="w-8 h-8 rounded-lg bg-teal flex items-center justify-center">
            <MatchingLogo size={22} color="#1A3E6E" animated={false} />
          </div>
          <span className="font-bold text-lg text-white tracking-tight">SynchroniAI</span>
        </button>
        <span className="inline-block mb-4 px-4 py-1.5 rounded-full bg-teal/15 border border-teal/30 text-teal text-xs font-bold tracking-widest uppercase">
          TARIFS TRANSPARENTS
        </span>
        <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-3">
          Choisissez votre espace
        </h1>
        <p className="text-white/60 max-w-lg mx-auto text-sm">
          Deux profils, deux accès. Commencez gratuitement ou lancez votre essai recruteur sans engagement.
        </p>
      </div>

      {/* Plans */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">

          {/* Candidat */}
          <div className="bg-card rounded-card border-2 border-teal/30 p-8 flex flex-col">
            <div className="mb-6">
              <div className="w-12 h-12 rounded-xl bg-teal-light flex items-center justify-center text-2xl mb-4">👤</div>
              <h2 className="text-xl font-extrabold text-primary mb-1">Espace Candidat</h2>
              <p className="text-muted text-sm">Trouvez l'entreprise qui vous ressemble vraiment.</p>
            </div>

            <div className="mb-6">
              <div className="flex items-end gap-1 mb-1">
                <span className="text-4xl font-extrabold text-teal">Gratuit</span>
              </div>
              <p className="text-xs text-muted">Accès complet, sans carte bancaire</p>
            </div>

            <ul className="space-y-2.5 mb-8 flex-1">
              {candidatFeatures.map(f => (
                <li key={f} className="text-sm text-primary flex items-start gap-2">
                  <span className="text-teal font-bold flex-shrink-0">✓</span>
                  <span>{f.replace('✓ ', '')}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => choose('candidat')}
              className="w-full py-3 rounded-btn bg-teal text-primary font-bold text-sm hover:opacity-90 transition-all"
            >
              Commencer gratuitement →
            </button>
          </div>

          {/* Recruteur */}
          <div className="bg-primary rounded-card p-8 flex flex-col relative overflow-hidden">
            <div className="absolute top-4 right-4 bg-orange text-white text-xs font-bold px-3 py-1 rounded-full">
              POPULAIRE
            </div>
            <div className="mb-6">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-2xl mb-4">🏢</div>
              <h2 className="text-xl font-extrabold text-white mb-1">Espace Recruteur</h2>
              <p className="text-white/60 text-sm">Réduisez votre turnover avec le matching explicable.</p>
            </div>

            <div className="mb-6">
              <div className="flex items-end gap-1 mb-1">
                <span className="text-4xl font-extrabold text-orange">49€</span>
                <span className="text-white/60 text-sm mb-1">/mois</span>
              </div>
              <p className="text-xs text-white/40">14 jours d'essai gratuit · Sans engagement</p>
            </div>

            <ul className="space-y-2.5 mb-8 flex-1">
              {recruteurFeatures.map(f => (
                <li key={f} className="text-sm text-white flex items-start gap-2">
                  <span className="text-orange font-bold flex-shrink-0">✓</span>
                  <span>{f.replace('✓ ', '')}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => choose('recruteur')}
              className="w-full py-3 rounded-btn bg-orange text-white font-bold text-sm hover:opacity-90 transition-all"
            >
              Démarrer l'essai gratuit →
            </button>
          </div>
        </div>

        {/* Guarantees */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {[
            { icon: '🔒', title: 'RGPD & AI Act', desc: 'Conformité totale, audit trail inclus' },
            { icon: '💳', title: 'Sans engagement', desc: 'Annulez à tout moment, sans frais' },
            { icon: '🇫🇷', title: 'Données en France', desc: 'Hébergement souverain OVH Cloud' },
          ].map(g => (
            <div key={g.title} className="bg-card border border-border rounded-xl p-4 flex gap-3 items-start">
              <span className="text-xl flex-shrink-0">{g.icon}</span>
              <div>
                <div className="font-semibold text-sm text-primary">{g.title}</div>
                <div className="text-xs text-muted">{g.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <p className="text-sm text-muted mb-2">Déjà abonné ?</p>
          <button onClick={() => setPage('login')} className="text-teal font-semibold text-sm hover:underline">
            Se connecter →
          </button>
        </div>
      </div>
    </div>
  );
}
