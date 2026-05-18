import { useState, useEffect } from 'react';
import type { PageName, CvAnalysisData, VideoAnalysisData } from '../types';
import type { ProfileRow } from '../lib/candidateService';
import { fetchAllCandidates } from '../lib/candidateService';
import { fetchJobPostings } from '../lib/jobPostingService';
import type { JobPosting } from '../types';
import { Avatar } from '../components/Avatar';
import { ScoreBadge } from '../components/ScoreBadge';

interface RecruteurDashboardProps {
  setPage: (p: PageName) => void;
  userId: string;
}

interface MatchedCandidate {
  profile: ProfileRow;
  cvData: CvAnalysisData | null;
  videoData: VideoAnalysisData | null;
  globalScore: number;
  recommendation: string;
  summary: string;
  dimensions: Record<string, { score: number; comment: string }>;
  status: 'Retenu' | 'À examiner' | 'Insuffisant' | 'Non évalué';
}

const AVATAR_COLORS = ['#09C4A0','#6851C7','#D48A12','#E05A5A','#23B574','#3B82F6'];

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function scoreColor(s: number) {
  if (s >= 80) return '#09C4A0';
  if (s >= 60) return '#D48A12';
  return '#C0392B';
}

function MiniBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${value}%`, backgroundColor: scoreColor(value) }} />
      </div>
      <span className="text-xs text-muted">{value}%</span>
    </div>
  );
}

export function RecruteurDashboard({ setPage, userId }: RecruteurDashboardProps) {
  const [candidates, setCandidates]     = useState<MatchedCandidate[]>([]);
  const [jobPostings, setJobPostings]   = useState<JobPosting[]>([]);
  const [selectedJob, setSelectedJob]   = useState<string>('');
  const [loading, setLoading]           = useState(true);
  const [matching, setMatching]         = useState(false);
  const [filterStatus, setFilterStatus] = useState('Tous');
  const [sortBy, setSortBy]             = useState<'score' | 'date'>('score');
  const [expanded, setExpanded]         = useState<string | null>(null);

  // Chargement initial des fiches de poste et candidats
  useEffect(() => {
    (async () => {
      setLoading(true);
      const [jobs, profiles] = await Promise.all([
        fetchJobPostings(userId),
        fetchAllCandidates(),
      ]);
      setJobPostings(jobs);
      if (jobs.length > 0) setSelectedJob(jobs[0].id);
      // Candidats sans score (pas encore matchés)
      const base: MatchedCandidate[] = profiles.map((p, i) => ({
        profile: p,
        cvData: p.cv_text ? tryParseJSON<CvAnalysisData>(p.cv_text) : null,
        videoData: p.video_analysis ? tryParseJSON<VideoAnalysisData>(p.video_analysis) : null,
        globalScore: 0,
        recommendation: 'Non évalué',
        summary: '',
        dimensions: {},
        status: 'Non évalué',
        _colorIdx: i % AVATAR_COLORS.length,
      } as MatchedCandidate & { _colorIdx: number }));
      setCandidates(base);
      setLoading(false);
    })();
  }, [userId]);

  // Lance le matching IA pour la fiche sélectionnée
  async function runMatching() {
    if (!selectedJob) return;
    const job = jobPostings.find(j => j.id === selectedJob);
    if (!job) return;
    setMatching(true);

    const updated = await Promise.all(
      candidates.map(async (mc) => {
        if (!mc.cvData) return mc;
        try {
          const res = await fetch('/api/match-candidates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              candidate: mc.cvData,
              jobPosting: {
                title: job.title,
                description: job.description,
                expectations: job.expectations,
                teamProfile: job.teamProfile,
                managementStyle: job.managementStyle,
              },
              preferences: mc.profile.management_pref ? {
                managementPref: mc.profile.management_pref,
                environmentPref: mc.profile.environment_pref,
                collaborationPref: mc.profile.collaboration_pref,
                rhythmPref: mc.profile.rhythm_pref,
              } : undefined,
              videoAnalysis: mc.videoData ?? undefined,
            }),
          });
          if (!res.ok) return mc;
          const report = await res.json() as {
            globalScore: number;
            recommendation: string;
            summary: string;
            dimensions: Record<string, { score: number; comment: string }>;
          };
          const status: MatchedCandidate['status'] =
            report.recommendation === 'RETENIR' ? 'Retenu'
            : report.recommendation === 'À EXAMINER' ? 'À examiner'
            : 'Insuffisant';
          return { ...mc, ...report, status };
        } catch {
          return mc;
        }
      })
    );
    setCandidates(updated);
    setMatching(false);
  }

  function tryParseJSON<T>(s: string): T | null {
    try { return JSON.parse(s) as T; } catch { return null; }
  }

  const filtered = candidates
    .filter(c => filterStatus === 'Tous' || c.status === filterStatus)
    .sort((a, b) => sortBy === 'score' ? b.globalScore - a.globalScore : 0);

  const scored = candidates.filter(c => c.globalScore > 0);
  const avgScore = scored.length ? Math.round(scored.reduce((s, c) => s + c.globalScore, 0) / scored.length) : 0;

  const FILTERS = ['Tous', 'Retenu', 'À examiner', 'Insuffisant', 'Non évalué'];
  const STATUS_COLOR: Record<string, string> = {
    Retenu:      '#23B574',
    'À examiner':'#D48A12',
    Insuffisant: '#E05A5A',
    'Non évalué':'#9CA3AF',
  };

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-primary tracking-tight">Tableau de bord Recruteur</h1>
            <p className="text-muted text-sm mt-1">Profils réels — matchés par IA sur votre fiche de poste</p>
          </div>
          <button
            onClick={() => setPage('recruteur-fiche-poste')}
            className="px-5 py-2.5 rounded-btn bg-teal text-primary font-bold text-sm hover:opacity-90 transition-all"
          >
            + Nouvelle fiche de poste
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {[
            { icon: '👤', value: candidates.length, label: 'Candidats inscrits', color: '#09C4A0' },
            { icon: '🎯', value: avgScore ? `${avgScore}%` : '—', label: 'Score moyen', color: '#6851C7' },
            { icon: '✅', value: candidates.filter(c => c.status === 'Retenu').length, label: 'Retenus', color: '#23B574' },
            { icon: '📋', value: jobPostings.length, label: 'Fiches de poste', color: '#D48A12' },
          ].map(s => (
            <div key={s.label} className="bg-card rounded-card border border-border p-5">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-xl">{s.icon}</span>
                <span className="text-2xl font-extrabold" style={{ color: s.color }}>{s.value}</span>
              </div>
              <div className="text-xs text-muted font-medium">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Sélection fiche de poste + lancer matching */}
        <div className="bg-card border border-border rounded-card p-5 mb-6 flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-48">
            <label className="block text-xs font-semibold text-muted uppercase mb-2">Fiche de poste à analyser</label>
            {jobPostings.length === 0 ? (
              <p className="text-sm text-muted italic">
                Aucune fiche de poste.{' '}
                <button onClick={() => setPage('recruteur-fiche-poste')} className="text-teal underline">Créer la première →</button>
              </p>
            ) : (
              <select
                value={selectedJob}
                onChange={e => setSelectedJob(e.target.value)}
                className="w-full border border-border rounded-btn bg-bg px-3 py-2.5 text-sm text-primary focus:outline-none focus:border-teal"
              >
                {jobPostings.map(j => (
                  <option key={j.id} value={j.id}>{j.title} — {j.company || 'Mon entreprise'}</option>
                ))}
              </select>
            )}
          </div>
          <button
            onClick={runMatching}
            disabled={matching || !selectedJob || candidates.length === 0}
            className="px-6 py-2.5 rounded-btn bg-primary text-white font-bold text-sm hover:opacity-90 transition-all disabled:opacity-40 flex items-center gap-2"
          >
            {matching ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" /> Analyse en cours…</>
            ) : (
              <> Lancer le matching IA</>
            )}
          </button>
        </div>

        {loading ? (
          <div className="py-20 text-center text-muted text-sm">Chargement des candidats…</div>
        ) : candidates.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-muted text-sm mb-3">Aucun candidat n'a encore complété son profil.</p>
            <p className="text-xs text-muted">Les candidats apparaissent ici après avoir téléchargé leur CV.</p>
          </div>
        ) : (
          <>
            {/* Filtres */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex flex-wrap gap-2">
                {FILTERS.map(f => (
                  <button key={f} onClick={() => setFilterStatus(f)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      filterStatus === f ? 'bg-primary text-white border-primary' : 'border-border text-muted hover:bg-bg'
                    }`}
                  >{f}</button>
                ))}
              </div>
              <select value={sortBy} onChange={e => setSortBy(e.target.value as 'score' | 'date')}
                className="text-sm border border-border rounded-btn px-3 py-1.5 bg-card text-primary focus:outline-none focus:border-teal">
                <option value="score">Par score</option>
                <option value="date">Par date</option>
              </select>
            </div>

            {/* Liste candidats */}
            <div className="space-y-3">
              {filtered.map((mc, i) => {
                const name = mc.cvData?.fullName ?? mc.profile.full_name ?? 'Candidat anonyme';
                const role = mc.cvData?.currentRole ?? '—';
                const color = AVATAR_COLORS[i % AVATAR_COLORS.length];
                const isOpen = expanded === mc.profile.id;

                return (
                  <div key={mc.profile.id} className="bg-card border border-border rounded-card overflow-hidden">
                    {/* Ligne principale */}
                    <div
                      className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-bg transition-colors"
                      onClick={() => setExpanded(isOpen ? null : mc.profile.id)}
                    >
                      <Avatar initials={initials(name)} color={color} size={40} />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-primary text-sm truncate">{name}</div>
                        <div className="text-xs text-muted truncate">{role}</div>
                      </div>

                      {/* Score */}
                      <div className="text-center hidden sm:block">
                        {mc.globalScore > 0 ? (
                          <ScoreBadge score={mc.globalScore} />
                        ) : (
                          <span className="text-xs text-muted italic">Non évalué</span>
                        )}
                      </div>

                      {/* Statut */}
                      <div className="hidden md:block">
                        <span className="text-xs font-semibold px-3 py-1 rounded-full"
                          style={{ color: STATUS_COLOR[mc.status], background: STATUS_COLOR[mc.status] + '18' }}>
                          {mc.status}
                        </span>
                      </div>

                      {/* Compétences mini */}
                      <div className="hidden lg:block">
                        <div className="text-xs text-muted mb-1">Compétences</div>
                        <MiniBar value={mc.dimensions?.competences?.score ?? 0} />
                      </div>

                      {/* Indicateurs profil */}
                      <div className="flex gap-1.5 items-center">
                        {mc.profile.analysis_cv         && <span title="CV analysé"          className="text-xs bg-teal/10 text-teal px-1.5 py-0.5 rounded font-semibold">CV</span>}
                        {mc.profile.analysis_questionnaire && <span title="Questionnaire OK"  className="text-xs bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded font-semibold">Q</span>}
                        {mc.profile.analysis_video      && <span title="Analyse audio OK"     className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-semibold">A</span>}
                      </div>

                      <span className="text-muted text-sm ml-2">{isOpen ? '▲' : '▼'}</span>
                    </div>

                    {/* Détail déplié */}
                    {isOpen && (
                      <div className="border-t border-border px-5 py-4 bg-bg">
                        {mc.globalScore === 0 ? (
                          <p className="text-sm text-muted italic">Lance le matching IA pour voir les scores de compatibilité.</p>
                        ) : (
                          <>
                            <p className="text-sm text-primary mb-4">{mc.summary}</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {Object.entries(mc.dimensions).map(([key, dim]) => (
                                <div key={key} className="bg-card border border-border rounded-lg p-3">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-semibold text-primary capitalize">{key}</span>
                                    <span className="text-xs font-bold" style={{ color: scoreColor(dim.score) }}>{dim.score}%</span>
                                  </div>
                                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
                                    <div className="h-full rounded-full" style={{ width: `${dim.score}%`, backgroundColor: scoreColor(dim.score) }} />
                                  </div>
                                  <p className="text-xs text-muted leading-snug">{dim.comment}</p>
                                </div>
                              ))}
                            </div>

                            {/* Hard skills */}
                            {mc.cvData?.technicalSkills?.length ? (
                              <div className="mt-4">
                                <div className="text-xs font-semibold text-muted uppercase mb-2">Hard skills</div>
                                <div className="flex flex-wrap gap-1.5">
                                  {mc.cvData.technicalSkills.map(s => (
                                    <span key={s} className="text-xs bg-teal/10 text-teal px-2 py-0.5 rounded-full font-medium">{s}</span>
                                  ))}
                                </div>
                              </div>
                            ) : null}

                            {/* Soft skills */}
                            {mc.cvData?.softSkills?.length ? (
                              <div className="mt-3">
                                <div className="text-xs font-semibold text-muted uppercase mb-2">Soft skills</div>
                                <div className="flex flex-wrap gap-1.5">
                                  {mc.cvData.softSkills.map(s => (
                                    <span key={s} className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full font-medium">{s}</span>
                                  ))}
                                </div>
                              </div>
                            ) : null}

                            {/* Audio */}
                            {mc.videoData && (
                              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                <div className="text-xs font-semibold text-blue-700 mb-1">Analyse orale</div>
                                <p className="text-xs text-blue-600">{mc.videoData.analysisNotes}</p>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div className="py-12 text-center text-muted text-sm">Aucun candidat pour ce filtre.</div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
