import { supabase } from '../../lib/supabase';
import { environment } from '../../config/environment';
import type { AdminAccountSettings } from '../../features/settings/types';

/**
 * Single-administrator account operations, all through Supabase Auth.
 * Credentials are never stored or displayed by the app; the initial account is
 * provisioned during deployment (docs/phase-2-deployment.md).
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PASSWORD_MIN_LENGTH = 8;
// bcrypt, used by Supabase Auth, ignores bytes beyond 72.
export const PASSWORD_MAX_LENGTH = 72;

export type PasswordStrength = { score: 0 | 1 | 2 | 3 | 4; label: 'Too short' | 'Weak' | 'Fair' | 'Good' | 'Strong' };

export function passwordStrength(password: string): PasswordStrength {
  if (password.length < PASSWORD_MIN_LENGTH) return { score: 0, label: 'Too short' };
  const variety = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter(pattern => pattern.test(password)).length;
  const points = (password.length >= 12 ? 2 : 1) + (password.length >= 16 ? 1 : 0) + (variety >= 3 ? 1 : 0) + (variety === 4 ? 1 : 0) - (/^(.)\1+$/.test(password) ? 3 : 0);
  if (points <= 1) return { score: 1, label: 'Weak' };
  if (points === 2) return { score: 2, label: 'Fair' };
  if (points === 3) return { score: 3, label: 'Good' };
  return { score: 4, label: 'Strong' };
}

export function validateNewPassword(password: string, confirmation: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) return `Use at least ${PASSWORD_MIN_LENGTH} characters.`;
  if (new TextEncoder().encode(password).length > PASSWORD_MAX_LENGTH) return `Use no more than ${PASSWORD_MAX_LENGTH} characters.`;
  if (!password.trim()) return 'Password cannot be only spaces.';
  if (password !== confirmation) return 'The new passwords do not match.';
  return null;
}

export async function getAdminAccount(): Promise<AdminAccountSettings | null> {
  const { data, error } = await supabase.auth.getUser();
  const user = data?.user;
  if (error || !user) return null;
  return {
    email: user.email || '',
    pendingEmail: user.new_email || null,
    emailConfirmed: Boolean(user.email_confirmed_at),
    lastSignInAt: user.last_sign_in_at || null,
    createdAt: user.created_at || null,
  };
}

export async function changeAdminEmail(newEmail: string): Promise<string> {
  const email = newEmail.trim().toLowerCase();
  if (!EMAIL_PATTERN.test(email)) throw new Error('Enter a valid email address.');
  const current = await getAdminAccount();
  if (!current) throw new Error('Sign in with the administrator account first.');
  if (current.email.toLowerCase() === email) throw new Error('That is already the administrator email.');
  const { error } = await supabase.auth.updateUser({ email });
  if (error) throw new Error(error.message || 'Email change could not be started.');
  return `Confirmation sent. The change completes after the link sent to ${email} is opened${current.email ? ' (Supabase may also ask the current address to confirm)' : ''}.`;
}

/** Re-verifies the current password before allowing a change. */
export async function changeAdminPassword(currentPassword: string, newPassword: string, confirmation: string): Promise<void> {
  const issue = validateNewPassword(newPassword, confirmation);
  if (issue) throw new Error(issue);
  if (currentPassword === newPassword) throw new Error('Choose a password different from the current one.');
  const account = await getAdminAccount();
  if (!account?.email) throw new Error('Sign in with the administrator account first.');
  const verification = await supabase.auth.signInWithPassword({ email: account.email, password: currentPassword });
  if (verification.error) throw new Error('The current password is incorrect.');
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message || 'Password could not be changed.');
}

export async function signOutOtherSessions(): Promise<void> {
  const { error } = await supabase.auth.signOut({ scope: 'others' });
  if (error) throw new Error(error.message || 'Other sessions could not be signed out.');
}

export async function signOutAllSessions(): Promise<void> {
  const { error } = await supabase.auth.signOut({ scope: 'global' });
  if (error) throw new Error(error.message || 'Sessions could not be signed out.');
}

export async function sendAdminPasswordReset(email: string): Promise<string> {
  const target = email.trim();
  if (!EMAIL_PATTERN.test(target)) throw new Error('No administrator email is available for recovery.');
  const base = (environment.appUrl || window.location.origin).replace(/\/$/, '');
  const { error } = await supabase.auth.resetPasswordForEmail(target, { redirectTo: `${base}/reset-password` });
  if (error) throw new Error(error.message || 'Reset email could not be sent.');
  return `A password reset link was sent to ${target}.`;
}

/** Completes a recovery link: the session comes from the link, then the password is replaced. */
export async function completePasswordReset(newPassword: string, confirmation: string): Promise<void> {
  const issue = validateNewPassword(newPassword, confirmation);
  if (issue) throw new Error(issue);
  const { data } = await supabase.auth.getSession();
  if (!data?.session) throw new Error('This reset link is invalid or has expired. Request a new one.');
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message || 'Password could not be updated.');
}
