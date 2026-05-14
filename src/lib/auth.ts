import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { supabase, isConfigured } from './supabase';
import type { AuthUser, UserRole } from '../types';

function mapUser(user: { id: string; email?: string; user_metadata?: Record<string, unknown> }): AuthUser {
  const meta = user.user_metadata ?? {};
  return {
    id:    user.id,
    name:  (meta.name as string) ?? user.email ?? 'Utilisateur',
    email: user.email ?? '',
    role:  (meta.role as UserRole) ?? 'candidat',
  };
}

export async function authSignIn(email: string, password: string): Promise<AuthUser> {
  if (!isConfigured) throw new Error('SUPABASE_NOT_CONFIGURED');
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  return mapUser(data.user);
}

export async function authSignUp(
  email: string,
  password: string,
  name: string,
  role: 'recruteur' | 'candidat',
): Promise<AuthUser> {
  if (!isConfigured) throw new Error('SUPABASE_NOT_CONFIGURED');
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name, role } },
  });
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error('Inscription échouée. Réessayez.');
  return mapUser(data.user);
}

export async function authSignOut(): Promise<void> {
  if (!isConfigured) return;
  await supabase.auth.signOut();
}

export async function getSession(): Promise<AuthUser | null> {
  if (!isConfigured) return null;
  const { data } = await supabase.auth.getSession();
  if (!data.session?.user) return null;
  return mapUser(data.session.user);
}

export function onAuthChange(cb: (user: AuthUser | null) => void) {
  if (!isConfigured) return () => {};
  const { data } = supabase.auth.onAuthStateChange(
    (_event: AuthChangeEvent, session: Session | null) => {
      cb(session?.user ? mapUser(session.user) : null);
    },
  );
  return () => data.subscription.unsubscribe();
}
