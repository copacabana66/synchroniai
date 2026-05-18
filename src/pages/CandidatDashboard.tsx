import { useEffect, useState } from 'react';
import type { PageName, AnalysisStatus, JobPosting } from '../types';
import { ScoreBadge } from '../components/ScoreBadge';
import { fetchJobPostings } from '../lib/jobPostingService';
import { getProfile } from '../lib/candidateService';

interface CandidatDashboardProps {
  setPage: (p: PageName) => void;
  analysisComplete: boolean;
  analysis: AnalysisStatus;
  userId: string;
}

interface MatchedOffer extends JobPosting {
  globalScore: number;
  recommendation: string;
  summary: string;
  dimensions: Record<string, { score: number; comment: string }>;
}

const COMPLETION_ITEMS = [
  { key: 'cv',            label: 'CV importé' },
  { key: 'questionnaire', label: 'Questionnaire' },
  { key: 'video',         label: 'Vidéo' },
  { key: 'assessment',    label: 'Test cognitif' },
  { key: 'validation',    label: 'Validation matching' },
];

function scoreColor(s: number) {
  if (s >= 80) return '#09C4A0';
  if (s >= 60) return '#D48A12';
  return '#C0392B';
}

function offerInitials(title: string, company: string) {
  const src = (company || title).trim();
  return src.split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2) || '??';
}

const ACCENT_COLORS = ['#09C4A0', '#6851C7', '#D48A12', '#23B574', '#3B82F6', '#E05A5A'];

export function CandidatDashboard({ setPage, analysisComplete, analysis, userId }: CandidatDashboardProps) {
  const [offers, setOffers]               = useState<MatchedOffer[]>([]);
  const [loading, setLoading]             = useState(false);
  const [matching, setMatching]           = useState(false);
  const [expanded, setExpanded]           = useState<string | null>(null);
  const [hasAssessment, setHasAssessment] = useState<boolean>(!!analysis.assessment);

  const doneCount = [analysis.cv, analysis.questionnaire, analysis.video, hasAssessment].filter(Boolean).length;
  const fullyComplete = analysisComplete && hasAssessment;
  const completionPct = fullyComplete ? 100 : Math.round((doneCount / 4) * 80);

  const stepsDone: Record<string, boolean> = {
    cv:            analysis.cv,
    questionnaire: analysis.questionnaire,
    video:         analysis.video,
    assessment:    hasAssessment,
    validation:    fullyComplete,
  };

  // Charge le profil + détecte si l'assessment est déjà fait
  useEffect(() => {
    if (!userId) return;
    (async () => {
      const profile = await getProfile(userId);
      if (profile?.analysis_assessment) setHasAssessment(true);
    })();
  }, [userId]);

  // Charge les offres publiées dès que le CV est analysé
  useEffect(() => {
    if (!userId || !analysis.cvData) return;
    setLoading(true);
    fetchJobPostings().then(jobs => {
      const published = jobs.filter(j => j.status === 'published' || j.status === 'draft');
      // On affiche tout pour l'instant — en prod on filtrerait sur 'published'
      setOffers(published.map(j => ({
        ...j,
        globalScore: 0,
        recommendation: 'Non évalué',
        summary: '',
        dimensions: {},
      })));
      setLoading(false);
    });
  }, [userId, analysis.cvData]);

  // Lance le matching pour toutes les offres
  async function runMatching() {
    if (!analysis.cvData || offers.length === 0) return;
    setMatching(true);

    const matched = await Promise.all(
      offers.map(async (offer) => {
        try {
          const res = await fetch('/api/match-candidates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              candidate: analysis.cvData,
              jobPosting: {
                title:        offer.title,
                description:  offer.description,
                expectations: offer.expectations,
                teamProfile:  offer.teamProfile,
                managementStyle: offer.managementStyle,
              },
              preferences: analysis.questionnaireData,
              videoAnalysis: analysis.videoData,
              assessment: analysis.assessmentData,
            }),
          });
          if (!res.ok) return offer;
          const r = await res.json() as {
            globalScore: number;
            recommendation: string;
            summary: string;
            dimensions: Record<string, { score: number; comment: string }>;
          };
          return { ...offer, ...r };
        } catch {
          return offer;
        }
      })
    );
    // Tri descendant par score
    matched.sort((a, b) => b.globalScore - a.globalScore);
    setOffers(matched);
    setMatching(false);
  }

  const scoredOffers = offers.filter(o => o.globalScore > 0);

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
            {fullyComplete
              ? "Vos offres réelles, classées par compatibilité IA."
              : 'Complétez votre profil pour débloquer le matching sur les vraies offres.'}
          </p>
        </div>

        {/* Profile completion */}
        <div className="bg-card rounded-card border border-border p-6 mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-primary">Profil candidat</h2>
            <span className="text-2xl font-extrabold text-teal">{completionPct}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${completionPct}%`,
                background: fullyComplete
                  ? 'linear-gradient(90deg, #09C4A0, #23B574)'
                  : 'linear-gradient(90deg, #09C4A0, #F06A28)',
              }}
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
            {COMPLETION_ITEMS.map(item => {
              const done = stepsDone[item.key];
              return (
                <div
                  key={item.key}
                  className={`text-center py-2 px-3 rounded-lg text-xs font-medium border ${
                    done ? 'bg-teal-light text-teal border-teal/20'
                         : 'bg-bg text-muted border-border'
                  }`}
                >
                  {done ? '✓' : '○'} {item.label}
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-2">
            {!analysisComplete && (
              <button
                onClick={() => setPage('candidat-profil')}
                className="px-5 py-2.5 rounded-btn bg-primary text-white font-bold text-sm hover:opacity-90"
              >
                {doneCount === 0 ? 'Démarrer mon analyse →' : 'Continuer mon analyse →'}
              </button>
            )}
            {analysisComplete && !hasAssessment && (
              <button
                onClick={() => setPage('candidat-test')}
                className="px-5 py-2.5 rounded-btn bg-purple-600 text-white font-bold text-sm hover:opacity-90"
              >
                🧠 Passer le test cognitif & personnalité
              </button>
            )}
            {fullyComplete && (
              <button
                onClick={() => setPage('candidat-test')}
                className="px-5 py-2.5 rounded-btn border border-border text-sm font-semibold hover:bg-bg"
              >
                Revoir mon profil comportemental
              </button>
            )}
          </div>
        </div>

        {/* Offers — locked until CV is done */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <h2 className="text-lg font-bold text-primary">Offres réelles</h2>
            {analysis.cvData && offers.length > 0 && (
              <button
                onClick={runMatching}
                disabled={matching}
                className="px-4 py-2 rounded-btn bg-teal text-primary font-bold text-sm hover:opacity-90 disabled:opacity-40 flex items-center gap-2"
              >
                {matching ? (
                  <><span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin inline-block" /> Matching…</>
                ) : scoredOffers.length > 0 ? '🔄 Relancer le matching' : '🎯 Lancer le matching'}
              </button>
            )}
          </div>

          {!analysis.cvData ? (
            <div className="bg-primary rounded-card p-6 text-center">
              <p className="text-white font-bold text-base mb-1">
                🔒 Téléchargez votre CV pour débloquer les offres
              </p>
              <p className="text-white/60 text-sm mb-4">
                Le matching compare votre CV aux offres réelles publiées par les recruteurs.
              </p>
              <button
                onClick={() => setPage('candidat-profil')}
                className="px-6 py-3 rounded-btn bg-teal text-primary font-bold text-sm hover:opacity-90"
              >
                Importer mon CV →
              </button>
            </div>
          ) : loading ? (
            <div className="py-12 text-center text-muted text-sm">Chargement des offres réelles…</div>
          ) : offers.length === 0 ? (
            <div className="bg-card rounded-card border border-border p-8 text-center">
              <p className="text-muted text-sm">Aucune offre disponible pour le moment.</p>
              <p className="text-xs text-muted mt-2">Les recruteurs publient leurs fiches de poste en continu — revenez bientôt.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {offers.map((o, i) => {
                const accent = ACCENT_COLORS[i % ACCENT_COLORS.length];
                const isOpen = expanded === o.id;
                return (
                  <div key={o.id} className="bg-card rounded-card border border-border overflow-hidden">
                    <div
                      className="flex items-center gap-4 p-5 cursor-pointer hover:bg-bg transition-colors border-l-4"
                      style={{ borderLeftColor: accent }}
                      onClick={() => setExpanded(isOpen ? null : o.id)}
                    >
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
                        style={{ background: accent + '26', color: accent }}
                      >
                        {offerInitials(o.title, o.company)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-primary truncate">{o.title}</h3>
                        <p className="text-xs text-muted truncate">
                          {o.company || 'Entreprise'} {o.location && `· ${o.location}`}
                        </p>
                      </div>
                      <div className="text-right">
                        {o.globalScore > 0 ? (
                          <ScoreBadge score={o.globalScore} />
                        ) : (
                          <span className="text-xs text-muted italic">À matcher</span>
                        )}
                      </div>
                      <span className="text-muted text-sm">{isOpen ? '▲' : '▼'}</span>
                    </div>

                    {isOpen && (
                      <div className="border-t border-border px-5 py-4 bg-bg">
                        {o.globalScore === 0 ? (
                          <p className="text-sm text-muted italic">
                            Lancez le matching pour voir votre score de compatibilité sur cette offre.
                          </p>
                        ) : (
                          <>
                            {/* Vue candidat : score global + résumé seulement (pas le détail recruteur) */}
                            <div className="flex items-center gap-4 mb-4 p-4 bg-gradient-to-br from-teal-light to-bg rounded-card border border-teal/15">
                              <div className="text-center">
                                <div className="text-4xl font-extrabold" style={{ color: scoreColor(o.globalScore) }}>{o.globalScore}%</div>
                                <div className="text-xs text-muted font-semibold uppercase tracking-wider">Compatibilité</div>
                              </div>
                              <div className="flex-1">
                                <p className="text-sm text-primary leading-snug">{o.summary}</p>
                              </div>
                            </div>

                            {/* Top 3 dimensions sans commentaire détaillé */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                              {Object.entries(o.dimensions)
                                .sort(([, a], [, b]) => b.score - a.score)
                                .slice(0, 3)
                                .map(([key, dim]) => (
                                  <div key={key} className="bg-card border border-border rounded-card p-3">
                                    <div className="flex justify-between items-center mb-1.5">
                                      <span className="text-xs font-semibold text-primary capitalize">{key}</span>
                                      <span className="text-xs font-bold" style={{ color: scoreColor(dim.score) }}>{dim.score}%</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-bg rounded-full overflow-hidden">
                                      <div className="h-full rounded-full transition-all" style={{ width: `${dim.score}%`, backgroundColor: scoreColor(dim.score) }} />
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </>
                        )}

                        {/* Détails offre publique uniquement */}
                        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs pt-3 border-t border-border">
                          {o.contractType && <div><span className="font-semibold text-primary">Contrat :</span> <span className="text-muted">{o.contractType}</span></div>}
                          {(o.salaryMin || o.salaryMax) && <div><span className="font-semibold text-primary">Salaire :</span> <span className="text-muted">{o.salaryMin}{o.salaryMax ? ' – ' + o.salaryMax : ''} €</span></div>}
                          {o.managementStyle && <div><span className="font-semibold text-primary">Management :</span> <span className="text-muted capitalize">{o.managementStyle}</span></div>}
                          {o.description && <div className="col-span-2 mt-2"><span className="font-semibold text-primary">Description :</span> <span className="text-muted">{o.description.slice(0, 280)}{o.description.length > 280 ? '…' : ''}</span></div>}
                        </div>

                        {o.globalScore >= 70 && (
                          <button
                            onClick={(e) => { e.stopPropagation(); /* TODO: postuler */ }}
                            className="btn-primary w-full mt-4"
                          >
                            Postuler à cette offre →
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
