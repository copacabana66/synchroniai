import { useState } from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
} from 'recharts';
import type { Candidate, PageName } from '../types';
import { Avatar } from '../components/Avatar';
import { ScoreBar } from '../components/ScoreBar';
import { fetchJobPostings } from '../lib/jobPostingService';

interface CompteRenduProps {
  candidate: Candidate | null;
  setPage: (p: PageName) => void;
}

interface AiDimension { score: number; label: string; comment: string }
interface AiReport {
  globalScore: number;
  dimensions: Record<string, AiDimension>;
  summary: string;
  strengths: string[];
  gaps: string[];
  recommendation: string;
  recommendationDetail: string;
  suggestedQuestions: string[];
}

function scoreColor(score: number) {
  if (score >= 85) return '#09C4A0';
  if (score >= 70) return '#D48A12';
  return '#C0392B';
}

export function CompteRendu({ candidate, setPage }: CompteRenduProps) {
  const [aiReport, setAiReport] = useState<AiReport | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  if (!candidate) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-muted">Aucun candidat sélectionné.</div>
      </div>
    );
  }

  const c = candidate;

  // Active display data — AI report takes priority over mock data
  const activeScore = aiReport?.globalScore ?? c.score;
  const color = scoreColor(activeScore);

  const radarData = aiReport
    ? Object.values(aiReport.dimensions).map(d => ({ axis: d.label, value: d.score }))
    : [
        { axis: 'Hard Skills',  value: c.skills },
        { axis: 'Expériences',  value: c.experience },
        { axis: 'Communication',value: c.communication },
        { axis: 'Environnement',value: c.environment },
        { axis: 'Équipe',       value: c.team },
        { axis: 'Management',   value: c.management },
        { axis: 'Attentes',     value: c.expectations },
      ];

  const bars = aiReport
    ? Object.values(aiReport.dimensions).map(d => ({ label: d.label, value: d.score }))
    : [
        { label: 'Hard Skills',   value: c.skills },
        { label: 'Expériences',   value: c.experience },
        { label: 'Communication', value: c.communication },
        { label: 'Environnement', value: c.environment },
        { label: 'Équipe',        value: c.team },
        { label: 'Management',    value: c.management },
        { label: 'Attentes',      value: c.expectations },
      ];

  const strengths = aiReport?.strengths ?? c.strengths;
  const gaps      = aiReport?.gaps      ?? c.gaps;
  const summary   = aiReport?.summary   ?? c.summary;
  const reco      = aiReport?.recommendationDetail ?? c.recommendation;
  const recoLabel = aiReport?.recommendation ?? (c.score >= 85 ? 'RETENIR' : c.score >= 70 ? 'À EXAMINER' : 'INSUFFISANT');

  const recoBg     = activeScore >= 85 ? '#E8F8EF' : activeScore >= 70 ? '#FEF5E0' : '#FDEEEC';
  const recoBorder = activeScore >= 85 ? '#23B574' : activeScore >= 70 ? '#D48A12' : '#C0392B';

  async function generateAiReport() {
    setAiLoading(true);
    setAiError(null);
    // Use first published job posting if available, otherwise send candidate-only context
    const postings = (await fetchJobPostings()).filter(p => p.status === 'published');
    const jobPosting = postings[0] ?? null;

    try {
      const res = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate: {
            name:        c.name,
            role:        c.role,
            summary:     c.summary,
            skills:      c.skills,
            experience:  c.experience,
            communication: c.communication,
          },
          jobPosting: jobPosting ?? {
            title: c.role,
            description: 'Poste à définir',
            expectations: '',
            managementStyle: '',
          },
          preferences: {},
          videoAnalysis: null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAiError(data.error === 'AI_NOT_CONFIGURED'
          ? 'Service IA non configuré. Vérifiez les variables d\'environnement Vercel.'
          : 'Erreur lors de la génération du rapport.');
      } else {
        setAiReport(data as AiReport);
      }
    } catch {
      setAiError('Erreur réseau.');
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <button
          onClick={() => setPage('recruteur')}
          className="mb-6 flex items-center gap-2 text-muted border border-border rounded-btn px-4 py-2 text-sm hover:bg-bg transition-all"
        >
          ← Retour
        </button>

        {/* AI generation banner */}
        {!aiReport && (
          <div className="bg-card border-2 border-teal/30 rounded-card p-4 mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✨</span>
              <div>
                <p className="font-bold text-primary text-sm">Générer le compte rendu avec Groq IA</p>
                <p className="text-xs text-muted">Analyse 7 dimensions, points forts/écarts, questions d'entretien suggérées.</p>
              </div>
            </div>
            <button
              onClick={generateAiReport}
              disabled={aiLoading}
              className="px-5 py-2.5 rounded-btn bg-teal text-primary font-bold text-sm hover:opacity-90 transition-all disabled:opacity-40 flex items-center gap-2 flex-shrink-0"
            >
              {aiLoading
                ? <><span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />Analyse…</>
                : '✨ Analyser avec l\'IA'}
            </button>
          </div>
        )}

        {aiError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
            <p className="text-sm text-red-700">{aiError}</p>
          </div>
        )}

        {aiReport && (
          <div className="bg-teal-light border border-teal/30 rounded-xl p-3 mb-5 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-teal">✅ Compte rendu généré par Groq IA</p>
            <button
              onClick={() => { setAiReport(null); setAiError(null); }}
              className="text-xs text-muted hover:text-primary border border-border rounded px-2 py-1"
            >
              Vue standard
            </button>
          </div>
        )}

        {/* Header */}
        <div className="bg-card rounded-card border border-border p-6 mb-6 flex flex-wrap items-center gap-4">
          <Avatar initials={c.initials} color={c.avatarColor} size={56} />
          <div className="flex-1">
            <h1 className="text-2xl font-extrabold text-primary tracking-tight">{c.name}</h1>
            <p className="text-muted text-sm">{c.role}</p>
            <p className="text-muted text-xs mt-0.5">Candidature : {c.applied}</p>
          </div>
          <div className="flex-shrink-0 flex flex-col items-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ border: `4px solid ${color}` }}>
              <span className="text-2xl font-extrabold" style={{ color }}>{activeScore}</span>
            </div>
            <span className="text-xs text-muted mt-1 font-medium">Score global</span>
          </div>
        </div>

        {/* Radar + Bars */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-card rounded-card border border-border p-6">
            <h2 className="text-base font-bold text-primary mb-4">Radar de compatibilité</h2>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(26,62,110,0.08)" />
                <PolarAngleAxis dataKey="axis" tick={{ fontSize: 11, fill: '#6A6B80' }} />
                <Radar name={c.name} dataKey="value" stroke={color} fill={color} fillOpacity={0.18} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card rounded-card border border-border p-6">
            <h2 className="text-base font-bold text-primary mb-4">Scores par dimension</h2>
            {bars.map(b => (
              <ScoreBar key={b.label} label={b.label} value={b.value} barColor={scoreColor(b.value)} />
            ))}
            {/* Dimension comments from AI */}
            {aiReport && (
              <div className="mt-4 space-y-2">
                {Object.values(aiReport.dimensions).map(d => (
                  <p key={d.label} className="text-xs text-muted">
                    <strong className="text-primary">{d.label} :</strong> {d.comment}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Analysis */}
        <div className="bg-card rounded-card border border-border p-6 mb-6">
          <h2 className="text-base font-bold text-primary mb-3">Analyse {aiReport ? 'IA (Groq)' : 'IA'}</h2>
          <p className="text-sm text-primary leading-relaxed mb-5">{summary}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-success-light rounded-xl p-4">
              <div className="font-semibold text-success text-sm mb-2">✓ Points forts</div>
              <ul className="space-y-1">
                {strengths.map((s, i) => (
                  <li key={i} className="text-sm text-primary flex gap-2"><span className="text-success">•</span>{s}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl p-4" style={{ background: '#FEF5E0' }}>
              <div className="font-semibold text-sm mb-2" style={{ color: '#D48A12' }}>⚠ Points d'attention</div>
              {gaps.length === 0
                ? <p className="text-sm text-success">✓ Aucun point critique identifié</p>
                : <ul className="space-y-1">{gaps.map((g, i) => (
                    <li key={i} className="text-sm text-primary flex gap-2"><span style={{ color: '#D48A12' }}>•</span>{g}</li>
                  ))}</ul>
              }
            </div>
          </div>
        </div>

        {/* AI-generated interview questions */}
        {aiReport?.suggestedQuestions && aiReport.suggestedQuestions.length > 0 && (
          <div className="bg-card rounded-card border border-border p-6 mb-6">
            <h2 className="text-base font-bold text-primary mb-3">💬 Questions d'entretien suggérées</h2>
            <p className="text-xs text-muted mb-3">Générées par l'IA à partir des écarts identifiés dans ce profil.</p>
            <ol className="space-y-2">
              {aiReport.suggestedQuestions.map((q, i) => (
                <li key={i} className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-teal-light text-teal text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                  <p className="text-sm text-primary">{q}</p>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Recommendation */}
        <div className="rounded-card border-l-4 p-6 mb-6"
          style={{ background: recoBg, borderColor: recoBorder, borderWidth: '0 0 0 4px', borderStyle: 'solid' }}
        >
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: recoBorder }}>
            RECOMMANDATION IA — {recoLabel}
          </p>
          <p className="font-bold text-primary leading-relaxed mb-3">{reco}</p>
          <p className="text-xs text-muted italic">
            Cette recommandation est fournie à titre indicatif. La décision finale appartient au recruteur humain. Conforme AI Act européen.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2.5">
          <button className="px-5 py-2.5 rounded-btn bg-success-light text-success font-semibold text-sm hover:opacity-90 transition-all border border-success/20">✓ Retenir</button>
          <button className="px-5 py-2.5 rounded-btn bg-violet-light text-violet font-semibold text-sm hover:opacity-90 transition-all border border-violet/20">📅 Entretien</button>
          <button className="px-5 py-2.5 rounded-btn border border-border text-muted font-semibold text-sm hover:bg-bg transition-all">✏️ Annoter</button>
          <button className="px-5 py-2.5 rounded-btn border border-border text-muted font-semibold text-sm hover:bg-bg transition-all">📄 Export PDF</button>
          <button className="px-5 py-2.5 rounded-btn font-semibold text-sm hover:opacity-90 transition-all" style={{ background: '#FDEEEC', color: '#C0392B' }}>✗ Décliner</button>
        </div>
      </div>
    </div>
  );
}
