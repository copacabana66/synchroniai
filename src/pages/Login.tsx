import { useState } from 'react';
import type { PageName, AuthUser } from '../types';
import { MatchingLogo } from '../components/MatchingLogo';

interface LoginProps {
  setPage: (p: PageName) => void;
  setUser: (u: AuthUser) => void;
}

const MOCK_USERS = [
  { email: 'recruteur@demo.fr', password: 'demo1234', name: 'Marie Durand', role: 'recruteur' as const },
  { email: 'candidat@demo.fr',  password: 'demo1234', name: 'Sophie Martin',  role: 'candidat'  as const },
];

export function Login({ setPage, setUser }: LoginProps) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    setTimeout(() => {
      const found = MOCK_USERS.find(u => u.email === email && u.password === password);
      if (found) {
        setUser({ name: found.name, email: found.email, role: found.role });
        setPage(found.role === 'recruteur' ? 'recruteur' : 'candidat');
      } else {
        setError('Email ou mot de passe incorrect.');
      }
      setLoading(false);
    }, 600);
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
          <h1 className="text-2xl font-extrabold text-primary tracking-tight mb-1">Bon retour !</h1>
          <p className="text-muted text-sm">Connectez-vous à votre espace personnel</p>
        </div>

        {/* Card */}
        <div className="bg-card rounded-card border border-border p-8">

          {/* Demo hint */}
          <div className="bg-teal-light border border-teal/25 rounded-xl p-3 mb-6 text-xs text-primary">
            <p className="font-semibold mb-1">🔑 Comptes de démonstration</p>
            <p><span className="font-medium">Recruteur :</span> recruteur@demo.fr / demo1234</p>
            <p><span className="font-medium">Candidat :</span> candidat@demo.fr / demo1234</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-primary block mb-1.5">Email</label>
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
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-sm font-semibold text-primary">Mot de passe</label>
                <button type="button" className="text-xs text-teal hover:underline">Mot de passe oublié ?</button>
              </div>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-btn bg-primary text-white font-bold text-sm hover:opacity-90 transition-all disabled:opacity-60"
            >
              {loading ? 'Connexion…' : 'Se connecter →'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-border text-center">
            <p className="text-sm text-muted">
              Pas encore abonné ?{' '}
              <button onClick={() => setPage('pricing')} className="text-teal font-semibold hover:underline">
                Voir les offres
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
