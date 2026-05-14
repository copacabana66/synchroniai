import { useState, useEffect } from 'react';
import type { PageName, Candidate, AuthUser, AnalysisStatus } from './types';
import { Navbar } from './components/Navbar';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Pricing } from './pages/Pricing';
import { Register } from './pages/Register';
import { RecruteurDashboard } from './pages/RecruteurDashboard';
import { CompteRendu } from './pages/CompteRendu';
import { CandidatDashboard } from './pages/CandidatDashboard';
import { CandidatProfil } from './pages/CandidatProfil';
import { CandidatAvancement } from './pages/CandidatAvancement';
import { RecruteurFichePoste } from './pages/RecruteurFichePoste';
import { getSession, onAuthChange, authSignOut } from './lib/auth';

const NO_NAVBAR: PageName[] = ['login', 'pricing', 'register'];
const EMPTY_ANALYSIS: AnalysisStatus = { cv: false, questionnaire: false, video: false };

export default function App() {
  const [page, setPage]                           = useState<PageName>('landing');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [user, setUser]                           = useState<AuthUser | null>(null);
  const [planChoice, setPlanChoice]               = useState<'recruteur' | 'candidat' | null>(null);
  const [analysis, setAnalysis]                   = useState<AnalysisStatus>(EMPTY_ANALYSIS);
  const [sessionLoading, setSessionLoading]       = useState(true);

  // Restore session on mount
  useEffect(() => {
    getSession().then(u => {
      if (u) setUser(u);
      setSessionLoading(false);
    });
    // Listen for auth state changes (tab refocus, token refresh, logout from another tab)
    const unsub = onAuthChange(u => setUser(u));
    return unsub;
  }, []);

  useEffect(() => { window.scrollTo(0, 0); }, [page]);

  function handleSetUser(u: AuthUser) {
    setUser(u);
    setAnalysis(EMPTY_ANALYSIS);
  }

  function handleAnalysisComplete(steps: AnalysisStatus) {
    setAnalysis(steps);
  }

  function navigateTo(p: PageName) {
    const protected_pages: PageName[] = [
      'recruteur', 'recruteur-fiche-poste', 'compte-rendu',
      'candidat', 'candidat-profil', 'candidat-avancement',
    ];
    if (protected_pages.includes(p) && !user) { setPage('login'); return; }
    setPage(p);
  }

  async function handleLogout() {
    await authSignOut();
    setUser(null);
    setAnalysis(EMPTY_ANALYSIS);
    setPage('landing');
  }

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-teal/20 border-t-teal rounded-full animate-spin" />
      </div>
    );
  }

  const showNavbar = !NO_NAVBAR.includes(page);
  const analysisComplete = analysis.cv && analysis.questionnaire;

  return (
    <div className="min-h-screen bg-bg font-sans">
      {showNavbar && (
        <Navbar page={page} setPage={navigateTo} user={user} onLogout={handleLogout} />
      )}

      {page === 'landing'    && <Landing setPage={navigateTo} />}
      {page === 'login'      && <Login setPage={setPage} setUser={handleSetUser} />}
      {page === 'pricing'    && <Pricing setPage={setPage} setPlanChoice={setPlanChoice} />}
      {page === 'register'   && <Register setPage={setPage} setUser={handleSetUser} planChoice={planChoice} />}

      {page === 'recruteur' && (
        <RecruteurDashboard setPage={navigateTo} setSelectedCandidate={setSelectedCandidate} />
      )}
      {page === 'compte-rendu' && (
        <CompteRendu candidate={selectedCandidate} setPage={navigateTo} />
      )}
      {page === 'candidat' && (
        <CandidatDashboard
          setPage={navigateTo}
          analysisComplete={analysisComplete}
          analysis={analysis}
        />
      )}
      {page === 'candidat-profil' && (
        <CandidatProfil
          setPage={navigateTo}
          userId={user?.id ?? ''}
          onAnalysisComplete={handleAnalysisComplete}
        />
      )}
      {page === 'candidat-avancement' && <CandidatAvancement setPage={navigateTo} />}
      {page === 'recruteur-fiche-poste' && (
        <RecruteurFichePoste
          setPage={navigateTo}
          recruiterId={user?.id ?? ''}
          companyName={user?.name ?? 'Mon entreprise'}
        />
      )}
    </div>
  );
}
