import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from 'recharts';
import type { Candidate, PageName } from '../types';
import { Avatar } from '../components/Avatar';
import { ScoreBar } from '../components/ScoreBar';

interface CompteRenduProps {
  candidate: Candidate | null;
  setPage: (p: PageName) => void;
}

function scoreColor(score: number) {
  if (score >= 85) return '#09C4A0';
  if (score >= 70) return '#D48A12';
  return '#C0392B';
}

export function CompteRendu({ candidate, setPage }: CompteRenduProps) {
  if (!candidate) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-muted">Aucun candidat sélectionné.</div>
      </div>
    );
  }

  const c = candidate;
  const color = scoreColor(c.score);

  const radarData = [
    { axis: 'Hard Skills', value: c.skills },
    { axis: 'Expériences', value: c.experience },
    { axis: 'Communication', value: c.communication },
    { axis: 'Environnement', value: c.environment },
    { axis: 'Équipe', value: c.team },
    { axis: 'Management', value: c.management },
    { axis: 'Attentes', value: c.expectations },
  ];

  const bars = [
    { label: 'Hard Skills', value: c.skills },
    { label: 'Expériences', value: c.experience },
    { label: 'Communication', value: c.communication },
    { label: 'Environnement', value: c.environment },
    { label: 'Équipe', value: c.team },
    { label: 'Management', value: c.management },
    { label: 'Attentes', value: c.expectations },
  ];

  const recoBg =
    c.score >= 85 ? '#E8F8EF' : c.score >= 70 ? '#FEF5E0' : '#FDEEEC';
  const recoBorder =
    c.score >= 85 ? '#23B574' : c.score >= 70 ? '#D48A12' : '#C0392B';

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Back */}
        <button
          onClick={() => setPage('recruteur')}
          className="mb-6 flex items-center gap-2 text-muted border border-border rounded-btn px-4 py-2 text-sm hover:bg-bg transition-all"
        >
          ← Retour
        </button>

        {/* Header */}
        <div className="bg-card rounded-card border border-border p-6 mb-6 flex flex-wrap items-center gap-4">
          <Avatar initials={c.initials} color={c.avatarColor} size={56} />
          <div className="flex-1">
            <h1 className="text-2xl font-extrabold text-primary tracking-tight">
              {c.name}
            </h1>
            <p className="text-muted text-sm">{c.role}</p>
            <p className="text-muted text-xs mt-0.5">Candidature : {c.applied}</p>
          </div>
          {/* Score circle */}
          <div className="flex-shrink-0 flex flex-col items-center">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ border: `4px solid ${color}` }}
            >
              <span
                className="text-2xl font-extrabold"
                style={{ color }}
              >
                {c.score}
              </span>
            </div>
            <span className="text-xs text-muted mt-1 font-medium">
              Score global
            </span>
          </div>
        </div>

        {/* 2-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Radar */}
          <div className="bg-card rounded-card border border-border p-6">
            <h2 className="text-base font-bold text-primary mb-4">
              Radar de compatibilité
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(26,62,110,0.08)" />
                <PolarAngleAxis
                  dataKey="axis"
                  tick={{ fontSize: 11, fill: '#6A6B80' }}
                />
                <Radar
                  name={c.name}
                  dataKey="value"
                  stroke={color}
                  fill={color}
                  fillOpacity={0.18}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Score bars */}
          <div className="bg-card rounded-card border border-border p-6">
            <h2 className="text-base font-bold text-primary mb-4">
              Scores par dimension
            </h2>
            {bars.map(b => (
              <ScoreBar
                key={b.label}
                label={b.label}
                value={b.value}
                barColor={scoreColor(b.value)}
              />
            ))}
          </div>
        </div>

        {/* Analysis */}
        <div className="bg-card rounded-card border border-border p-6 mb-6">
          <h2 className="text-base font-bold text-primary mb-3">
            Analyse IA
          </h2>
          <p className="text-sm text-primary leading-relaxed mb-5">
            {c.summary}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-success-light rounded-xl p-4">
              <div className="font-semibold text-success text-sm mb-2">
                ✓ Points forts
              </div>
              <ul className="space-y-1">
                {c.strengths.map(s => (
                  <li key={s} className="text-sm text-primary flex gap-2">
                    <span className="text-success">•</span> {s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl p-4" style={{ background: '#FEF5E0' }}>
              <div
                className="font-semibold text-sm mb-2"
                style={{ color: '#D48A12' }}
              >
                ⚠ Points d'attention
              </div>
              {c.gaps.length === 0 ? (
                <p className="text-sm text-success">
                  ✓ Aucun point critique identifié
                </p>
              ) : (
                <ul className="space-y-1">
                  {c.gaps.map(g => (
                    <li key={g} className="text-sm text-primary flex gap-2">
                      <span style={{ color: '#D48A12' }}>•</span> {g}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Recommendation */}
        <div
          className="rounded-card border-l-4 p-6 mb-6"
          style={{
            background: recoBg,
            borderColor: recoBorder,
            borderWidth: '0 0 0 4px',
            borderStyle: 'solid',
          }}
        >
          <p
            className="text-xs font-bold uppercase tracking-widest mb-2"
            style={{ color: recoBorder }}
          >
            RECOMMANDATION IA
          </p>
          <p className="font-bold text-primary leading-relaxed mb-3">
            {c.recommendation}
          </p>
          <p className="text-xs text-muted italic">
            Cette recommandation est fournie à titre indicatif. La décision
            finale appartient au recruteur humain. Conforme AI Act européen.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2.5">
          <button className="px-5 py-2.5 rounded-btn bg-success-light text-success font-semibold text-sm hover:opacity-90 transition-all border border-success/20">
            ✓ Retenir
          </button>
          <button className="px-5 py-2.5 rounded-btn bg-violet-light text-violet font-semibold text-sm hover:opacity-90 transition-all border border-violet/20">
            📅 Entretien
          </button>
          <button className="px-5 py-2.5 rounded-btn border border-border text-muted font-semibold text-sm hover:bg-bg transition-all">
            ✏️ Annoter
          </button>
          <button className="px-5 py-2.5 rounded-btn border border-border text-muted font-semibold text-sm hover:bg-bg transition-all">
            📄 PDF
          </button>
          <button
            className="px-5 py-2.5 rounded-btn font-semibold text-sm hover:opacity-90 transition-all"
            style={{ background: '#FDEEEC', color: '#C0392B' }}
          >
            ✗ Décliner
          </button>
        </div>
      </div>
    </div>
  );
}
