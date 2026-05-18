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
): Promise<AuthUser & { needsConfirmation?: boolean }> {
  if (!isConfigured) throw new Error('SUPABASE_NOT_CONFIGURED');
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name, role } },
  });

  if (error) {
    // Translate Supabase English errors → French codes
    const msg = error.message.toLowerCase();
    if (msg.includes('rate limit') || msg.includes('email rate')) {
      throw new Error('EMAIL_RATE_LIMIT');
    }
    if (msg.includes('already registered') || msg.includes('already been registered') || msg.includes('user already exists')) {
      throw new Error('EMAIL_ALREADY_USED');
    }
    if (msg.includes('password') && (msg.includes('short') || msg.includes('weak') || msg.includes('characters'))) {
      throw new Error('PASSWORD_TOO_WEAK');
    }
    if (msg.includes('invalid email') || msg.includes('unable to validate')) {
      throw new Error('INVALID_EMAIL');
    }
    throw new Error(error.message);
  }

  if (!data.user) throw new Error('Inscription échouée. Réessayez.');

  // Detect if email confirmation is required (session null = waiting for email click)
  // Also detect duplicate unconfirmed account (identities empty = email already taken)
  const needsConfirmation = !data.session;
  const isDuplicate = data.user.identities?.length === 0;
  if (isDuplicate) throw new Error('EMAIL_ALREADY_USED');

  return { ...mapUser(data.user), needsConfirmation };
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
