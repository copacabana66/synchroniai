import { useState } from 'react';
import type { PageName, ManagementStyle } from '../types';
import { createJobPosting } from '../lib/jobPostingService';

interface RecruteurFichePosteProps {
  setPage: (p: PageName) => void;
  recruiterId: string;
  companyName: string;
}

type Mode = 'manual' | 'ai';

const CONTRACT_TYPES = ['CDI', 'CDD', 'Freelance / Mission', 'Stage / Alternance'];

const MANAGEMENT_OPTIONS: { value: ManagementStyle; label: string; description: string; icon: string }[] = [
  { value: 'bienveillant', label: 'Bienveillant & accompagnant', description: 'Soutien actif, feedback régulier, développement humain', icon: '🤝' },
  { value: 'objectifs',    label: 'Par objectifs (OKR)',         description: 'Résultats attendus définis, liberté sur la méthode',       icon: '🎯' },
  { value: 'directif',     label: 'Directif & structuré',        description: 'Cadre clair, processus définis, organisation rigoureuse',  icon: '📐' },
  { value: 'horizontal',   label: 'Horizontal / Agile',          description: 'Peu de hiérarchie, décisions collectives, sprints',       icon: '⚡' },
  { value: 'autonomie',    label: 'Grande autonomie',            description: 'Confiance totale, peu de réunions, ownership fort',       icon: '🦅' },
];

interface FormState {
  title: string;
  location: string;
  contractType: string;
  salaryMin: string;
  salaryMax: string;
  description: string;
  expectations: string;
  teamProfile: string;
  managementStyle: ManagementStyle | '';
  managementDetail: string;
}

const EMPTY_FORM: FormState = {
  title: '',
  location: '',
  contractType: '',
  salaryMin: '',
  salaryMax: '',
  description: '',
  expectations: '',
  teamProfile: '',
  managementStyle: '',
  managementDetail: '',
};

function SectionCard({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-card p-6 mb-5">
      <h3 className="text-base font-bold text-primary mb-4 flex items-center gap-2">
        <span className="text-xl">{icon}</span>
        {title}
      </h3>
      {children}
    </div>
  );
}

function Field({ label, required, children, hint }: { label: string; required?: boolean; children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-semibold text-primary mb-1.5">
        {label}{required && <span className="text-orange ml-1">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-muted mt-1">{hint}</p>}
    </div>
  );
}

const INPUT_CLS = 'w-full border border-border rounded-btn bg-bg px-4 py-2.5 text-sm text-primary focus:outline-none focus:border-teal focus:ring-2 focus:ring-teal/20 transition-all';
const TEXTAREA_CLS = `${INPUT_CLS} resize-none`;

export function RecruteurFichePoste({ setPage, recruiterId, companyName }: RecruteurFichePosteProps) {
  const [mode, setMode] = useState<Mode>('manual');
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeSection, setActiveSection] = useState(0);

  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const isFormValid = form.title.trim() && form.description.trim();

  async function generateWithAI() {
    if (aiPrompt.trim().length < 15) {
      setAiError('Décrivez votre besoin en au moins quelques mots.');
      return;
    }
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch('/api/generate-job-posting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === 'AI_NOT_CONFIGURED') {
          setAiError('Service IA non configuré. Vérifiez les variables d\'environnement Vercel (GROQ_API_KEY).');
        } else {
          setAiError('Erreur lors de la génération. Réessayez ou passez en saisie manuelle.');
        }
        return;
      }
      setForm({
        title:           data.title           ?? '',
        location:        data.location        ?? '',
        contractType:    data.contractType    ?? '',
        salaryMin:       data.salaryMin       ?? '',
        salaryMax:       data.salaryMax       ?? '',
        description:     data.description     ?? '',
        expectations:    data.expectations    ?? '',
        teamProfile:     data.teamProfile     ?? '',
        managementStyle: data.managementStyle ?? '',
        managementDetail:data.managementDetail ?? '',
      });
      setMode('manual'); // Switch to form view to let user review/edit
    } catch {
      setAiError('Erreur réseau. Vérifiez votre connexion et réessayez.');
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSave(status: 'draft' | 'published') {
    if (!isFormValid) return;
    setSaving(true);
    try {
      await createJobPosting({
        recruiterId,
        company: companyName,
        title: form.title,
        location: form.location,
        contractType: form.contractType,
        salaryMin: form.salaryMin,
        salaryMax: form.salaryMax,
        description: form.description,
        expectations: form.expectations,
        teamProfile: form.teamProfile,
        managementStyle: form.managementStyle,
        managementDetail: form.managementDetail,
        status,
      });
      setSaved(true);
      setTimeout(() => setPage('recruteur'), 1200);
    } finally {
      setSaving(false);
    }
  }

  const SECTIONS = [
    { label: 'Informations', icon: '📋' },
    { label: 'Description', icon: '📝' },
    { label: 'Attentes', icon: '✅' },
    { label: 'Équipe', icon: '👥' },
    { label: 'Management', icon: '🎯' },
  ];

  const completionCount = [
    form.title, form.description, form.expectations, form.teamProfile,
    form.managementStyle, form.location, form.contractType,
  ].filter(v => v.trim().length > 0).length;
  const completionPct = Math.round((completionCount / 7) * 100);

  if (saved) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-xl font-bold text-primary mb-2">Fiche de poste enregistrée !</h2>
          <p className="text-muted text-sm">Redirection vers votre tableau de bord…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Header */}
        <button
          onClick={() => setPage('recruteur')}
          className="mb-6 flex items-center gap-2 text-muted border border-border rounded-btn px-4 py-2 text-sm hover:bg-card transition-all"
        >
          ← Retour au tableau de bord
        </button>
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-primary tracking-tight">Créer une fiche de poste</h1>
          <p className="text-muted text-sm mt-1">Saisissez manuellement ou laissez l'IA rédiger pour vous.</p>
        </div>

        {/* Mode toggle */}
        <div className="bg-card border border-border rounded-xl p-1.5 flex gap-1 mb-6">
          <button
            onClick={() => setMode('manual')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
              mode === 'manual' ? 'bg-primary text-white' : 'text-muted hover:text-primary'
            }`}
          >
            ✏️ Saisie manuelle
          </button>
          <button
            onClick={() => setMode('ai')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
              mode === 'ai' ? 'bg-primary text-white' : 'text-muted hover:text-primary'
            }`}
          >
            ✨ Générer avec l'IA
          </button>
        </div>

        {/* AI mode */}
        {mode === 'ai' && (
          <div className="bg-card border-2 border-teal/30 rounded-card p-6 mb-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-teal-light flex items-center justify-center text-xl flex-shrink-0">✨</div>
              <div>
                <h3 className="font-bold text-primary">Assistant IA — Génération de fiche de poste</h3>
                <p className="text-sm text-muted">Décrivez votre besoin en quelques phrases. L'IA complète toute la fiche pour vous.</p>
              </div>
            </div>

            <div className="bg-bg border border-border rounded-xl p-4 mb-4">
              <p className="text-xs text-muted font-semibold mb-2 uppercase tracking-wider">Exemples de descriptions</p>
              {[
                'Je cherche un développeur React senior pour mon équipe de 5 personnes dans une startup fintech à Paris. Management par objectifs, salaire 55-70k, CDI.',
                'Commerciale B2B pour rejoindre une PME industrielle de 80 personnes à Lyon. Profil chasseur, 3 ans minimum, fixe + variable attractif.',
                'RH généraliste pour PME e-commerce en full remote, équipe soudée de 12, management bienveillant, premier RH de la boîte.',
              ].map((ex, i) => (
                <button
                  key={i}
                  onClick={() => setAiPrompt(ex)}
                  className="block w-full text-left text-xs text-muted hover:text-primary py-1.5 border-b border-border last:border-0 hover:bg-bg transition-all px-1"
                >
                  → {ex}
                </button>
              ))}
            </div>

            <Field label="Décrivez votre besoin de recrutement" required>
              <textarea
                className={TEXTAREA_CLS}
                rows={4}
                placeholder="Ex : Je recrute un(e) développeur(se) fullstack pour mon équipe tech de 8 personnes, startup SaaS à Montpellier, CDI, management horizontal, salaire 45-60k…"
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
              />
            </Field>

            {aiError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                <p className="text-sm text-red-700">{aiError}</p>
              </div>
            )}

            <button
              onClick={generateWithAI}
              disabled={aiLoading || aiPrompt.trim().length < 15}
              className="w-full py-3 rounded-btn bg-teal text-primary font-bold text-sm hover:opacity-90 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {aiLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  Génération en cours…
                </>
              ) : (
                '✨ Générer ma fiche de poste'
              )}
            </button>

            <p className="text-xs text-muted text-center mt-3">
              Alimenté par Groq IA (Llama 3.3 70B) · La fiche générée reste entièrement modifiable
            </p>
          </div>
        )}

        {/* Manual form — sections */}
        {mode === 'manual' && (
          <>
            {/* Section navigator */}
            <div className="bg-card border border-border rounded-xl p-1.5 flex gap-1 mb-6 overflow-x-auto">
              {SECTIONS.map((s, i) => (
                <button
                  key={s.label}
                  onClick={() => setActiveSection(i)}
                  className={`flex-1 min-w-fit py-2 px-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    activeSection === i ? 'bg-primary text-white' : 'text-muted hover:text-primary'
                  }`}
                >
                  {s.icon} {s.label}
                </button>
              ))}
            </div>

            {/* Completion bar */}
            <div className="bg-card border border-border rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-muted">Complétude de la fiche</span>
                <span className="text-sm font-bold text-teal">{completionPct}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${completionPct}%`, background: 'linear-gradient(90deg, #09C4A0, #23B574)' }}
                />
              </div>
            </div>

            {/* Section 0 — Informations générales */}
            {activeSection === 0 && (
              <SectionCard title="Informations générales" icon="📋">
                <Field label="Intitulé du poste" required>
                  <input className={INPUT_CLS} placeholder="Ex : Développeur(se) React Senior, Commerciale B2B…" value={form.title} onChange={set('title')} />
                </Field>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Localisation" required>
                    <input className={INPUT_CLS} placeholder="Ex : Paris, Lyon, Full remote…" value={form.location} onChange={set('location')} />
                  </Field>
                  <Field label="Type de contrat" required>
                    <select className={INPUT_CLS} value={form.contractType} onChange={set('contractType')}>
                      <option value="">Sélectionner…</option>
                      {CONTRACT_TYPES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </Field>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Salaire annuel brut — minimum" hint="En euros, sans espaces. Ex : 45000">
                    <input className={INPUT_CLS} type="number" placeholder="45000" value={form.salaryMin} onChange={set('salaryMin')} />
                  </Field>
                  <Field label="Salaire annuel brut — maximum">
                    <input className={INPUT_CLS} type="number" placeholder="55000" value={form.salaryMax} onChange={set('salaryMax')} />
                  </Field>
                </div>
                <div className="flex justify-end mt-2">
                  <button onClick={() => setActiveSection(1)} className="px-6 py-2.5 rounded-btn bg-primary text-white text-sm font-bold hover:opacity-90 transition-all">
                    Suivant →
                  </button>
                </div>
              </SectionCard>
            )}

            {/* Section 1 — Description */}
            {activeSection === 1 && (
              <SectionCard title="Description du poste" icon="📝">
                <Field
                  label="Missions & contexte"
                  required
                  hint="Décrivez les missions principales, le contexte de l'entreprise et l'impact du poste. 3 à 5 phrases recommandées."
                >
                  <textarea
                    className={TEXTAREA_CLS}
                    rows={7}
                    placeholder="Ex : Intégré(e) à notre équipe produit de 8 personnes, vous serez responsable du développement et de la maintenance de nos applications React. Vous travaillerez en étroite collaboration avec les designers et les product managers pour livrer des expériences utilisateur de qualité…"
                    value={form.description}
                    onChange={set('description')}
                  />
                </Field>
                <div className="flex justify-between mt-2">
                  <button onClick={() => setActiveSection(0)} className="px-5 py-2.5 rounded-btn border border-border text-muted text-sm font-semibold hover:bg-bg transition-all">← Retour</button>
                  <button onClick={() => setActiveSection(2)} className="px-6 py-2.5 rounded-btn bg-primary text-white text-sm font-bold hover:opacity-90 transition-all">Suivant →</button>
                </div>
              </SectionCard>
            )}

            {/* Section 2 — Attentes */}
            {activeSection === 2 && (
              <SectionCard title="Attentes & compétences requises" icon="✅">
                <Field
                  label="Profil recherché"
                  hint="Listez les compétences, l'expérience et les qualités attendues. Une par ligne, commencez chaque ligne par un tiret."
                >
                  <textarea
                    className={TEXTAREA_CLS}
                    rows={8}
                    placeholder="- 3+ ans d'expérience en développement React&#10;- Maîtrise de TypeScript et des bonnes pratiques&#10;- Expérience avec des APIs REST / GraphQL&#10;- Capacité à travailler en autonomie&#10;- Sens du détail et de la qualité du code&#10;- Bon niveau de communication écrite"
                    value={form.expectations}
                    onChange={set('expectations')}
                  />
                </Field>
                <div className="bg-teal-light border border-teal/20 rounded-xl p-3 mb-4">
                  <p className="text-xs text-primary">
                    <strong>Conseil :</strong> Distinguez le <em>must-have</em> (indispensable) du <em>nice-to-have</em>. Une liste de 5 à 8 critères est idéale pour ne pas décourager les bons profils.
                  </p>
                </div>
                <div className="flex justify-between mt-2">
                  <button onClick={() => setActiveSection(1)} className="px-5 py-2.5 rounded-btn border border-border text-muted text-sm font-semibold hover:bg-bg transition-all">← Retour</button>
                  <button onClick={() => setActiveSection(3)} className="px-6 py-2.5 rounded-btn bg-primary text-white text-sm font-bold hover:opacity-90 transition-all">Suivant →</button>
                </div>
              </SectionCard>
            )}

            {/* Section 3 — Équipe */}
            {activeSection === 3 && (
              <SectionCard title="Profil de l'équipe" icon="👥">
                <Field
                  label="Composition & culture de l'équipe"
                  hint="Taille, composition, comment l'équipe travaille au quotidien, valeurs. 2 à 4 phrases."
                >
                  <textarea
                    className={TEXTAREA_CLS}
                    rows={5}
                    placeholder="Ex : Vous rejoindrez une équipe de 5 développeurs et 2 designers, tous passionnés et bienveillants. L'équipe se réunit en daily standup de 15 min chaque matin, travaille en sprints de 2 semaines et valorise la qualité du code sur la vitesse. Bonne humeur et entraide sont nos maîtres mots…"
                    value={form.teamProfile}
                    onChange={set('teamProfile')}
                  />
                </Field>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { label: 'Full remote', icon: '🏠' },
                    { label: 'Hybride 2-3j', icon: '🔄' },
                    { label: 'Sur site', icon: '🏢' },
                  ].map(opt => {
                    const isSelected = form.teamProfile.toLowerCase().includes(opt.label.toLowerCase());
                    return (
                      <button
                        key={opt.label}
                        onClick={() => {
                          if (!form.teamProfile.includes(opt.label)) {
                            setForm(f => ({ ...f, teamProfile: f.teamProfile + (f.teamProfile ? ' ' : '') + opt.label }));
                          }
                        }}
                        className={`py-2 rounded-xl border text-xs font-semibold transition-all ${
                          isSelected ? 'bg-teal-light border-teal text-teal' : 'border-border text-muted hover:bg-bg'
                        }`}
                      >
                        {opt.icon} {opt.label}
                      </button>
                    );
                  })}
                </div>

                <div className="flex justify-between mt-2">
                  <button onClick={() => setActiveSection(2)} className="px-5 py-2.5 rounded-btn border border-border text-muted text-sm font-semibold hover:bg-bg transition-all">← Retour</button>
                  <button onClick={() => setActiveSection(4)} className="px-6 py-2.5 rounded-btn bg-primary text-white text-sm font-bold hover:opacity-90 transition-all">Suivant →</button>
                </div>
              </SectionCard>
            )}

            {/* Section 4 — Management */}
            {activeSection === 4 && (
              <SectionCard title="Style de management" icon="🎯">
                <p className="text-sm text-muted mb-4">
                  Ces informations permettent au matching IA de rapprocher votre poste des candidats qui partagent vos valeurs managériales.
                </p>

                <Field label="Quel style décrit le mieux votre management ?" required>
                  <div className="grid grid-cols-1 gap-2 mt-1">
                    {MANAGEMENT_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setForm(f => ({ ...f, managementStyle: opt.value }))}
                        className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all ${
                          form.managementStyle === opt.value
                            ? 'border-teal bg-teal-light'
                            : 'border-border bg-bg hover:border-teal/40'
                        }`}
                      >
                        <span className="text-xl flex-shrink-0 mt-0.5">{opt.icon}</span>
                        <div>
                          <div className={`text-sm font-bold ${form.managementStyle === opt.value ? 'text-teal' : 'text-primary'}`}>{opt.label}</div>
                          <div className="text-xs text-muted mt-0.5">{opt.description}</div>
                        </div>
                        {form.managementStyle === opt.value && (
                          <span className="ml-auto text-teal font-bold">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                </Field>

                <Field
                  label="Décrivez concrètement votre façon de manager"
                  hint="Optionnel — permet un matching encore plus précis."
                >
                  <textarea
                    className={TEXTAREA_CLS}
                    rows={3}
                    placeholder="Ex : Je fais un point individuel hebdomadaire de 30 min avec chaque membre de l'équipe. Je fixe des objectifs trimestriels clairs et laisse une grande liberté sur la méthode…"
                    value={form.managementDetail}
                    onChange={set('managementDetail')}
                  />
                </Field>

                <div className="flex justify-between mt-2">
                  <button onClick={() => setActiveSection(3)} className="px-5 py-2.5 rounded-btn border border-border text-muted text-sm font-semibold hover:bg-bg transition-all">← Retour</button>
                </div>
              </SectionCard>
            )}
          </>
        )}

        {/* Preview (when form has enough content) */}
        {mode === 'manual' && form.title && form.description && (
          <div className="bg-primary rounded-card p-6 mb-6 border border-primary">
            <h3 className="text-sm font-bold text-white/60 uppercase tracking-widest mb-3">Aperçu de la fiche</h3>
            <div className="bg-white/10 rounded-xl p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold text-white text-sm flex-shrink-0">
                  {companyName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-white">{form.title}</p>
                  <p className="text-white/60 text-xs">{companyName}{form.location ? ` · ${form.location}` : ''}{form.contractType ? ` · ${form.contractType}` : ''}</p>
                </div>
                {form.salaryMin && (
                  <div className="ml-auto text-teal font-bold text-sm">
                    {parseInt(form.salaryMin).toLocaleString('fr-FR')}€{form.salaryMax ? `–${parseInt(form.salaryMax).toLocaleString('fr-FR')}€` : '+'}
                  </div>
                )}
              </div>
              {form.description && (
                <p className="text-white/70 text-xs leading-relaxed line-clamp-3">{form.description}</p>
              )}
            </div>
          </div>
        )}

        {/* Save actions */}
        <div className="bg-card border border-border rounded-card p-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-primary">
              {!isFormValid
                ? 'Renseignez au minimum le titre et la description pour enregistrer.'
                : `Fiche prête à ${completionPct < 70 ? 'être sauvegardée en brouillon' : 'être publiée'}.`}
            </p>
            {isFormValid && (
              <p className="text-xs text-muted mt-0.5">
                Les candidats verront cette offre uniquement après publication.
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => handleSave('draft')}
              disabled={!isFormValid || saving}
              className="px-5 py-2.5 rounded-btn border border-border text-muted text-sm font-semibold hover:bg-bg transition-all disabled:opacity-40"
            >
              {saving ? '…' : 'Brouillon'}
            </button>
            <button
              onClick={() => handleSave('published')}
              disabled={!isFormValid || saving}
              className="px-6 py-2.5 rounded-btn bg-teal text-primary font-bold text-sm hover:opacity-90 transition-all disabled:opacity-40"
            >
              {saving ? 'Publication…' : '🚀 Publier'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
