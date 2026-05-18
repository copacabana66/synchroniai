import { useState, useEffect, useRef } from 'react';
import type { PageName, AssessmentData } from '../types';
import {
  PERSONALITY_ITEMS, LIKERT_LABELS, COGNITIVE_ITEMS,
  deriveBehavioralType,
  type BigFiveScores,
} from '../data/assessmentQuestions';
import { saveAssessment } from '../lib/candidateService';

interface Props {
  setPage: (p: PageName) => void;
  userId: string;
  onComplete: (data: AssessmentData) => void;
}

type Phase = 'intro' | 'personality' | 'cognitive' | 'result';

// ─────────────────────────────────────────────────────────────
// Scoring déterministe — pas d'IA, pas d'hallucination possible
// ─────────────────────────────────────────────────────────────
function computeBigFive(responses: Record<string, number>): BigFiveScores {
  const sums: Record<string, number[]> = { O: [], C: [], E: [], A: [], N: [] };
  for (const item of PERSONALITY_ITEMS) {
    const raw = responses[item.id];
    if (typeof raw !== 'number') continue;
    const score = item.reverse ? 6 - raw : raw;
    sums[item.dimension].push(score);
  }
  const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 3;
  return { O: avg(sums.O), C: avg(sums.C), E: avg(sums.E), A: avg(sums.A), N: avg(sums.N) };
}

function computeCognitive(responses: Record<string, number>) {
  const byCategory: Record<string, { ok: number; total: number }> = {};
  let correct = 0;
  for (const item of COGNITIVE_ITEMS) {
    const cat = item.category;
    byCategory[cat] = byCategory[cat] ?? { ok: 0, total: 0 };
    byCategory[cat].total += 1;
    if (responses[item.id] === item.correctIndex) {
      correct += 1;
      byCategory[cat].ok += 1;
    }
  }
  const byCategoryPct: Record<string, number> = {};
  for (const k of Object.keys(byCategory)) {
    byCategoryPct[k] = Math.round((byCategory[k].ok / byCategory[k].total) * 100);
  }
  return {
    total: Math.round((correct / COGNITIVE_ITEMS.length) * 100),
    byCategory: byCategoryPct,
    correctAnswers: correct,
    totalQuestions: COGNITIVE_ITEMS.length,
  };
}

// ─────────────────────────────────────────────────────────────
// Composants
// ─────────────────────────────────────────────────────────────
function ProgressBar({ value, max }: { value: number; max: number }) {
  return (
    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
      <div className="h-full bg-teal rounded-full transition-all" style={{ width: `${(value / max) * 100}%` }} />
    </div>
  );
}

function DimensionBar({ label, score, color = '#09C4A0' }: { label: string; score: number; color?: string }) {
  const pct = Math.round((score / 5) * 100);
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-primary font-medium">{label}</span>
        <span className="text-muted font-semibold">{score.toFixed(1)} / 5</span>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export function CandidatTest({ setPage, userId, onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [personalityIdx, setPersonalityIdx] = useState(0);
  const [cognitiveIdx, setCognitiveIdx] = useState(0);
  const [responses, setResponses] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [result, setResult] = useState<AssessmentData | null>(null);
  const [saving, setSaving] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Chronomètre cognitif ────────────────────────────────────
  useEffect(() => {
    if (phase !== 'cognitive') return;
    const item = COGNITIVE_ITEMS[cognitiveIdx];
    if (!item) return;
    setTimeLeft(item.timeLimit);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          // Time up : skip to next without answer
          if (timerRef.current) clearInterval(timerRef.current);
          advanceCognitive();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, cognitiveIdx]);

  function answerPersonality(value: number) {
    const item = PERSONALITY_ITEMS[personalityIdx];
    setResponses(r => ({ ...r, [item.id]: value }));
    if (personalityIdx < PERSONALITY_ITEMS.length - 1) {
      setPersonalityIdx(i => i + 1);
    } else {
      setPhase('cognitive');
    }
  }

  function answerCognitive(choiceIdx: number) {
    const item = COGNITIVE_ITEMS[cognitiveIdx];
    setResponses(r => ({ ...r, [item.id]: choiceIdx }));
    advanceCognitive();
  }

  function advanceCognitive() {
    if (cognitiveIdx < COGNITIVE_ITEMS.length - 1) {
      setCognitiveIdx(i => i + 1);
    } else {
      finalize();
    }
  }

  async function finalize() {
    if (timerRef.current) clearInterval(timerRef.current);
    const big5 = computeBigFive(responses);
    const behav = deriveBehavioralType(big5);
    const cog = computeCognitive(responses);

    const data: AssessmentData = {
      cognitive: cog,
      personality: {
        bigFive: big5,
        type: behav.type,
        description: behav.description,
        strengths: behav.strengths,
        bestEnvironments: behav.bestEnvironments,
      },
      completedAt: new Date().toISOString(),
    };
    setResult(data);
    setPhase('result');
    if (userId) {
      setSaving(true);
      await saveAssessment(userId, data, responses);
      setSaving(false);
    }
    onComplete(data);
  }

  // ─────────────────────────────────────────────────────────────
  // Rendu
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <button onClick={() => setPage('candidat-profil')} className="mb-6 flex items-center gap-2 text-muted border border-border rounded-btn px-4 py-2 text-sm hover:bg-card transition-all">
          ← Retour
        </button>

        {phase === 'intro' && (
          <div className="bg-card border border-border rounded-card p-8">
            <h1 className="text-2xl font-extrabold text-primary mb-2">Test cognitif & personnalité</h1>
            <p className="text-muted text-sm mb-6">
              10 minutes — deux parties : un questionnaire de personnalité (Big Five, 25 questions)
              puis 10 questions de raisonnement chronométrées.
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3 p-4 bg-teal/5 border border-teal/20 rounded-lg">
                <span className="text-2xl">🧠</span>
                <div>
                  <h3 className="font-bold text-primary text-sm">Partie 1 — Personnalité (5 min)</h3>
                  <p className="text-xs text-muted mt-1">25 affirmations sur une échelle 1 à 5. Pas de bonne ou mauvaise réponse — répondez instinctivement.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-purple-50 border border-purple-100 rounded-lg">
                <span className="text-2xl">⚡</span>
                <div>
                  <h3 className="font-bold text-primary text-sm">Partie 2 — Raisonnement (5 min)</h3>
                  <p className="text-xs text-muted mt-1">10 questions chronométrées en logique, verbal, numérique et attention.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                <span className="text-2xl">🔒</span>
                <div>
                  <h3 className="font-bold text-primary text-sm">Données protégées</h3>
                  <p className="text-xs text-muted mt-1">Vos réponses sont privées. Seul vous y avez accès, vos scores enrichissent le matching IA pour les offres pertinentes.</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setPhase('personality')}
              className="w-full bg-teal text-primary font-bold py-3 rounded-btn hover:opacity-90 transition-all"
            >
              Commencer le test
            </button>
          </div>
        )}

        {phase === 'personality' && (() => {
          const item = PERSONALITY_ITEMS[personalityIdx];
          return (
            <div className="bg-card border border-border rounded-card p-8">
              <div className="mb-6">
                <div className="flex justify-between text-xs text-muted mb-2">
                  <span>Personnalité — Question {personalityIdx + 1} / {PERSONALITY_ITEMS.length}</span>
                  <span>{Math.round(((personalityIdx + 1) / PERSONALITY_ITEMS.length) * 100)}%</span>
                </div>
                <ProgressBar value={personalityIdx + 1} max={PERSONALITY_ITEMS.length} />
              </div>

              <h2 className="text-lg font-semibold text-primary mb-6 leading-snug">{item.text}</h2>

              <div className="space-y-2">
                {LIKERT_LABELS.map((label, i) => (
                  <button
                    key={i}
                    onClick={() => answerPersonality(i + 1)}
                    className="w-full text-left px-4 py-3 border border-border rounded-btn text-sm text-primary hover:bg-teal/5 hover:border-teal transition-all"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          );
        })()}

        {phase === 'cognitive' && (() => {
          const item = COGNITIVE_ITEMS[cognitiveIdx];
          const timeColor = timeLeft <= 10 ? '#C0392B' : timeLeft <= 20 ? '#D48A12' : '#09C4A0';
          return (
            <div className="bg-card border border-border rounded-card p-8">
              <div className="mb-6">
                <div className="flex justify-between text-xs text-muted mb-2">
                  <span>Raisonnement — Question {cognitiveIdx + 1} / {COGNITIVE_ITEMS.length}</span>
                  <span className="font-bold" style={{ color: timeColor }}>⏱ {timeLeft}s</span>
                </div>
                <ProgressBar value={cognitiveIdx + 1} max={COGNITIVE_ITEMS.length} />
              </div>

              <div className="mb-2 text-xs font-semibold text-teal uppercase tracking-wider">{item.category}</div>
              <h2 className="text-lg font-semibold text-primary mb-6 leading-snug">{item.question}</h2>

              <div className="space-y-2">
                {item.choices.map((choice, i) => (
                  <button
                    key={i}
                    onClick={() => answerCognitive(i)}
                    className="w-full text-left px-4 py-3 border border-border rounded-btn text-sm text-primary hover:bg-teal/5 hover:border-teal transition-all"
                  >
                    <span className="font-bold text-teal mr-2">{String.fromCharCode(65 + i)}.</span>
                    {choice}
                  </button>
                ))}
              </div>
            </div>
          );
        })()}

        {phase === 'result' && result && (
          <div className="space-y-5">
            <div className="bg-card border border-border rounded-card p-8 text-center">
              <div className="text-6xl mb-3">🎯</div>
              <h2 className="text-2xl font-extrabold text-primary mb-1">Votre profil : {result.personality.type}</h2>
              <p className="text-sm text-muted max-w-md mx-auto">{result.personality.description}</p>
            </div>

            <div className="bg-card border border-border rounded-card p-6">
              <h3 className="text-sm font-bold text-primary uppercase tracking-wider mb-4">Big Five (personnalité)</h3>
              <div className="space-y-3">
                <DimensionBar label="Ouverture"             score={result.personality.bigFive.O} color="#6851C7" />
                <DimensionBar label="Conscience"            score={result.personality.bigFive.C} color="#09C4A0" />
                <DimensionBar label="Extraversion"          score={result.personality.bigFive.E} color="#D48A12" />
                <DimensionBar label="Agréabilité"           score={result.personality.bigFive.A} color="#23B574" />
                <DimensionBar label="Stabilité émotionnelle" score={result.personality.bigFive.N} color="#3B82F6" />
              </div>
            </div>

            <div className="bg-card border border-border rounded-card p-6">
              <h3 className="text-sm font-bold text-primary uppercase tracking-wider mb-4">
                Raisonnement — {result.cognitive.total}% ({result.cognitive.correctAnswers}/{result.cognitive.totalQuestions})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(result.cognitive.byCategory).map(([cat, pct]) => (
                  <div key={cat} className="text-center p-3 bg-bg rounded-lg">
                    <div className="text-2xl font-extrabold text-teal">{pct}%</div>
                    <div className="text-xs text-muted capitalize mt-1">{cat}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card border border-border rounded-card p-6">
              <h3 className="text-sm font-bold text-primary uppercase tracking-wider mb-3">Vos points forts</h3>
              <div className="flex flex-wrap gap-2 mb-5">
                {result.personality.strengths.map(s => (
                  <span key={s} className="text-xs bg-teal/10 text-teal px-3 py-1 rounded-full font-medium">{s}</span>
                ))}
              </div>
              <h3 className="text-sm font-bold text-primary uppercase tracking-wider mb-3">Environnements adaptés</h3>
              <div className="flex flex-wrap gap-2">
                {result.personality.bestEnvironments.map(s => (
                  <span key={s} className="text-xs bg-purple-50 text-purple-600 px-3 py-1 rounded-full font-medium">{s}</span>
                ))}
              </div>
            </div>

            <button
              onClick={() => setPage('candidat')}
              disabled={saving}
              className="w-full bg-primary text-white font-bold py-3 rounded-btn hover:opacity-90 transition-all disabled:opacity-40"
            >
              {saving ? 'Enregistrement…' : 'Voir mes offres compatibles →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
