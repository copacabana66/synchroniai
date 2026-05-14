import { useState } from 'react';
import type { PageName, AuthUser } from '../types';
import { MatchingLogo } from '../components/MatchingLogo';
import { authSignIn } from '../lib/auth';

interface LoginProps {
  setPage: (p: PageName) => void;
  setUser: (u: AuthUser) => void;
}

// Demo fallback — only used when Supabase isn't configured locally
const DEMO_USERS: AuthUser[] = [
  { id: 'demo-recruteur', email: 'recruteur@demo.fr', name: 'Marie Durand',  role: 'recruteur' },
  { id: 'demo-candidat',  email: 'candidat@demo.fr',  name: 'Sophie Martin', role: 'candidat'  },
];
const DEMO_PASSWORD = 'demo1234';

export function Login({ setPage, setUser }: LoginProps) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Try real Supabase auth first
      const u = await authSignIn(email, password);
      setUser(u);
      setPage(u.role === 'recruteur' ? 'recruteur' : 'candidat');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      // Fallback: demo accounts work even without Supabase configured
      if (msg === 'SUPABASE_NOT_CONFIGURED') {
        const demo = DEMO_USERS.find(u => u.email === email);
        if (demo && password === DEMO_PASSWORD) {
          setUser(demo);
          setPage(demo.role === 'recruteur' ? 'recruteur' : 'candidat');
          return;
        }
        setError('Email ou mot de passe incorrect.');
      } else if (msg.includes('Invalid login credentials') || msg.includes('Email not confirmed')) {
        setError('Email ou mot de passe incorrect. Vérifiez vos identifiants.');
      } else {
        setError(msg || 'Erreur de connexion. Réessayez.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">

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

        <div className="bg-card rounded-card border border-border p-8">
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
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-btn bg-primary text-white font-bold text-sm hover:opacity-90 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Connexion…</>
                : 'Se connecter →'}
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
