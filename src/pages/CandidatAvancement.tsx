import { useState } from 'react';
import { appSteps, offers } from '../data/offers';
import type { PageName } from '../types';

interface CandidatAvancementProps {
  setPage: (p: PageName) => void;
}

export function CandidatAvancement({ setPage }: CandidatAvancementProps) {
  const [message, setMessage] = useState('');
  const offer = offers[1]; // InnovateSud — En cours

  const miniScores = [
    { label: 'Management', value: 91, color: '#09C4A0' },
    { label: 'Équipe', value: 88, color: '#09C4A0' },
    { label: 'Environnement', value: 85, color: '#09C4A0' },
    { label: 'Communication', value: 79, color: '#D48A12' },
  ];

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <button
          onClick={() => setPage('candidat')}
          className="mb-6 flex items-center gap-2 text-muted border border-border rounded-btn px-4 py-2 text-sm hover:bg-bg transition-all"
        >
          ← Retour
        </button>

        {/* Header */}
        <div className="bg-card rounded-card border border-border p-6 mb-6">
          <div className="flex flex-wrap items-start gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
              style={{ background: offer.accentColor + '26', color: offer.accentColor }}
            >
              {offer.logoInitials}
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-extrabold text-primary tracking-tight">
                {offer.role}
              </h1>
              <p className="text-muted text-sm">
                {offer.company} · {offer.location}
              </p>
            </div>
            <span
              className="text-sm font-bold px-3 py-1 rounded-full"
              style={{
                background: offer.accentColor + '26',
                color: offer.accentColor,
              }}
            >
              {offer.score}%
            </span>
          </div>
        </div>

        {/* Score preview */}
        <div className="bg-teal-light border border-teal/25 rounded-card p-5 mb-6">
          <p className="text-sm font-bold text-primary mb-3">
            Aperçu de compatibilité
          </p>
          <div className="space-y-2">
            {miniScores.map(s => (
              <div key={s.label} className="flex items-center gap-3">
                <span className="text-xs text-muted w-28">{s.label}</span>
                <div className="flex-1 h-1.5 bg-white/60 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${s.value}%`, backgroundColor: s.color }}
                  />
                </div>
                <span
                  className="text-xs font-bold w-8 text-right"
                  style={{ color: s.color }}
                >
                  {s.value}%
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-teal/70 italic mt-3">
            Scores complets disponibles après validation par le recruteur.
          </p>
        </div>

        {/* Timeline */}
        <div className="bg-card rounded-card border border-border p-6 mb-6">
          <h2 className="text-base font-bold text-primary mb-5">
            Avancement de votre candidature
          </h2>
          <div className="relative">
            {appSteps.map((s, i) => (
              <div key={s.label} className="flex gap-4 mb-0">
                {/* Left column: circle + line */}
                <div className="flex flex-col items-center">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 z-10"
                    style={
                      s.done
                        ? { background: '#E8F8EF', color: '#23B574' }
                        : s.active
                        ? { background: '#09C4A0', color: '#fff' }
                        : { background: '#F1F2F4', color: '#6A6B80' }
                    }
                  >
                    {s.done ? '✓' : s.active ? '●' : i + 1}
                  </div>
                  {i < appSteps.length - 1 && (
                    <div
                      className="w-0.5 flex-1 my-1"
                      style={{
                        background: s.done ? '#23B574' : '#E5E7EB',
                        minHeight: 32,
                      }}
                    />
                  )}
                </div>

                {/* Right content */}
                <div className={`flex-1 pb-6 ${i === appSteps.length - 1 ? 'pb-0' : ''}`}>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className={`text-sm font-bold ${
                        s.done
                          ? 'text-success'
                          : s.active
                          ? 'text-primary'
                          : 'text-muted'
                      }`}
                    >
                      {s.label}
                    </span>
                    <span className="text-xs text-muted">{s.date}</span>
                  </div>
                  {s.active ? (
                    <div className="bg-teal-light border border-teal/20 rounded-xl p-3 mt-1">
                      <p className="text-sm text-primary">{s.detail}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-muted">{s.detail}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="bg-card rounded-card border border-border p-6">
          <h2 className="text-base font-bold text-primary mb-4">Messages</h2>
          <div className="bg-bg rounded-xl p-3 mb-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-primary">
                Marie Durand · DRH
              </span>
              <span className="text-xs text-muted">— 14 mai 2026</span>
            </div>
            <p className="text-sm text-primary">
              Bonjour ! Votre profil a retenu notre attention. Seriez-vous
              disponible pour un échange de 30 minutes cette semaine ?
            </p>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Votre message..."
              className="flex-1 border border-border rounded-btn bg-bg px-4 py-2.5 text-sm text-primary focus:outline-none focus:border-teal focus:ring-2 focus:ring-teal/20 transition-all"
            />
            <button
              onClick={() => setMessage('')}
              className="px-5 py-2.5 rounded-btn bg-teal text-primary font-bold text-sm hover:opacity-90 transition-all"
            >
              Envoyer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
