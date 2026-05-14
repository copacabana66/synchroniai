import { useState, useEffect } from 'react';
import type { PageName, Candidate, AuthUser } from './types';
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

const NO_NAVBAR: PageName[] = ['login', 'pricing', 'register'];

export default function App() {
  const [page, setPage]                       = useState<PageName>('landing');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [user, setUser]                       = useState<AuthUser | null>(null);
  const [planChoice, setPlanChoice]           = useState<'recruteur' | 'candidat' | null>(null);

  useEffect(() => { window.scrollTo(0, 0); }, [page]);

  // Guard: pages protégées nécessitent d'être connecté
  function navigateTo(p: PageName) {
    const protected_pages: PageName[] = ['recruteur', 'compte-rendu', 'candidat', 'candidat-profil', 'candidat-avancement'];
    if (protected_pages.includes(p) && !user) {
      setPage('login');
      return;
    }
    setPage(p);
  }

  function handleLogout() {
    setUser(null);
    setPage('landing');
  }

  const showNavbar = !NO_NAVBAR.includes(page);

  return (
    <div className="min-h-screen bg-bg font-sans">
      {showNavbar && (
        <Navbar page={page} setPage={navigateTo} user={user} onLogout={handleLogout} />
      )}

      {page === 'landing'   && <Landing setPage={navigateTo} />}
      {page === 'login'     && <Login setPage={setPage} setUser={setUser} />}
      {page === 'pricing'   && <Pricing setPage={setPage} setPlanChoice={setPlanChoice} />}
      {page === 'register'  && <Register setPage={setPage} setUser={setUser} planChoice={planChoice} />}

      {page === 'recruteur' && (
        <RecruteurDashboard
          setPage={navigateTo}
          setSelectedCandidate={setSelectedCandidate}
        />
      )}
      {page === 'compte-rendu' && (
        <CompteRendu candidate={selectedCandidate} setPage={navigateTo} />
      )}
      {page === 'candidat'           && <CandidatDashboard setPage={navigateTo} />}
      {page === 'candidat-profil'    && <CandidatProfil setPage={navigateTo} />}
      {page === 'candidat-avancement'&& <CandidatAvancement setPage={navigateTo} />}
    </div>
  );
}
