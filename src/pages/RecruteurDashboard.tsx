import { useState, useEffect } from 'react';
import type { PageName, CvAnalysisData, VideoAnalysisData } from '../types';
import type { ProfileRow } from '../lib/candidateService';
import { fetchAllCandidates } from '../lib/candidateService';
import { fetchJobPostings } from '../lib/jobPostingService';
import type { JobPosting } from '../types';
import { Avatar } from '../components/Avatar';
import { ScoreBadge } from '../components/ScoreBadge';
import { fetchNotes, upsertNote, type RecruiterNote } from '../lib/notesService';
import { arrayToCSV, downloadFile, printPdf } from '../lib/exportHelpers';
import {
  fetchRecruiterApplications, updateApplicationStatus,
  STATUS_LABEL, STATUS_COLOR,
  type Application, type ApplicationStatus,
} from '../lib/applicationsService';

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
  const [notes, setNotes]               = useState<Record<string, RecruiterNote>>({});
  const [minScore, setMinScore]         = useState(60);   // seuil de compatibilité affiché
  const [hasMatched, setHasMatched]     = useState(false); // matching déjà lancé au moins une fois ?
  const [applications, setApplications] = useState<Application[]>([]);

  // Chargement initial des fiches de poste, candidats, notes et candidatures
  useEffect(() => {
    (async () => {
      setLoading(true);
      const [jobs, profiles, notesMap, apps] = await Promise.all([
        fetchJobPostings(userId),
        fetchAllCandidates(),
        fetchNotes(userId),
        fetchRecruiterApplications(userId),
      ]);
      setJobPostings(jobs);
      setNotes(notesMap);
      setApplications(apps);
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

  // Lance le matching pour la fiche sélectionnée
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
    setHasMatched(true);
    setMatching(false);
  }

  function tryParseJSON<T>(s: string): T | null {
    try { return JSON.parse(s) as T; } catch { return null; }
  }

  // ── Export CSV des candidats ────────────────────────────────────────────
  function exportCSV() {
    const job = jobPostings.find(j => j.id === selectedJob);
    const headers = ['Nom', 'Poste actuel', 'Score', 'Recommandation', 'Statut', 'Compétences techniques', 'Soft skills', 'Note recruteur', 'Date export'];
    const rows: (string | number)[][] = [headers];
    for (const c of candidates) {
      rows.push([
        c.cvData?.fullName ?? '—',
        c.cvData?.currentRole ?? '—',
        c.globalScore || 0,
        c.recommendation,
        c.status,
        (c.cvData?.technicalSkills ?? []).join('; '),
        (c.cvData?.softSkills ?? []).join('; '),
        notes[c.profile.id]?.note ?? '',
        new Date().toLocaleString('fr-FR'),
      ]);
    }
    const filename = `synchroniai-candidats${job ? '-' + job.title.replace(/[^a-z0-9]/gi, '-').toLowerCase() : ''}-${new Date().toISOString().slice(0, 10)}.csv`;
    downloadFile(arrayToCSV(rows), filename, 'text/csv');
  }

  // ── Export PDF du compte rendu d'un candidat ────────────────────────────
  function exportCandidatePdf(mc: MatchedCandidate) {
    const job  = jobPostings.find(j => j.id === selectedJob);
    const name = mc.cvData?.fullName ?? mc.profile.full_name ?? 'Candidat';
    const note = notes[mc.profile.id]?.note ?? '';
    const status = notes[mc.profile.id]?.status ?? mc.status;

    const dimsHtml = Object.entries(mc.dimensions)
      .map(([key, d]) => `<div class="dim"><span style="text-transform:capitalize">${key}</span><span class="dim-val" style="color:${d.score >= 80 ? '#14B8A6' : d.score >= 60 ? '#F59E0B' : '#E11D48'}">${d.score}%</span></div>`)
      .join('');

    const skillsHtml = (mc.cvData?.technicalSkills ?? []).map(s => `<span class="pill pill-teal" style="margin-right:4px">${s}</span>`).join(' ');
    const softHtml   = (mc.cvData?.softSkills ?? []).map(s => `<span class="pill pill-coral" style="margin-right:4px">${s}</span>`).join(' ');

    const html = `
      <h1>${name}</h1>
      <p style="color:#64748B;font-size:13px;margin:0 0 4px">${mc.cvData?.currentRole ?? ''}</p>
      ${job ? `<p style="color:#64748B;font-size:12px;margin:0">Évalué pour : <strong>${job.title}</strong></p>` : ''}

      <div class="score-block">
        <div class="score-big">${mc.globalScore || '—'}${mc.globalScore ? '%' : ''}</div>
        <div>
          <span class="pill ${mc.recommendation === 'RETENIR' ? 'pill-teal' : mc.recommendation === 'À EXAMINER' ? 'pill-coral' : 'pill-gray'}">${mc.recommendation}</span>
          <p style="margin:6px 0 0;font-size:13px">${mc.summary || 'Aucune synthèse disponible.'}</p>
        </div>
      </div>

      <h2>Dimensions évaluées</h2>
      ${dimsHtml || '<p style="color:#94A3B8">Lancez le matching pour générer ces scores.</p>'}

      ${skillsHtml ? `<h2>Compétences techniques</h2><div>${skillsHtml}</div>` : ''}
      ${softHtml   ? `<h2>Soft skills</h2><div>${softHtml}</div>` : ''}

      <h2>Annotation recruteur</h2>
      <p><strong>Statut :</strong> ${status}</p>
      ${note ? `<p style="background:#F8FAFC;padding:12px;border-radius:8px;border-left:3px solid #14B8A6">${note.replace(/\n/g, '<br>')}</p>` : '<p style="color:#94A3B8">Aucune note ajoutée.</p>'}
    `;
    printPdf(html, `Compte rendu — ${name}`);
  }

  // ── Mise à jour statut candidature ──────────────────────────────────────
  async function changeApplicationStatus(appId: string, status: ApplicationStatus) {
    setApplications(prev => prev.map(a => a.id === appId ? { ...a, status } : a));
    await updateApplicationStatus(appId, status);
  }

  // ── Sauvegarde annotation ───────────────────────────────────────────────
  function updateNote(candidateId: string, patch: Partial<RecruiterNote>) {
    setNotes(n => ({
      ...n,
      [candidateId]: {
        recruiter_id: userId,
        candidate_id: candidateId,
        note: n[candidateId]?.note ?? null,
        status: n[candidateId]?.status ?? null,
        ...patch,
      },
    }));
    // Persist en Supabase (fire-and-forget, debounce léger)
    upsertNote(userId, candidateId, patch);
  }

  // Seul un candidat MATCHÉ ET au-dessus du seuil est visible — RGPD/UX : need-to-know
  const compatible = candidates.filter(c => c.globalScore >= minScore);
  const filtered = compatible
    .filter(c => filterStatus === 'Tous' || c.status === filterStatus)
    .sort((a, b) => sortBy === 'score' ? b.globalScore - a.globalScore : 0);

  const scored = candidates.filter(c => c.globalScore > 0);
  const avgScore = compatible.length ? Math.round(compatible.reduce((s, c) => s + c.globalScore, 0) / compatible.length) : 0;

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
            <p className="text-muted text-sm mt-1">Profils réels — matchés sur votre fiche de poste</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={exportCSV}
              disabled={candidates.length === 0}
              className="px-4 py-2.5 rounded-btn border border-border bg-white text-primary font-semibold text-sm hover:bg-bg disabled:opacity-40 transition-all"
              title="Exporter la liste des candidats en CSV (Excel)"
            >
              ⤓ Export CSV
            </button>
            <button
              onClick={() => setPage('recruteur-team')}
              className="px-5 py-2.5 rounded-btn bg-violet text-white font-bold text-sm hover:opacity-90 transition-all"
            >
              🧬 ADN de mon équipe
            </button>
            <button
              onClick={() => setPage('recruteur-fiche-poste')}
              className="px-5 py-2.5 rounded-btn bg-teal text-white font-bold text-sm hover:opacity-90 transition-all"
            >
              + Nouvelle fiche de poste
            </button>
          </div>
        </div>

        {/* Stats — basées sur les profils RÉELLEMENT compatibles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {[
            { icon: '🎯', value: hasMatched ? compatible.length : '—', label: `Profils compatibles (≥${minScore}%)`, color: '#14B8A6' },
            { icon: '📊', value: avgScore ? `${avgScore}%` : '—', label: 'Score moyen', color: '#8B5CF6' },
            { icon: '✅', value: compatible.filter(c => c.status === 'Retenu').length, label: 'Profils retenus', color: '#23B574' },
            { icon: '📋', value: jobPostings.length, label: 'Fiches de poste', color: '#F59E0B' },
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

        {/* ── Candidatures reçues — visibles UNIQUEMENT si au moins une existe ── */}
        {applications.length > 0 && (
          <div className="bg-card border border-border rounded-card p-5 mb-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h2 className="text-base font-bold text-primary flex items-center gap-2">
                📬 Candidatures reçues
                <span className="text-xs font-semibold px-2 py-0.5 rounded-pill bg-blue-100 text-blue-700">
                  {applications.length}
                </span>
              </h2>
              <span className="text-xs text-muted">
                {applications.filter(a => a.status === 'pending').length} non lue{applications.filter(a => a.status === 'pending').length > 1 ? 's' : ''}
              </span>
            </div>

            <div className="space-y-2">
              {applications.slice(0, 8).map(app => {
                const job  = jobPostings.find(j => j.id === app.job_posting_id);
                const cand = candidates.find(c => c.profile.id === app.candidate_id);
                const candName = cand?.cvData?.fullName ?? cand?.profile.full_name ?? 'Candidat anonyme';
                const colors = STATUS_COLOR[app.status];

                return (
                  <div key={app.id} className="flex flex-wrap items-center gap-3 p-3 border border-border rounded-card hover:bg-bg transition-colors">
                    <Avatar initials={initials(candName)} color="#14B8A6" size={36} />

                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-primary text-sm truncate">{candName}</div>
                      <div className="text-xs text-muted truncate">
                        Pour <strong>{job?.title ?? 'Offre supprimée'}</strong>
                        {app.match_score != null && (
                          <span className="ml-2">· Score au dépôt : <strong>{app.match_score}%</strong></span>
                        )}
                      </div>
                      {app.candidate_message && (
                        <div className="mt-1 text-xs text-primary bg-bg p-2 rounded border-l-2 border-teal italic line-clamp-2">
                          « {app.candidate_message} »
                        </div>
                      )}
                    </div>

                    <span
                      className="text-xs font-semibold px-3 py-1 rounded-pill flex-shrink-0"
                      style={{ background: colors.bg, color: colors.fg }}
                    >
                      {STATUS_LABEL[app.status]}
                    </span>

                    <select
                      value={app.status}
                      onChange={(e) => changeApplicationStatus(app.id, e.target.value as ApplicationStatus)}
                      className="text-xs border border-border rounded-btn px-2 py-1.5 bg-white text-primary focus:outline-none focus:border-teal cursor-pointer"
                      title="Changer le statut"
                    >
                      <option value="pending">En attente</option>
                      <option value="reviewed">Vue</option>
                      <option value="interview">Entretien</option>
                      <option value="accepted">Acceptée</option>
                      <option value="rejected">Refusée</option>
                    </select>

                    <span className="text-[10px] text-muted whitespace-nowrap">
                      {new Date(app.applied_at!).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                );
              })}
              {applications.length > 8 && (
                <p className="text-xs text-muted text-center pt-2">
                  + {applications.length - 8} autre{applications.length - 8 > 1 ? 's' : ''} candidature{applications.length - 8 > 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Sélection fiche de poste + lancer matching + seuil */}
        <div className="bg-card border border-border rounded-card p-5 mb-6">
          <div className="flex flex-wrap gap-4 items-end mb-4">
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
              ) : hasMatched ? (
                <>🔄 Relancer le matching</>
              ) : (
                <>🎯 Lancer le matching</>
              )}
            </button>
          </div>

          {/* Seuil de compatibilité — visible uniquement après un premier matching */}
          {hasMatched && (
            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between gap-3 mb-2">
                <label className="text-xs font-semibold text-muted uppercase">Seuil de compatibilité affiché</label>
                <span className="text-sm font-bold text-teal">≥ {minScore}%</span>
              </div>
              <input
                type="range" min={40} max={90} step={5}
                value={minScore}
                onChange={e => setMinScore(Number(e.target.value))}
                className="w-full accent-teal"
              />
              <div className="flex justify-between text-[10px] text-muted mt-1">
                <span>Large (40%)</span>
                <span>Strict (90%)</span>
              </div>
              <p className="text-xs text-muted mt-2">
                {compatible.length === 0
                  ? `Aucun candidat n'atteint ${minScore}% de compatibilité. Baissez le seuil ou attirez plus de candidats.`
                  : `${compatible.length} profil${compatible.length > 1 ? 's' : ''} visible${compatible.length > 1 ? 's' : ''} sur ${scored.length} analysé${scored.length > 1 ? 's' : ''}.`}
              </p>
            </div>
          )}
        </div>

        {loading ? (
          <div className="py-20 text-center text-muted text-sm">Chargement des fiches de poste…</div>
        ) : !hasMatched ? (
          <div className="bg-gradient-to-br from-teal-light to-bg border border-teal/20 rounded-card p-12 text-center">
            <div className="text-5xl mb-3">🎯</div>
            <h3 className="text-h2 text-primary mb-2">Découvrez vos candidats compatibles</h3>
            <p className="text-muted text-sm max-w-md mx-auto mb-5">
              Sélectionnez une fiche de poste puis lancez le matching. Seuls les profils dont le score
              de compatibilité dépasse votre seuil seront révélés.
            </p>
            <p className="text-xs text-muted">
              {candidates.length === 0
                ? "Aucun candidat n'a encore complété son profil. Patience — ils arrivent."
                : `${candidates.length} candidat${candidates.length > 1 ? 's ont' : ' a'} complété un profil dans la base. Lancez le matching pour voir qui correspond.`}
            </p>
          </div>
        ) : compatible.length === 0 ? (
          <div className="bg-card border border-border rounded-card p-12 text-center">
            <div className="text-5xl mb-3">🔍</div>
            <h3 className="text-h2 text-primary mb-2">Aucun profil ne dépasse {minScore}% pour cette offre</h3>
            <p className="text-muted text-sm max-w-md mx-auto">
              Essayez d'abaisser le seuil de compatibilité, ou affinez votre fiche de poste pour
              attirer les profils adéquats.
            </p>
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
                          <p className="text-sm text-muted italic">Lance le matching pour voir les scores de compatibilité.</p>
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

                        {/* ── Annotations recruteur (historique persistant) ─────── */}
                        <div className="mt-5 p-4 bg-white border border-border rounded-card">
                          <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                            <div className="text-xs font-bold text-primary uppercase tracking-wider">📝 Suivi & annotation</div>
                            {notes[mc.profile.id]?.updated_at && (
                              <span className="text-[10px] text-muted">Modifié le {new Date(notes[mc.profile.id].updated_at!).toLocaleString('fr-FR')}</span>
                            )}
                          </div>

                          {/* Statut */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            {['Contacté', 'Entretien', 'Retenu', 'Refusé'].map(s => {
                              const active = notes[mc.profile.id]?.status === s;
                              return (
                                <button
                                  key={s}
                                  onClick={() => updateNote(mc.profile.id, { status: active ? null : s })}
                                  className={`text-xs font-semibold px-3 py-1 rounded-pill border transition-all ${
                                    active ? 'bg-blue-500 text-white border-blue-500'
                                           : 'border-border text-muted hover:border-blue-300'
                                  }`}
                                >
                                  {s}
                                </button>
                              );
                            })}
                          </div>

                          {/* Note libre */}
                          <textarea
                            value={notes[mc.profile.id]?.note ?? ''}
                            onChange={(e) => updateNote(mc.profile.id, { note: e.target.value })}
                            placeholder="Notes personnelles, points évoqués en entretien, prochaines étapes…"
                            rows={3}
                            className="w-full border border-border rounded-btn bg-bg px-3 py-2 text-sm text-primary focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-none"
                          />
                        </div>

                        {/* Actions : export PDF */}
                        <div className="flex flex-wrap gap-2 mt-4">
                          <button
                            onClick={() => exportCandidatePdf(mc)}
                            className="flex-1 px-4 py-2.5 rounded-btn bg-primary text-white font-bold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2"
                          >
                            📄 Télécharger le compte rendu PDF
                          </button>
                          {mc.profile.email && (
                            <a
                              href={`mailto:${mc.profile.email}?subject=SynchroniAI — Votre candidature`}
                              className="px-4 py-2.5 rounded-btn border border-border bg-white text-primary font-semibold text-sm hover:bg-bg transition-all"
                            >
                              ✉ Contacter
                            </a>
                          )}
                        </div>
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

        {/* Support prioritaire — toujours visible côté recruteur */}
        <div className="mt-12 p-5 bg-gradient-to-br from-blue-50 to-bg border border-blue-100 rounded-card flex flex-wrap items-center gap-4">
          <div className="text-3xl">💬</div>
          <div className="flex-1 min-w-48">
            <div className="font-bold text-primary text-sm">Support prioritaire 7j/7</div>
            <div className="text-xs text-muted">Une question, un blocage ? Réponse sous 24h.</div>
          </div>
          <a
            href="mailto:renatoprojetrecrutement@gmail.com?subject=Support%20SynchroniAI%20Pro"
            className="px-4 py-2 rounded-btn bg-blue-500 text-white text-sm font-bold hover:bg-blue-600 transition-all"
          >
            Contacter le support
          </a>
        </div>
      </div>
    </div>
  );
}
