import { useState, useEffect } from 'react';
import type { PageName, Candidate } from './types';
import { Navbar } from './components/Navbar';
import { Landing } from './pages/Landing';
import { RecruteurDashboard } from './pages/RecruteurDashboard';
import { CompteRendu } from './pages/CompteRendu';
import { CandidatDashboard } from './pages/CandidatDashboard';
import { CandidatProfil } from './pages/CandidatProfil';
import { CandidatAvancement } from './pages/CandidatAvancement';

export default function App() {
  const [page, setPage] = useState<PageName>('landing');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [page]);

  return (
    <div className="min-h-screen bg-bg font-sans">
      <Navbar page={page} setPage={setPage} />
      {page === 'landing' && <Landing setPage={setPage} />}
      {page === 'recruteur' && (
        <RecruteurDashboard
          setPage={setPage}
          setSelectedCandidate={setSelectedCandidate}
        />
      )}
      {page === 'compte-rendu' && (
        <CompteRendu candidate={selectedCandidate} setPage={setPage} />
      )}
      {page === 'candidat' && <CandidatDashboard setPage={setPage} />}
      {page === 'candidat-profil' && <CandidatProfil setPage={setPage} />}
      {page === 'candidat-avancement' && (
        <CandidatAvancement setPage={setPage} />
      )}
    </div>
  );
}
