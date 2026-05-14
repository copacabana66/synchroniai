import { offers } from '../data/offers';
import type { PageName, AnalysisStatus } from '../types';
import { ScoreBadge } from '../components/ScoreBadge';
import { StatusBadge } from '../components/StatusBadge';

interface CandidatDashboardProps {
  setPage: (p: PageName) => void;
  analysisComplete: boolean;
  analysis: AnalysisStatus;
}

const completionItems = [
  { key: 'cv',            label: 'CV importé' },
  { key: 'questionnaire', label: 'Questionnaire' },
  { key: 'video',         label: 'Vidéo' },
  { key: 'preferences',   label: 'Préférences' },
  { key: 'validation',    label: 'Validation IA' },
];

const myApplications = [
  {
    id: 1,
    company: 'InnovateSud',
    role: 'Lead Developer Backend',
    date: '14 mai 2026',
    score: 87,
    status: 'En cours',
    statusColor: '#D48A12',
    statusBg: '#FEF5E0',
    logoInitials: 'IS',
    accentColor: '#6851C7',
  },
  {
    id: 2,
    company: 'TechCorp SAS',
    role: 'Dev Full-Stack React/Node',
    date: '12 mai 2026',
    score: 94,
    status: 'Nouveau',
    statusColor: '#09C4A0',
    statusBg: '#F0F8F5',
    logoInitials: 'TC',
    accentColor: '#09C4A0',
  },
];

function AnalysisStepIcon({ done, active }: { done: boolean; active: boolean }) {
  if (done) return <span className="text-teal font-bold">✓</span>;
  if (active) return <span className="text-orange animate-pulse-soft">●</span>;
  return <span className="text-muted/40">○</span>;
}

export function CandidatDashboard({ setPage, analysisComplete, analysis }: CandidatDashboardProps) {
  const doneCount = [analysis.cv, analysis.questionnaire, analysis.video].filter(Boolean).length;
  const completionPct = analysisComplete ? 100 : Math.round((doneCount / 3) * 80);

  const stepsDone: Record<string, boolean> = {
    cv:            analysis.cv,
    questionnaire: analysis.questionnaire,
    video:         analysis.video,
    preferences:   false,
    validation:    analysisComplete,
  };

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <button
          onClick={() => setPage('landing')}
          className="mb-6 flex items-center gap-2 text-muted border border-border rounded-btn px-4 py-2 text-sm hover:bg-bg transition-all"
        >
          ← Retour à l'accueil
        </button>

        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-primary tracking-tight">Mon espace candidat</h1>
          <p className="text-muted text-sm mt-1">
            {analysisComplete
              ? 'Voici vos offres compatibles et l\'état de vos candidatures.'
              : 'Complétez votre analyse pour débloquer vos offres compatibles.'}
          </p>
        </div>

        {/* Profile completion */}
        <div className="bg-card rounded-card border border-border p-6 mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-primary">Analyse de compatibilité</h2>
            <span className="text-2xl font-extrabold text-teal">{completionPct}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${completionPct}%`,
                background: analysisComplete
                  ? 'linear-gradient(90deg, #09C4A0, #23B574)'
                  : 'linear-gradient(90deg, #09C4A0, #F06A28)',
              }}
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
            {completionItems.map(item => {
              const done = stepsDone[item.key];
              const isNext = !done && completionItems.findIndex(i => !stepsDone[i.key]) === completionItems.indexOf(item);
              return (
                <div
                  key={item.key}
                  className={`text-center py-2 px-3 rounded-lg text-xs font-medium ${
                    done
                      ? 'bg-teal-light text-teal border border-teal/20'
                      : isNext
                      ? 'bg-orange-light text-orange border border-orange/20'
                      : 'bg-bg text-muted border border-border'
                  }`}
                >
                  <AnalysisStepIcon done={done} active={isNext} />
                  <span className="ml-1">{item.label}</span>
                </div>
              );
            })}
          </div>

          {!analysisComplete ? (
            <div className="flex flex-wrap gap-3 items-center">
              <button
                onClick={() => setPage('candidat-profil')}
                className="px-5 py-2.5 rounded-btn bg-primary text-white font-bold text-sm hover:opacity-90 transition-all"
              >
                {doneCount === 0 ? 'Démarrer mon analyse →' : 'Continuer mon analyse →'}
              </button>
              <p className="text-xs text-muted">
                {3 - doneCount} étape{3 - doneCount > 1 ? 's' : ''} restante{3 - doneCount > 1 ? 's' : ''} pour débloquer vos offres
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-success text-sm font-semibold">✓ Analyse complète — offres débloquées</span>
            </div>
          )}
        </div>

        {/* Offers — locked or unlocked */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-primary">Offres compatibles</h2>
            {analysisComplete && (
              <span className="text-xs text-teal font-semibold bg-teal-light px-3 py-1 rounded-full">
                {offers.length} offres trouvées
              </span>
            )}
          </div>

          {!analysisComplete ? (
            /* LOCKED STATE */
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  className="bg-card rounded-card border border-border border-l-4 border-l-gray-200 p-5 relative overflow-hidden"
                >
                  {/* Blurred mock content */}
                  <div className="filter blur-sm opacity-40 pointer-events-none select-none">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gray-100" />
                      <div>
                        <div className="h-4 w-48 bg-gray-200 rounded mb-2" />
                        <div className="h-3 w-32 bg-gray-100 rounded" />
                      </div>
                      <div className="ml-auto h-6 w-12 bg-gray-200 rounded-full" />
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <div className="h-3 w-full bg-gray-100 rounded" />
                      <div className="h-3 w-full bg-gray-100 rounded" />
                    </div>
                  </div>
                  {/* Lock overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2.5 flex items-center gap-2 border border-border shadow-sm">
                      <span className="text-lg">🔒</span>
                      <span className="text-sm font-semibold text-primary">
                        {i === 1 ? 'Complétez votre analyse pour débloquer' : 'Offre masquée'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* CTA under locked offers */}
              <div className="bg-primary rounded-card p-6 text-center">
                <p className="text-white font-bold text-base mb-1">
                  🎯 {offers.length} offres compatibles vous attendent
                </p>
                <p className="text-white/60 text-sm mb-4">
                  Finalisez votre analyse pour voir quelles entreprises correspondent à votre profil.
                </p>
                <button
                  onClick={() => setPage('candidat-profil')}
                  className="px-6 py-3 rounded-btn bg-teal text-primary font-bold text-sm hover:opacity-90 transition-all"
                >
                  Compléter mon analyse →
                </button>
              </div>
            </div>
          ) : (
            /* UNLOCKED — real offers */
            <div className="space-y-4">
              {offers.map(o => (
                <div
                  key={o.id}
                  className="bg-card rounded-card border border-border border-l-4 p-5"
                  style={{ borderLeftColor: o.accentColor }}
                >
                  <div className="flex flex-wrap items-start gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
                      style={{ background: o.accentColor + '26', color: o.accentColor }}
                    >
                      {o.logoInitials}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-bold text-primary">{o.role}</h3>
                        <ScoreBadge score={o.score} />
                        <StatusBadge status={o.status} color={o.accentColor} bg={o.accentColor + '26'} />
                      </div>
                      <p className="text-sm text-muted mb-3">{o.company} · {o.location}</p>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-1 mb-3">
                        <div className="text-xs text-muted"><span className="font-medium text-primary">Management:</span> {o.management}</div>
                        <div className="text-xs text-muted"><span className="font-medium text-primary">Équipe:</span> {o.team}</div>
                        <div className="text-xs text-muted"><span className="font-medium text-primary">Contrat:</span> {o.contract}</div>
                        <div className="text-xs text-muted"><span className="font-medium text-primary">Salaire:</span> {o.salary}</div>
                      </div>
                    </div>
                  </div>
                  {o.status === 'En cours' && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <button
                        onClick={() => setPage('candidat-avancement')}
                        className="px-5 py-2 rounded-btn text-sm font-bold hover:opacity-90 transition-all"
                        style={{ background: o.accentColor + '26', color: o.accentColor }}
                      >
                        Voir mon avancement →
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My applications — only visible if analysis complete */}
        {analysisComplete && (
          <div>
            <h2 className="text-lg font-bold text-primary mb-4">Mes candidatures</h2>
            <div className="bg-card rounded-card border border-border overflow-hidden">
              {myApplications.map((app, i) => (
                <div
                  key={app.id}
                  className={`flex flex-wrap items-center gap-3 p-4 ${i < myApplications.length - 1 ? 'border-b border-border' : ''}`}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: app.accentColor + '26', color: app.accentColor }}
                  >
                    {app.logoInitials}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-primary text-sm">{app.role}</div>
                    <div className="text-xs text-muted">{app.company} · {app.date}</div>
                  </div>
                  <ScoreBadge score={app.score} />
                  <StatusBadge status={app.status} color={app.statusColor} bg={app.statusBg} />
                  <button
                    onClick={() => setPage('candidat-avancement')}
                    className="text-xs font-semibold text-teal hover:underline"
                  >
                    Voir →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
