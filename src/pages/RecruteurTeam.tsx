import { useState } from 'react';
import type { PageName } from '../types';
import { saveTeam, updateTeamAnalysis, type TeamMember, type CollectiveDNA, type MissingProfile } from '../lib/teamService';

interface Props {
  setPage: (p: PageName) => void;
  recruiterId: string;
}

const COMMON_TRAITS = [
  'Méthodique', 'Créatif', 'Empathique', 'Pragmatique', 'Visionnaire',
  'Analytique', 'Spontané', 'Diplomate', 'Audacieux', 'Persévérant',
  'Curieux', 'Indépendant', 'Collaboratif', 'Précis', 'Adaptable',
];

function emptyMember(): TeamMember {
  return { id: crypto.randomUUID(), name: '', role: '', description: '', traits: [] };
}

export function RecruteurTeam({ setPage, recruiterId }: Props) {
  const [step, setStep]                   = useState<'setup' | 'members' | 'result'>('setup');
  const [teamName, setTeamName]           = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  const [members, setMembers]             = useState<TeamMember[]>([emptyMember()]);
  const [activeIdx, setActiveIdx]         = useState(0);
  const [analyzing, setAnalyzing]         = useState(false);
  const [dna, setDna]                     = useState<CollectiveDNA | null>(null);
  const [missing, setMissing]             = useState<MissingProfile | null>(null);
  const [error, setError]                 = useState<string | null>(null);

  function updateMember(idx: number, patch: Partial<TeamMember>) {
    setMembers(ms => ms.map((m, i) => i === idx ? { ...m, ...patch } : m));
  }

  function toggleTrait(idx: number, trait: string) {
    const m = members[idx];
    const has = m.traits.includes(trait);
    if (has) {
      updateMember(idx, { traits: m.traits.filter(t => t !== trait) });
    } else if (m.traits.length < 5) {
      updateMember(idx, { traits: [...m.traits, trait] });
    }
  }

  function addMember() {
    setMembers(ms => [...ms, emptyMember()]);
    setActiveIdx(members.length);
  }

  function removeMember(idx: number) {
    if (members.length === 1) return;
    setMembers(ms => ms.filter((_, i) => i !== idx));
    setActiveIdx(Math.max(0, activeIdx - 1));
  }

  async function runAnalysis() {
    setError(null);
    const validMembers = members.filter(m => m.name.trim() && m.role.trim());
    if (validMembers.length === 0) {
      setError('Ajoutez au moins un membre avec un nom et un rôle.');
      return;
    }

    setAnalyzing(true);
    try {
      const res = await fetch('/api/analyze-team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamName, teamDescription, members: validMembers,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }
      const data = await res.json() as { collectiveDna: CollectiveDNA; missingProfile: MissingProfile };
      setDna(data.collectiveDna);
      setMissing(data.missingProfile);

      // Sauvegarde Supabase
      if (recruiterId) {
        const saved = await saveTeam(recruiterId, {
          team_name: teamName,
          team_description: teamDescription,
          team_members: validMembers,
        });
        if (saved?.id) {
          await updateTeamAnalysis(saved.id, data.collectiveDna, data.missingProfile);
        }
      }
      setStep('result');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError("L'analyse de l'équipe a échoué : " + msg);
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg mesh-bg">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <button onClick={() => setPage('recruteur')} className="mb-6 flex items-center gap-2 text-muted border border-border rounded-btn px-4 py-2 text-sm hover:bg-card transition-all bg-white">
          ← Retour au tableau de bord
        </button>

        <div className="mb-6 animate-fade-up opacity-0-init" style={{ animationFillMode: 'forwards' }}>
          <span className="pill-glow inline-block text-xs font-semibold text-teal-deep px-3 py-1 rounded-full mb-3">
            ✨ Avant de publier une fiche de poste
          </span>
          <h1 className="text-h1 text-primary mb-2">L'ADN de votre équipe</h1>
          <p className="text-ink text-sm max-w-xl">
            Décrivez vos collaborateurs en place. Synchroni identifie votre profil collectif et
            le candidat qui complétera vraiment votre équipe — pas un clone de plus.
          </p>
        </div>

        {step === 'setup' && (
          <div className="card-premium p-8 animate-fade-up opacity-0-init" style={{ animationFillMode: 'forwards' }}>
            <h2 className="text-h2 text-primary mb-6">Étape 1 — Présentez votre équipe</h2>

            <label className="block text-sm font-semibold text-primary mb-1.5">Nom de l'équipe / département <span className="text-coral">*</span></label>
            <input
              type="text" value={teamName} onChange={e => setTeamName(e.target.value)}
              placeholder="Équipe produit, Cellule data, Pôle commercial…"
              className="w-full border border-border rounded-btn bg-bg px-4 py-2.5 text-sm text-primary focus:outline-none focus:border-teal focus:ring-2 focus:ring-teal/20 transition-all mb-4"
            />

            <label className="block text-sm font-semibold text-primary mb-1.5">Contexte de l'équipe</label>
            <textarea
              value={teamDescription} onChange={e => setTeamDescription(e.target.value)}
              placeholder="Mission, taille, ancienneté, projets en cours… Tout ce qui aide à comprendre votre quotidien."
              rows={4}
              className="w-full border border-border rounded-btn bg-bg px-4 py-2.5 text-sm text-primary focus:outline-none focus:border-teal focus:ring-2 focus:ring-teal/20 transition-all mb-6 resize-none"
            />

            <button
              onClick={() => { if (teamName.trim()) setStep('members'); else setError('Donnez un nom à votre équipe.'); }}
              disabled={!teamName.trim()}
              className="btn-primary w-full disabled:opacity-40"
            >
              Continuer → décrire les membres
            </button>
            {error && <p className="text-coral text-xs mt-3">{error}</p>}
          </div>
        )}

        {step === 'members' && (
          <div className="animate-fade-up opacity-0-init" style={{ animationFillMode: 'forwards' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-h2 text-primary">Étape 2 — Vos collaborateurs</h2>
              <span className="text-xs text-muted">{members.length} membre{members.length > 1 ? 's' : ''}</span>
            </div>

            {/* Onglets membres */}
            <div className="flex flex-wrap gap-2 mb-5">
              {members.map((m, i) => (
                <button
                  key={m.id}
                  onClick={() => setActiveIdx(i)}
                  className={`px-3 py-1.5 rounded-pill text-xs font-semibold border transition-all ${
                    activeIdx === i ? 'bg-primary text-white border-primary' : 'border-border bg-white text-muted hover:border-teal'
                  }`}
                >
                  {m.name || `Membre ${i + 1}`}
                </button>
              ))}
              <button
                onClick={addMember}
                className="px-3 py-1.5 rounded-pill text-xs font-semibold border border-dashed border-teal text-teal hover:bg-teal-light transition-all"
              >
                + Ajouter
              </button>
            </div>

            {/* Carte membre actif */}
            {members[activeIdx] && (() => {
              const m = members[activeIdx];
              return (
                <div className="card-premium p-6 mb-4">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-bold text-primary">Membre {activeIdx + 1}</h3>
                    {members.length > 1 && (
                      <button onClick={() => removeMember(activeIdx)} className="text-xs text-coral hover:underline">Retirer</button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-semibold text-primary mb-1">Prénom / Pseudo</label>
                      <input
                        value={m.name} onChange={e => updateMember(activeIdx, { name: e.target.value })}
                        placeholder="Camille, Sami, Léa…"
                        className="w-full border border-border rounded-btn bg-bg px-3 py-2 text-sm text-primary focus:outline-none focus:border-teal"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-primary mb-1">Rôle / Fonction</label>
                      <input
                        value={m.role} onChange={e => updateMember(activeIdx, { role: e.target.value })}
                        placeholder="Product Owner, Lead dev, Designer…"
                        className="w-full border border-border rounded-btn bg-bg px-3 py-2 text-sm text-primary focus:outline-none focus:border-teal"
                      />
                    </div>
                  </div>

                  <label className="block text-xs font-semibold text-primary mb-1">Comment travaille cette personne ? (2-3 phrases)</label>
                  <textarea
                    value={m.description} onChange={e => updateMember(activeIdx, { description: e.target.value })}
                    placeholder="Très organisée, anticipe les blocages, communique en écrit, préfère les tâches longues sans interruption…"
                    rows={3}
                    className="w-full border border-border rounded-btn bg-bg px-3 py-2 text-sm text-primary focus:outline-none focus:border-teal resize-none mb-4"
                  />

                  <label className="block text-xs font-semibold text-primary mb-2">
                    Ses traits dominants ({m.traits.length}/5)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {COMMON_TRAITS.map(t => {
                      const active = m.traits.includes(t);
                      const disabled = !active && m.traits.length >= 5;
                      return (
                        <button
                          key={t}
                          onClick={() => toggleTrait(activeIdx, t)}
                          disabled={disabled}
                          className={`px-3 py-1.5 rounded-pill text-xs font-medium border transition-all ${
                            active ? 'bg-teal text-white border-teal'
                                   : disabled ? 'border-border text-muted/40 cursor-not-allowed'
                                              : 'border-border text-muted hover:border-teal hover:text-teal'
                          }`}
                        >
                          {t}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {error && <p className="text-coral text-xs mb-3 text-center">{error}</p>}

            <div className="flex gap-3 sticky bottom-4 bg-white/80 backdrop-blur-md p-3 rounded-card border border-border shadow-soft">
              <button onClick={() => setStep('setup')} className="px-4 py-2.5 rounded-btn border border-border text-sm text-muted hover:bg-bg">← Étape précédente</button>
              <button
                onClick={runAnalysis}
                disabled={analyzing}
                className="btn-primary flex-1 disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {analyzing ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" /> Analyse en cours…</>
                ) : (
                  <>🧬 Révéler l'ADN de mon équipe</>
                )}
              </button>
            </div>
          </div>
        )}

        {step === 'result' && dna && missing && (
          <div className="space-y-5 animate-fade-up opacity-0-init" style={{ animationFillMode: 'forwards' }}>
            {/* ADN collectif */}
            <div className="card-premium p-7 grain">
              <span className="pill-glow inline-block text-xs font-bold text-teal-deep px-3 py-1 rounded-full mb-4">🧬 ADN COLLECTIF</span>
              <h2 className="text-h2 text-primary mb-2">Voici votre équipe en un coup d'œil</h2>

              <div className="flex flex-wrap gap-2 my-4">
                {dna.dominantTraits.map((t, i) => (
                  <span key={t} className="text-sm font-semibold text-primary bg-teal-light border border-teal/20 px-3 py-1.5 rounded-pill animate-fade-up opacity-0-init" style={{ animationDelay: `${i * 70}ms`, animationFillMode: 'forwards' }}>
                    {t}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
                <div className="bg-bg rounded-card p-4">
                  <div className="text-xs font-bold text-muted uppercase tracking-wider mb-2">💬 Communication</div>
                  <p className="text-sm text-primary leading-snug">{dna.communicationStyle}</p>
                </div>
                <div className="bg-bg rounded-card p-4">
                  <div className="text-xs font-bold text-muted uppercase tracking-wider mb-2">🎯 Décision</div>
                  <p className="text-sm text-primary leading-snug">{dna.decisionMode}</p>
                </div>
                <div className="bg-bg rounded-card p-4">
                  <div className="text-xs font-bold text-muted uppercase tracking-wider mb-2">⚡ Rythme</div>
                  <p className="text-sm text-primary leading-snug">{dna.pace}</p>
                </div>
              </div>

              <div className="mt-5">
                <div className="text-xs font-bold text-muted uppercase tracking-wider mb-2">Valeurs partagées</div>
                <div className="flex flex-wrap gap-2">
                  {dna.values.map(v => (
                    <span key={v} className="text-xs bg-violet-light text-violet px-2.5 py-1 rounded-pill font-medium">{v}</span>
                  ))}
                </div>
              </div>

              {dna.blindSpots?.length > 0 && (
                <div className="mt-5 p-4 bg-coral-light border border-coral/20 rounded-card">
                  <div className="text-xs font-bold text-coral uppercase tracking-wider mb-2">⚠ Angles morts identifiés</div>
                  <ul className="text-sm text-primary space-y-1">
                    {dna.blindSpots.map(s => (<li key={s}>• {s}</li>))}
                  </ul>
                </div>
              )}
            </div>

            {/* Profil manquant */}
            <div className="card-premium p-7 bg-gradient-to-br from-white to-teal-light/40">
              <span className="text-xs font-bold text-coral uppercase tracking-wider">🎯 La personne qui vous manque</span>
              <h2 className="text-h2 text-primary mt-2 mb-1">{missing.type}</h2>
              <p className="text-sm text-ink mb-5">{missing.description}</p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
                {missing.keyStrengths.map(s => (
                  <div key={s} className="text-center px-3 py-2 bg-white border border-teal/20 rounded-card text-sm font-semibold text-teal-deep">
                    {s}
                  </div>
                ))}
              </div>

              <div className="p-4 bg-white/60 rounded-card border border-border">
                <div className="text-xs font-bold text-muted uppercase tracking-wider mb-1">Pourquoi ce profil ?</div>
                <p className="text-sm text-primary">{missing.whyNeeded}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button onClick={() => setStep('members')} className="px-5 py-2.5 rounded-btn border border-border text-sm text-muted hover:bg-bg bg-white">
                ↺ Modifier l'équipe
              </button>
              <button
                onClick={() => setPage('recruteur-fiche-poste')}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                Créer la fiche de poste basée sur ce profil →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
