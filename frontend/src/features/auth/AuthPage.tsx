import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient, setAccessToken } from '../../lib/api-client';

export default function AuthPage({ mode }: { mode: 'login' | 'signup' }) {
  const signup = mode === 'signup';
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const navigate = useNavigate();
  async function submit(e: FormEvent) { e.preventDefault(); setError(''); setBusy(true); try {
    const { data } = await apiClient.post(`/auth/${mode}`, signup ? { full_name: name, email, password } : { email, password });
    if (!data.access_token) { setError(`${data.message ?? "Account created. Check your email to verify the account before signing in."}${data.development_verification_token ? ` Development verification token: ${data.development_verification_token}` : ""}`); return; }
    setAccessToken(data.access_token); navigate('/dashboard', { replace: true });
  } catch (err) { setError(err instanceof Error ? err.message : 'Unable to authenticate.'); } finally { setBusy(false); } }
  return <div className="grid min-h-screen place-items-center bg-slate-950 px-4 py-10"><div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl"><div className="mb-7"><div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-indigo-600 text-xl font-bold text-white">A</div><h1 className="text-2xl font-bold text-slate-900">{signup ? 'Create your workspace' : 'Welcome back'}</h1><p className="mt-2 text-sm text-slate-500">Secure access to your AI Assistant Workspace.</p></div>
    <form onSubmit={submit} className="space-y-4">{signup && <label className="block text-sm font-medium text-slate-700">Full name<input required minLength={2} maxLength={180} value={name} onChange={e=>setName(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5" /></label>}<label className="block text-sm font-medium text-slate-700">Email<input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5" /></label><label className="block text-sm font-medium text-slate-700">Password<input required minLength={signup ? 12 : 1} maxLength={128} type="password" autoComplete={signup?'new-password':'current-password'} value={password} onChange={e=>setPassword(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5" />{signup && <span className="mt-1 block text-xs text-slate-500">Use at least 12 characters.</span>}</label>{error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}<button disabled={busy} className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{busy?'Please wait…':signup?'Create account':'Sign in'}</button></form>
    <p className="mt-6 text-center text-sm text-slate-500">{signup ? 'Already have an account?' : 'New here?'} <Link className="font-semibold text-indigo-600" to={signup ? '/login' : '/signup'}>{signup ? 'Sign in' : 'Create account'}</Link></p>
    {!signup && <p className="mt-3 text-center text-sm"><Link className="font-semibold text-indigo-600" to="/password-reset">Forgot password?</Link></p>}
    {signup && <p className="mt-3 text-center text-sm"><Link className="font-semibold text-indigo-600" to="/verify-email">Verify an email address</Link></p>}
    <p className="mt-6 text-xs leading-5 text-slate-400">Do not upload regulated or confidential information until your deployment's access controls, backups, and security review are complete.</p></div></div>;
}
