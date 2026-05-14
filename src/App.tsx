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

const NO_NAVBAR: PageName[] = ['login', 'pricing', 'register'];

// Analyse complète pour le compte démo candidat
const DEMO_ANALYSIS: AnalysisStatus = { cv: true, questionnaire: true, video: true };
const EMPTY_ANALYSIS: AnalysisStatus = { cv: false, questionnaire: false, video: false };

export default function App() {
  const [page, setPage]                           = useState<PageName>('landing');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [user, setUser]                           = useState<AuthUser | null>(null);
  const [planChoice, setPlanChoice]               = useState<'recruteur' | 'candidat' | null>(null);
  const [analysis, setAnalysis]                   = useState<AnalysisStatus>(EMPTY_ANALYSIS);

  useEffect(() => { window.scrollTo(0, 0); }, [page]);

  function handleSetUser(u: AuthUser) {
    setUser(u);
    // Compte démo candidat → analyse déjà faite
    if (u.email === 'candidat@demo.fr') {
      setAnalysis(DEMO_ANALYSIS);
    } else {
      setAnalysis(EMPTY_ANALYSIS);
    }
  }

  function handleAnalysisComplete(steps: AnalysisStatus) {
    setAnalysis(steps);
  }

  function navigateTo(p: PageName) {
    const protected_pages: PageName[] = ['recruteur', 'recruteur-fiche-poste', 'compte-rendu', 'candidat', 'candidat-profil', 'candidat-avancement'];
    if (protected_pages.includes(p) && !user) {
      setPage('login');
      return;
    }
    setPage(p);
  }

  function handleLogout() {
    setUser(null);
    setAnalysis(EMPTY_ANALYSIS);
    setPage('landing');
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

      {page === 'recruteur'  && (
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
        <CandidatProfil setPage={navigateTo} onAnalysisComplete={handleAnalysisComplete} />
      )}
      {page === 'candidat-avancement' && <CandidatAvancement setPage={navigateTo} />}
      {page === 'recruteur-fiche-poste' && (
        <RecruteurFichePoste
          setPage={navigateTo}
          recruiterId={user?.email ?? 'anonymous'}
          companyName={user?.name ?? 'Mon entreprise'}
        />
      )}
    </div>
  );
}
