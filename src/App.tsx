import { useState, useEffect } from 'react';
import type { PageName, Candidate, AuthUser, AnalysisStatus } from './types';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Pricing } from './pages/Pricing';
import { Register } from './pages/Register';
import { RecruteurDashboard } from './pages/RecruteurDashboard';
import { CompteRendu } from './pages/CompteRendu';
import { CandidatDashboard } from './pages/CandidatDashboard';
import { CandidatProfil } from './pages/CandidatProfil';
import { CandidatAvancement } from './pages/CandidatAvancement';
import { CandidatTest } from './pages/CandidatTest';
import { RecruteurFichePoste } from './pages/RecruteurFichePoste';
import { RecruteurTeam } from './pages/RecruteurTeam';
import { getSession, onAuthChange, authSignOut } from './lib/auth';
import { loadAnalysisStatus } from './lib/candidateService';

const NO_NAVBAR: PageName[] = ['login', 'pricing', 'register'];
const EMPTY_ANALYSIS: AnalysisStatus = { cv: false, questionnaire: false, video: false };

export default function App() {
  const [page, setPage]                           = useState<PageName>('landing');
  const [selectedCandidate] = useState<Candidate | null>(null);
  const [user, setUser]                           = useState<AuthUser | null>(null);
  const [planChoice, setPlanChoice]               = useState<'recruteur' | 'candidat' | null>(null);
  const [analysis, setAnalysis]                   = useState<AnalysisStatus>(EMPTY_ANALYSIS);
  const [sessionLoading, setSessionLoading]       = useState(true);

  // Restore session on mount
  useEffect(() => {
    getSession().then(async u => {
      if (u) {
        setUser(u);
        // Candidat : recharge son analyse complète depuis Supabase
        if (u.role === 'candidat') {
          const status = await loadAnalysisStatus(u.id);
          setAnalysis(status);
        }
      }
      setSessionLoading(false);
    });
    // Listen for auth state changes (tab refocus, token refresh, logout from another tab)
    const unsub = onAuthChange(u => setUser(u));
    return unsub;
  }, []);

  useEffect(() => { window.scrollTo(0, 0); }, [page]);

  async function handleSetUser(u: AuthUser) {
    setUser(u);
    // À la connexion / inscription, recharge tout de suite l'analyse existante
    if (u.role === 'candidat') {
      const status = await loadAnalysisStatus(u.id);
      setAnalysis(status);
    } else {
      setAnalysis(EMPTY_ANALYSIS);
    }
  }

  function handleAnalysisComplete(steps: AnalysisStatus) {
    setAnalysis(steps);
  }

  function navigateTo(p: PageName) {
    const protected_pages: PageName[] = [
      'recruteur', 'recruteur-team', 'recruteur-fiche-poste', 'compte-rendu',
      'candidat', 'candidat-profil', 'candidat-avancement', 'candidat-test',
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

  // Sidebar visible uniquement quand connecté ET dans l'app (pas landing/auth/pricing)
  const APP_PAGES: PageName[] = [
    'recruteur', 'recruteur-team', 'recruteur-fiche-poste', 'compte-rendu',
    'candidat', 'candidat-profil', 'candidat-avancement', 'candidat-test',
  ];
  const showSidebar = !!user && APP_PAGES.includes(page);
  const showNavbar  = !showSidebar && !NO_NAVBAR.includes(page);
  const analysisComplete = analysis.cv && analysis.questionnaire;

  const pageContent = (
    <>
      {page === 'landing'    && <Landing setPage={navigateTo} />}
      {page === 'login'      && <Login setPage={setPage} setUser={handleSetUser} />}
      {page === 'pricing'    && <Pricing setPage={setPage} setPlanChoice={setPlanChoice} />}
      {page === 'register'   && <Register setPage={setPage} setUser={handleSetUser} planChoice={planChoice} />}

      {page === 'recruteur' && (
        <RecruteurDashboard setPage={navigateTo} userId={user?.id ?? ''} />
      )}
      {page === 'compte-rendu' && (
        <CompteRendu candidate={selectedCandidate} setPage={navigateTo} />
      )}
      {page === 'candidat' && (
        <CandidatDashboard
          setPage={navigateTo}
          analysisComplete={analysisComplete}
          analysis={analysis}
          userId={user?.id ?? ''}
        />
      )}
      {page === 'candidat-test' && (
        <CandidatTest
          setPage={navigateTo}
          userId={user?.id ?? ''}
          onComplete={(data) => setAnalysis(a => ({ ...a, assessment: true, assessmentData: data }))}
        />
      )}
      {page === 'candidat-profil' && (
        <CandidatProfil
          setPage={navigateTo}
          userId={user?.id ?? ''}
          onAnalysisComplete={handleAnalysisComplete}
        />
      )}
      {page === 'candidat-avancement' && (
        <CandidatAvancement setPage={navigateTo} userId={user?.id ?? ''} />
      )}
      {page === 'recruteur-team' && (
        <RecruteurTeam setPage={navigateTo} recruiterId={user?.id ?? ''} />
      )}
      {page === 'recruteur-fiche-poste' && (
        <RecruteurFichePoste
          setPage={navigateTo}
          recruiterId={user?.id ?? ''}
          companyName={user?.name ?? 'Mon entreprise'}
        />
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-bg font-sans">
      {showNavbar && (
        <Navbar page={page} setPage={navigateTo} user={user} onLogout={handleLogout} />
      )}

      {showSidebar && user ? (
        <div className="flex min-h-screen">
          <Sidebar page={page} setPage={navigateTo} user={user} onLogout={handleLogout} />
          <main className="flex-1 min-w-0">{pageContent}</main>
        </div>
      ) : (
        pageContent
      )}
    </div>
  );
}
