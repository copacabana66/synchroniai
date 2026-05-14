import { useState } from 'react';
import type { PageName } from '../types';

interface CandidatProfilProps {
  setPage: (p: PageName) => void;
}

const STEPS = ['CV Import', 'Questionnaire', 'Vidéo', 'Préférences'];

const Q1_OPTIONS = [
  'Management directif',
  'Management bienveillant',
  'Par objectifs',
  'Management horizontal/agile',
  'Très grande autonomie',
];
const Q2_OPTIONS = [
  'Open-space dynamique',
  'Bureau privé calme',
  'Full télétravail',
  'Hybride 2-3j bureau',
  'Sur site / terrain',
];
const Q3_OPTIONS = [
  'Très collaboratif',
  'Mix solo + équipe',
  'Majoritairement solo',
  'Petite équipe soudée',
  'Grande équipe diverse',
];
const Q4_OPTIONS = [
  'Cadencé et prévisible',
  'Varié avec pics d\'intensité',
  'Startup velocity',
  'Projets longs et profonds',
  'Multiprojet simultané',
];

function PillSelector({
  options,
  selected,
  onSelect,
}: {
  options: string[];
  selected: string | null;
  onSelect: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {options.map(o => (
        <button
          key={o}
          onClick={() => onSelect(o)}
          className={`px-4 py-2 rounded-full text-sm border transition-all font-medium ${
            selected === o
              ? 'bg-teal-light border-teal text-primary font-semibold'
              : 'border-border text-muted hover:bg-bg'
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

export function CandidatProfil({ setPage }: CandidatProfilProps) {
  const [step, setStep] = useState(0);
  const [q1, setQ1] = useState<string | null>(null);
  const [q2, setQ2] = useState<string | null>(null);
  const [q3, setQ3] = useState<string | null>(null);
  const [q4, setQ4] = useState<string | null>(null);
  const [localisation, setLocalisation] = useState('');
  const [salaire, setSalaire] = useState('');
  const [contrat, setContrat] = useState('');
  const [dispo, setDispo] = useState('');

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <button
          onClick={() => setPage('candidat')}
          className="mb-6 flex items-center gap-2 text-muted border border-border rounded-btn px-4 py-2 text-sm hover:bg-bg transition-all"
        >
          ← Retour
        </button>

        <h1 className="text-2xl font-extrabold text-primary tracking-tight mb-2">
          Créer mon profil
        </h1>
        <p className="text-muted text-sm mb-8">
          Complétez les 4 étapes pour recevoir des offres compatibles.
        </p>

        {/* Step tabs */}
        <div className="bg-card border border-border rounded-xl p-1.5 flex gap-1 mb-8">
          {STEPS.map((s, i) => (
            <button
              key={s}
              onClick={() => setStep(i)}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                step === i
                  ? 'bg-primary text-white'
                  : i < step
                  ? 'text-teal'
                  : 'text-muted'
              }`}
            >
              {i < step ? '✓ ' : `${i + 1}. `}
              {s}
            </button>
          ))}
        </div>

        {/* Step 0 — CV */}
        {step === 0 && (
          <div>
            <h2 className="text-lg font-bold text-primary mb-4">
              Importez votre CV
            </h2>
            <div className="border-2 border-dashed border-border rounded-xl bg-bg py-12 text-center mb-4">
              <div className="text-4xl mb-3">📄</div>
              <p className="text-primary font-semibold mb-1">
                Glissez votre CV ici
              </p>
              <p className="text-muted text-sm mb-4">PDF, DOCX — max 5 MB</p>
              <button className="px-5 py-2.5 rounded-btn border border-border text-sm font-semibold text-muted hover:bg-card transition-all">
                Parcourir les fichiers
              </button>
            </div>
            <div className="bg-teal-light border border-teal/25 rounded-xl p-4 mb-6">
              <p className="text-sm text-primary font-medium">
                ℹ️ Votre CV est analysé de façon confidentielle. Seules les
                compétences professionnelles sont extraites.
              </p>
            </div>
            <button
              onClick={() => setStep(1)}
              className="px-6 py-3 rounded-btn bg-primary text-white font-bold text-sm hover:opacity-90 transition-all"
            >
              Continuer →
            </button>
          </div>
        )}

        {/* Step 1 — Questionnaire */}
        {step === 1 && (
          <div>
            <h2 className="text-lg font-bold text-primary mb-6">
              Questionnaire de compatibilité
            </h2>

            <div className="space-y-6">
              <div>
                <p className="font-semibold text-sm text-primary">
                  1. Style de management préféré
                </p>
                <PillSelector
                  options={Q1_OPTIONS}
                  selected={q1}
                  onSelect={setQ1}
                />
              </div>
              <div>
                <p className="font-semibold text-sm text-primary">
                  2. Environnement de travail idéal
                </p>
                <PillSelector
                  options={Q2_OPTIONS}
                  selected={q2}
                  onSelect={setQ2}
                />
              </div>
              <div>
                <p className="font-semibold text-sm text-primary">
                  3. Style de collaboration préféré
                </p>
                <PillSelector
                  options={Q3_OPTIONS}
                  selected={q3}
                  onSelect={setQ3}
                />
              </div>
              <div>
                <p className="font-semibold text-sm text-primary">
                  4. Rythme de travail
                </p>
                <PillSelector
                  options={Q4_OPTIONS}
                  selected={q4}
                  onSelect={setQ4}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setStep(0)}
                className="px-5 py-2.5 rounded-btn border border-border text-muted text-sm font-semibold hover:bg-bg transition-all"
              >
                ← Retour
              </button>
              <button
                onClick={() => setStep(2)}
                className="px-6 py-3 rounded-btn bg-primary text-white font-bold text-sm hover:opacity-90 transition-all"
              >
                Continuer →
              </button>
            </div>
          </div>
        )}

        {/* Step 2 — Video */}
        {step === 2 && (
          <div>
            <h2 className="text-lg font-bold text-primary mb-4">
              Présentation vidéo (optionnelle)
            </h2>
            <div className="bg-gray-50 rounded-xl py-12 text-center border border-border mb-4">
              <div className="text-4xl mb-3">🎥</div>
              <p className="text-primary font-semibold mb-1">
                Enregistrez une présentation de 90 secondes
              </p>
              <p className="text-muted text-sm mb-5">
                Parlez naturellement de votre parcours et de vos aspirations.
              </p>
              <button className="px-5 py-2.5 rounded-btn bg-teal text-primary font-bold text-sm hover:opacity-90 transition-all">
                Démarrer l'enregistrement
              </button>
            </div>
            <div
              className="rounded-xl p-4 border border-yellow-200 mb-6"
              style={{ background: '#FEF5E0' }}
            >
              <p className="font-semibold text-sm mb-2" style={{ color: '#D48A12' }}>
                ⚠ Ce que l'IA analyse dans votre vidéo
              </p>
              <p className="text-sm text-primary">
                <strong>Analysé :</strong> Clarté d'expression, structure de la
                communication, aisance à l'oral.
              </p>
              <p className="text-sm text-primary mt-1">
                <strong>PAS analysé :</strong> Apparence physique, genre,
                origine, âge, handicap visible. Conformité AI Act totale.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="px-5 py-2.5 rounded-btn border border-border text-muted text-sm font-semibold hover:bg-bg transition-all"
              >
                ← Retour
              </button>
              <button
                onClick={() => setStep(3)}
                className="px-5 py-2.5 rounded-btn border border-border text-muted text-sm font-semibold hover:bg-bg transition-all"
              >
                Passer cette étape →
              </button>
              <button
                onClick={() => setStep(3)}
                className="px-6 py-3 rounded-btn bg-primary text-white font-bold text-sm hover:opacity-90 transition-all"
              >
                Continuer →
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Preferences */}
        {step === 3 && (
          <div>
            <h2 className="text-lg font-bold text-primary mb-6">
              Mes préférences
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-primary block mb-1.5">
                  Localisation souhaitée
                </label>
                <input
                  type="text"
                  value={localisation}
                  onChange={e => setLocalisation(e.target.value)}
                  placeholder="Ex : Perpignan, Montpellier, Remote..."
                  className="w-full border border-border rounded-btn bg-bg px-4 py-2.5 text-sm text-primary focus:outline-none focus:border-teal focus:ring-2 focus:ring-teal/20 transition-all"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-primary block mb-1.5">
                  Salaire annuel souhaité (brut)
                </label>
                <input
                  type="text"
                  value={salaire}
                  onChange={e => setSalaire(e.target.value)}
                  placeholder="Ex : 45 000€ – 55 000€"
                  className="w-full border border-border rounded-btn bg-bg px-4 py-2.5 text-sm text-primary focus:outline-none focus:border-teal focus:ring-2 focus:ring-teal/20 transition-all"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-primary block mb-1.5">
                  Type de contrat
                </label>
                <select
                  value={contrat}
                  onChange={e => setContrat(e.target.value)}
                  className="w-full border border-border rounded-btn bg-bg px-4 py-2.5 text-sm text-primary focus:outline-none focus:border-teal focus:ring-2 focus:ring-teal/20 transition-all"
                >
                  <option value="">Sélectionner...</option>
                  <option>CDI</option>
                  <option>CDD</option>
                  <option>Freelance / Mission</option>
                  <option>Stage / Alternance</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-primary block mb-1.5">
                  Disponibilité
                </label>
                <select
                  value={dispo}
                  onChange={e => setDispo(e.target.value)}
                  className="w-full border border-border rounded-btn bg-bg px-4 py-2.5 text-sm text-primary focus:outline-none focus:border-teal focus:ring-2 focus:ring-teal/20 transition-all"
                >
                  <option value="">Sélectionner...</option>
                  <option>Immédiate</option>
                  <option>Sous 1 mois</option>
                  <option>Sous 3 mois</option>
                  <option>À définir</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setStep(2)}
                className="px-5 py-2.5 rounded-btn border border-border text-muted text-sm font-semibold hover:bg-bg transition-all"
              >
                ← Retour
              </button>
              <button
                onClick={() => setPage('candidat')}
                className="px-6 py-3 rounded-btn bg-primary text-white font-bold text-sm hover:opacity-90 transition-all"
              >
                ✓ Finaliser mon profil
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
