import { useState } from 'react';
import { candidates } from '../data/candidates';
import type { Candidate, PageName } from '../types';
import { Avatar } from '../components/Avatar';
import { ScoreBadge } from '../components/ScoreBadge';
import { StatusBadge } from '../components/StatusBadge';

interface RecruteurDashboardProps {
  setPage: (p: PageName) => void;
  setSelectedCandidate: (c: Candidate) => void;
}

const FILTERS = ['Tous', 'Retenu', 'À examiner', 'En cours', 'Entretien planifié', 'Refusé'];

function scoreColor(score: number) {
  if (score >= 85) return '#09C4A0';
  if (score >= 70) return '#D48A12';
  return '#C0392B';
}

export function RecruteurDashboard({
  setPage,
  setSelectedCandidate,
}: RecruteurDashboardProps) {
  const [activeFilter, setActiveFilter] = useState('Tous');
  const [sortBy, setSortBy] = useState<'score' | 'date'>('score');

  const filtered = candidates
    .filter(c => activeFilter === 'Tous' || c.status === activeFilter)
    .sort((a, b) => {
      if (sortBy === 'score') return b.score - a.score;
      return b.id - a.id;
    });

  const stats = [
    { icon: '📋', value: candidates.length, label: 'Candidatures reçues', color: '#09C4A0' },
    {
      icon: '🎯',
      value: `${Math.round(candidates.reduce((s, c) => s + c.score, 0) / candidates.length)}%`,
      label: 'Compatibilité moyenne',
      color: '#6851C7',
    },
    {
      icon: '⏳',
      value: candidates.filter(c => c.status === 'À examiner').length,
      label: 'À examiner',
      color: '#D48A12',
    },
    {
      icon: '✅',
      value: candidates.filter(c => c.status === 'Retenu').length,
      label: 'Profils retenus',
      color: '#23B574',
    },
  ];

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-primary tracking-tight">
            Tableau de bord Recruteur
          </h1>
          <p className="text-muted text-sm mt-1">
            Gérez vos candidatures et analysez les compatibilités
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {stats.map(s => (
            <div
              key={s.label}
              className="bg-card rounded-card border border-border p-5"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xl">{s.icon}</span>
                <span
                  className="text-2xl font-extrabold"
                  style={{ color: s.color }}
                >
                  {s.value}
                </span>
              </div>
              <div className="text-xs text-muted font-medium">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters + Sort */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  activeFilter === f
                    ? 'bg-primary text-white border-primary'
                    : 'bg-transparent border-border text-muted hover:bg-bg'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as 'score' | 'date')}
            className="text-sm border border-border rounded-btn px-3 py-1.5 bg-card text-primary focus:outline-none focus:border-teal"
          >
            <option value="score">Par score</option>
            <option value="date">Par date</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-card rounded-card border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">
                  Candidat
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">
                  Poste
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider hidden md:table-cell">
                  Date
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">
                  Score
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider hidden lg:table-cell">
                  Hard Skills
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider hidden lg:table-cell">
                  Management
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr
                  key={c.id}
                  onClick={() => {
                    setSelectedCandidate(c);
                    setPage('compte-rendu');
                  }}
                  className="border-b border-border hover:bg-bg cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar
                        initials={c.initials}
                        color={c.avatarColor}
                        size={36}
                      />
                      <span className="font-semibold text-primary">
                        {c.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted">{c.role}</td>
                  <td className="px-4 py-3 text-muted hidden md:table-cell">
                    {c.applied}
                  </td>
                  <td className="px-4 py-3">
                    <ScoreBadge score={c.score} />
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${c.skills}%`,
                            backgroundColor: scoreColor(c.skills),
                          }}
                        />
                      </div>
                      <span className="text-xs text-muted">{c.skills}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${c.management}%`,
                            backgroundColor: scoreColor(c.management),
                          }}
                        />
                      </div>
                      <span className="text-xs text-muted">
                        {c.management}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      status={c.status}
                      color={c.statusColor}
                      bg={c.statusBg}
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-muted hover:text-primary transition-colors">
                      →
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-muted">
              Aucun candidat pour ce filtre.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
