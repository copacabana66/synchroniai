import { useEffect, useState } from 'react';
import type { PageName, JobPosting } from '../types';
import { fetchMyApplications, STATUS_LABEL, STATUS_COLOR, type Application } from '../lib/applicationsService';
import { fetchJobPostings } from '../lib/jobPostingService';
import { ApplicationTimeline } from '../components/ApplicationTimeline';

interface Props {
  setPage: (p: PageName) => void;
  userId: string;
}

export function CandidatAvancement({ setPage, userId }: Props) {
  const [apps, setApps]       = useState<Application[]>([]);
  const [jobs, setJobs]       = useState<Record<string, JobPosting>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    (async () => {
      const [myApps, allJobs] = await Promise.all([
        fetchMyApplications(userId),
        fetchJobPostings(),
      ]);
      const jobMap: Record<string, JobPosting> = {};
      for (const j of allJobs) jobMap[j.id] = j;
      setJobs(jobMap);
      setApps(myApps);
      setLoading(false);
    })();
  }, [userId]);

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <button
          onClick={() => setPage('candidat')}
          className="mb-6 flex items-center gap-2 text-muted border border-border rounded-btn px-4 py-2 text-sm hover:bg-card transition-all bg-white"
        >
          ← Retour au tableau de bord
        </button>

        <h1 className="text-h1 text-primary mb-1">Mes candidatures</h1>
        <p className="text-muted text-sm mb-8">
          Suivez l'avancement de chacune de vos candidatures en temps réel.
        </p>

        {loading ? (
          <div className="py-20 text-center text-muted text-sm">Chargement…</div>
        ) : apps.length === 0 ? (
          <div className="bg-card border border-border rounded-card p-10 text-center">
            <div className="text-5xl mb-3 opacity-40">📭</div>
            <p className="text-primary font-semibold mb-1">Aucune candidature pour le moment</p>
            <p className="text-muted text-sm mb-5">Postulez à une offre depuis votre tableau de bord pour démarrer votre suivi.</p>
            <button
              onClick={() => setPage('candidat')}
              className="btn-primary"
            >
              Voir mes offres compatibles →
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {apps.map(app => {
              const job = jobs[app.job_posting_id];
              const colors = STATUS_COLOR[app.status];

              return (
                <div key={app.id} className="bg-card border border-border rounded-card p-6 shadow-soft">
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-primary text-base truncate">
                        {job?.title ?? 'Offre supprimée'}
                      </h3>
                      <p className="text-xs text-muted">
                        {job?.company || 'Entreprise'}{job?.location ? ` · ${job.location}` : ''}
                        {app.match_score != null && (
                          <span className="ml-2">· Match : <strong className="text-teal">{app.match_score}%</strong></span>
                        )}
                      </p>
                    </div>
                    <span
                      className="text-xs font-bold px-3 py-1.5 rounded-pill flex-shrink-0"
                      style={{ background: colors.bg, color: colors.fg }}
                    >
                      {STATUS_LABEL[app.status]}
                    </span>
                  </div>

                  <ApplicationTimeline status={app.status} />

                  <div className="mt-4 pt-4 border-t border-border flex flex-wrap items-center gap-3 justify-between">
                    <span className="text-[11px] text-muted">
                      Envoyée le {new Date(app.applied_at!).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                    {app.candidate_message && (
                      <details className="text-xs">
                        <summary className="text-teal font-semibold cursor-pointer hover:underline">
                          Voir mon message
                        </summary>
                        <p className="mt-2 p-3 bg-bg rounded border-l-2 border-teal italic text-primary max-w-md">
                          « {app.candidate_message} »
                        </p>
                      </details>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
