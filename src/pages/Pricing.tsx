import type { PageName } from '../types';
import { MatchingLogo } from '../components/MatchingLogo';

interface PricingProps {
  setPage: (p: PageName) => void;
  setPlanChoice: (plan: 'recruteur' | 'candidat') => void;
}

const candidatFeatures = [
  'Profil complet sur 7 dimensions',
  'Matching avec les offres compatibles',
  'Scores de compatibilité transparents',
  'Suivi de candidatures en temps réel',
  'Messagerie avec les recruteurs',
  'Conformité RGPD totale',
];

const recruteurCarteFeatures = [
  'Analyse compatibilité d\'un candidat à la fois',
  'Radar de compatibilité 7 dimensions',
  'Compte rendu PDF téléchargeable',
  'Recommandation explicable (AI Act)',
  'Valable sans abonnement mensuel',
  'Idéal pour recrutements ponctuels',
];

const recruteurProFeatures = [
  'Analyses illimitées incluses',
  'Tableau de bord multi-candidats',
  'Filtres, tri et comparaison',
  'Historique et annotations',
  'Export CSV & PDF',
  'Support prioritaire 7j/7',
];

function FeatureItem({ text, dark = false }: { text: string; dark?: boolean }) {
  return (
    <li className="text-sm flex items-start gap-2.5">
      <span className={`flex-shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
        dark ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-600'
      }`}>
        ✓
      </span>
      <span className={dark ? 'text-white/90' : 'text-primary'}>{text}</span>
    </li>
  );
}

export function Pricing({ setPage, setPlanChoice }: PricingProps) {
  function choose(plan: 'recruteur' | 'candidat') {
    setPlanChoice(plan);
    setPage('register');
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <div className="bg-primary py-14 px-8 text-center">
        <button onClick={() => setPage('landing')} className="flex items-center gap-2 mx-auto mb-8">
          <MatchingLogo size={32} variant="white" animated={false} />
          <span className="font-extrabold text-lg text-white tracking-tight">SynchroniAI</span>
        </button>
        <span className="inline-block mb-4 px-4 py-1.5 rounded-full bg-teal/15 border border-teal/30 text-teal text-xs font-bold tracking-widest uppercase">
          TARIFS TRANSPARENTS
        </span>
        <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-3">
          Choisissez votre espace
        </h1>
        <p className="text-white/60 max-w-xl mx-auto text-sm">
          Un plan candidat gratuit, deux options recruteur. Payez ce dont vous avez besoin, pas plus.
        </p>
      </div>

      {/* Plans */}
      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">

          {/* Candidat — Gratuit */}
          <div className="bg-card rounded-card border-2 border-teal/30 p-7 flex flex-col">
            <div className="mb-5">
              <div className="w-11 h-11 rounded-xl bg-teal-light flex items-center justify-center text-xl mb-3">👤</div>
              <h2 className="text-lg font-extrabold text-primary mb-1">Espace Candidat</h2>
              <p className="text-muted text-xs">Trouvez l'entreprise qui vous ressemble.</p>
            </div>
            <div className="mb-5">
              <div className="flex items-end gap-1 mb-0.5">
                <span className="text-3xl font-extrabold text-teal">Gratuit</span>
              </div>
              <p className="text-xs text-muted">Sans carte bancaire</p>
            </div>
            <ul className="space-y-2 mb-7 flex-1">
              {candidatFeatures.map(f => (
                <FeatureItem key={f} text={f} />
              ))}
            </ul>
            <button
              onClick={() => choose('candidat')}
              className="w-full py-3 rounded-btn bg-teal text-primary font-bold text-sm hover:opacity-90 transition-all"
            >
              Commencer gratuitement →
            </button>
          </div>

          {/* Recruteur — À la carte */}
          <div className="bg-card rounded-card border-2 border-orange/40 p-7 flex flex-col relative">
            <div className="absolute top-4 right-4 bg-orange-light text-orange text-xs font-bold px-3 py-1 rounded-full border border-orange/20">
              SANS ABONNEMENT
            </div>
            <div className="mb-5">
              <div className="w-11 h-11 rounded-xl bg-orange-light flex items-center justify-center text-xl mb-3">🧩</div>
              <h2 className="text-lg font-extrabold text-primary mb-1">Recruteur à la carte</h2>
              <p className="text-muted text-xs">Payez uniquement ce que vous utilisez.</p>
            </div>
            <div className="mb-5">
              <div className="flex items-end gap-1 mb-0.5">
                <span className="text-3xl font-extrabold text-orange">4,99€</span>
                <span className="text-muted text-sm mb-1">/analyse</span>
              </div>
              <p className="text-xs text-muted">Aucun engagement · Crédit rechargeable</p>
            </div>
            <ul className="space-y-2 mb-7 flex-1">
              {recruteurCarteFeatures.map(f => (
                <FeatureItem key={f} text={f} />
              ))}
            </ul>
            <button
              onClick={() => choose('recruteur')}
              className="w-full py-3 rounded-btn bg-orange text-white font-bold text-sm hover:opacity-90 transition-all"
            >
              Démarrer à la carte →
            </button>
          </div>

          {/* Recruteur — Pro */}
          <div className="bg-primary rounded-card p-7 flex flex-col relative overflow-hidden">
            <div className="absolute top-4 right-4 bg-teal text-primary text-xs font-bold px-3 py-1 rounded-full">
              POPULAIRE
            </div>
            <div className="mb-5">
              <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center text-xl mb-3">🏢</div>
              <h2 className="text-lg font-extrabold text-white mb-1">Recruteur Pro</h2>
              <p className="text-white/50 text-xs">Pour les équipes RH actives.</p>
            </div>
            <div className="mb-5">
              <div className="flex items-end gap-1 mb-0.5">
                <span className="text-3xl font-extrabold text-teal">49€</span>
                <span className="text-white/50 text-sm mb-1">/mois</span>
              </div>
              <p className="text-xs text-white/40">14 jours d'essai gratuit · Sans engagement</p>
            </div>
            <ul className="space-y-2 mb-7 flex-1">
              {recruteurProFeatures.map(f => (
                <FeatureItem key={f} text={f} dark />
              ))}
            </ul>
            <button
              onClick={() => choose('recruteur')}
              className="w-full py-3 rounded-btn bg-teal text-primary font-bold text-sm hover:opacity-90 transition-all"
            >
              Démarrer l'essai gratuit →
            </button>
          </div>
        </div>

        {/* Comparaison à la carte vs Pro */}
        <div className="bg-card rounded-card border border-border p-6 mb-10">
          <h3 className="font-bold text-primary text-sm mb-3 text-center">À la carte vs Pro — Quand choisir quoi ?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-orange-light rounded-xl p-4 border border-orange/15">
              <p className="font-semibold text-orange text-sm mb-2">🧩 À la carte à 4,99€/analyse</p>
              <ul className="text-xs text-primary space-y-1">
                <li>→ Recrutement ponctuel (1 à 5 postes/an)</li>
                <li>→ Tester SynchroniAI sans engagement</li>
                <li>→ Petite structure ou TPE</li>
              </ul>
            </div>
            <div className="bg-teal-light rounded-xl p-4 border border-teal/15">
              <p className="font-semibold text-teal text-sm mb-2">🏢 Pro à 49€/mois</p>
              <ul className="text-xs text-primary space-y-1">
                <li>→ Volume &gt; 10 analyses/mois</li>
                <li>→ Tableau de bord multi-candidats</li>
                <li>→ Équipe RH avec besoins réguliers</li>
              </ul>
            </div>
          </div>
          <p className="text-center text-xs text-muted mt-3">
            Point d'équilibre : <strong>10 analyses/mois</strong> = 49,90€ à la carte vs 49€ Pro
          </p>
        </div>

        {/* Garanties */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {[
            { icon: '🔒', title: 'RGPD & AI Act', desc: 'Conformité totale, audit trail inclus' },
            { icon: '💳', title: 'Sans engagement', desc: 'Annulez ou rechargez à tout moment' },
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

        <div className="text-center mb-10">
          <p className="text-sm text-muted mb-2">Déjà abonné ?</p>
          <button onClick={() => setPage('login')} className="text-teal font-semibold text-sm hover:underline">
            Se connecter →
          </button>
        </div>

        {/* Support — réel */}
        <div className="bg-primary rounded-card p-6 text-center">
          <div className="text-3xl mb-2">💬</div>
          <h3 className="text-white font-bold text-lg mb-1">Support prioritaire 7j/7</h3>
          <p className="text-white/60 text-sm mb-3">
            Une question, un blocage, un retour ? L'équipe SynchroniAI répond sous 24h.
          </p>
          <a
            href="mailto:renatoprojetrecrutement@gmail.com?subject=Support%20SynchroniAI"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-btn bg-blue-500 text-white font-bold text-sm hover:bg-blue-600 transition-all"
          >
            ✉ renatoprojetrecrutement@gmail.com
          </a>
        </div>
      </div>
    </div>
  );
}
