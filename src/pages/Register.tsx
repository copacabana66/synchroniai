import { useState } from 'react';
import type { PageName, AuthUser } from '../types';
import { MatchingLogo } from '../components/MatchingLogo';

interface RegisterProps {
  setPage: (p: PageName) => void;
  setUser: (u: AuthUser) => void;
  planChoice: 'recruteur' | 'candidat' | null;
}

export function Register({ setPage, setUser, planChoice }: RegisterProps) {
  const plan = planChoice ?? 'candidat';
  const isRecruteur = plan === 'recruteur';

  const [name, setName]           = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas.'); return; }
    if (password.length < 8)  { setError('Le mot de passe doit contenir au moins 8 caractères.'); return; }
    setLoading(true);
    setTimeout(() => {
      setUser({ name, email, role: plan });
      setPage(isRecruteur ? 'recruteur' : 'candidat-profil');
      setLoading(false);
    }, 700);
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <button onClick={() => setPage('landing')} className="flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-xl bg-teal flex items-center justify-center">
              <MatchingLogo size={26} color="#1A3E6E" animated={false} />
            </div>
            <span className="font-bold text-xl text-primary tracking-tight">SynchroniAI</span>
          </button>

          {/* Plan badge */}
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-full mb-4 text-sm font-semibold"
            style={isRecruteur
              ? { background: '#FEF0E8', color: '#F06A28' }
              : { background: '#F0F8F5', color: '#09C4A0' }}
          >
            <span>{isRecruteur ? '🏢' : '👤'}</span>
            <span>{isRecruteur ? 'Espace Recruteur — 14j gratuit' : 'Espace Candidat — Gratuit'}</span>
          </div>

          <h1 className="text-2xl font-extrabold text-primary tracking-tight mb-1">Créer mon compte</h1>
          <p className="text-muted text-sm">
            {isRecruteur ? 'Commencez à matcher des profils dès aujourd\'hui.' : 'Trouvez l\'entreprise qui vous correspond.'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-card rounded-card border border-border p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-primary block mb-1.5">
                {isRecruteur ? 'Nom & prénom (ou raison sociale)' : 'Prénom & nom'}
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={isRecruteur ? 'Marie Durand — Entreprise SAS' : 'Sophie Martin'}
                required
                className="w-full border border-border rounded-btn bg-bg px-4 py-2.5 text-sm text-primary focus:outline-none focus:border-teal focus:ring-2 focus:ring-teal/20 transition-all"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-primary block mb-1.5">Email professionnel</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="votre@email.fr"
                required
                className="w-full border border-border rounded-btn bg-bg px-4 py-2.5 text-sm text-primary focus:outline-none focus:border-teal focus:ring-2 focus:ring-teal/20 transition-all"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-primary block mb-1.5">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="8 caractères minimum"
                required
                className="w-full border border-border rounded-btn bg-bg px-4 py-2.5 text-sm text-primary focus:outline-none focus:border-teal focus:ring-2 focus:ring-teal/20 transition-all"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-primary block mb-1.5">Confirmer le mot de passe</label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full border border-border rounded-btn bg-bg px-4 py-2.5 text-sm text-primary focus:outline-none focus:border-teal focus:ring-2 focus:ring-teal/20 transition-all"
              />
            </div>

            {error && (
              <div className="bg-danger-light border border-red-200 rounded-lg px-4 py-2.5 text-sm text-red-700">
                {error}
              </div>
            )}

            <p className="text-xs text-muted">
              En créant un compte, vous acceptez nos{' '}
              <span className="text-teal cursor-pointer hover:underline">Conditions d'utilisation</span>
              {' '}et notre{' '}
              <span className="text-teal cursor-pointer hover:underline">Politique de confidentialité</span>.
            </p>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-btn font-bold text-sm hover:opacity-90 transition-all disabled:opacity-60"
              style={isRecruteur
                ? { background: '#F06A28', color: '#fff' }
                : { background: '#09C4A0', color: '#1A3E6E' }}
            >
              {loading ? 'Création du compte…' : isRecruteur ? 'Démarrer mon essai gratuit →' : 'Créer mon compte gratuit →'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-border text-center space-y-2">
            <p className="text-sm text-muted">
              Déjà abonné ?{' '}
              <button onClick={() => setPage('login')} className="text-teal font-semibold hover:underline">
                Se connecter
              </button>
            </p>
            <p className="text-sm text-muted">
              Mauvais plan ?{' '}
              <button onClick={() => setPage('pricing')} className="text-muted hover:underline underline">
                Changer d'offre
              </button>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-muted mt-6">
          ✦ Conforme RGPD · AI Act européen · Données hébergées en France
        </p>
      </div>
    </div>
  );
}
