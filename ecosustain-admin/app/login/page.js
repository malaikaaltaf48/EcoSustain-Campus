'use client';

// Path: app/login/page.js  (sirf yehi ek file chahiye)
// Is ek page par 5 screens hain: Sign in, Forgot password, Check email, New password, Done.

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// Abhi false hai (sirf is file se chalta hai, email nahi jati).
// Jab backend (/api/auth/...) bana lein, to true kar dein.
const USE_BACKEND = false;

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const validEmail = (v) => /^\S+@\S+\.\S+$/.test(v);

function EmailField({ value, onChange }) {
  return (
    <div className="eco-field">
      <label htmlFor="email" className="eco-label">Work email</label>
      <div className="eco-input-wrap">
        <svg className="eco-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4D5B52" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 7l9 6 9-6" />
        </svg>
        <input
          id="email"
          type="email"
          autoComplete="username"
          placeholder="admin@ecosustain.org"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="eco-input"
        />
      </div>
    </div>
  );
}

function PasswordField({ id, label, value, onChange, autoComplete, placeholder, show, onToggle, extra }) {
  return (
    <div className="eco-field">
      {extra ? (
        <div className="eco-label-row">
          <label htmlFor={id} className="eco-label">{label}</label>
          {extra}
        </div>
      ) : (
        <label htmlFor={id} className="eco-label">{label}</label>
      )}
      <div className="eco-input-wrap">
        <svg className="eco-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4D5B52" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" />
        </svg>
        <input
          id={id}
          type={show ? 'text' : 'password'}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="eco-input eco-input-pw"
        />
        <button type="button" className="eco-eye" aria-label={show ? 'Hide password' : 'Show password'} aria-pressed={show} onClick={onToggle}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4D5B52" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
            <circle cx="12" cy="12" r="3" />
            {show && <path d="M4 4l16 16" />}
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [view, setView] = useState('signin'); // signin | forgot | sent | reset | done
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  // Email ke link (/login?token=...) se aaye to seedha "new password" screen dikhao
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('token');
    if (t) {
      setToken(t);
      setView('reset');
    }
  }, []);

  // Resend ka 30 second ka countdown
  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setTimeout(() => setResendIn((n) => n - 1), 1000);
    return () => clearTimeout(id);
  }, [resendIn]);

  function go(next) {
    setError('');
    setShowPassword(false);
    setView(next);
  }

  // ---------- 1) Sign in ----------
  async function handleSignIn(e) {
    e.preventDefault();
    setError('');
    if (!validEmail(email)) return setError('Please enter a valid work email.');
    if (password.length < 8) return setError('Password must be at least 8 characters.');

    setLoading(true);
    try {
      if (!USE_BACKEND) {
        await wait(600);
        throw new Error('Demo mode: the login backend is not connected yet.');
      }
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Invalid email or password.');
      }
      router.push('/dashboard');
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // ---------- 2) Forgot password: reset link bhejna ----------
  async function sendResetLink() {
    if (USE_BACKEND) {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error('Could not send the reset link. Please try again.');
    } else {
      await wait(800);
    }
    setResendIn(30);
  }

  async function handleForgot(e) {
    e.preventDefault();
    setError('');
    if (!validEmail(email)) return setError('Please enter a valid work email.');
    setLoading(true);
    try {
      await sendResetLink();
      setView('sent');
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError('');
    setLoading(true);
    try {
      await sendResetLink();
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // ---------- 3) Naya password set karna ----------
  async function handleReset(e) {
    e.preventDefault();
    setError('');
    if (newPassword.length < 8) return setError('Password must be at least 8 characters.');
    if (newPassword !== confirm) return setError('Passwords do not match.');

    setLoading(true);
    try {
      if (USE_BACKEND) {
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, password: newPassword }),
        });
        if (!res.ok) throw new Error('This reset link is invalid or has expired. Please request a new one.');
      } else {
        await wait(800);
      }
      window.history.replaceState(null, '', '/login'); // URL se token hata do
      setToken('');
      setNewPassword('');
      setConfirm('');
      setPassword('');
      setView('done');
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="eco-root">
      {/* ---------- Top header: logo + title ---------- */}
      <header className="eco-header">
        <img className="eco-logo" src="/logo.jpeg" width="52" height="52" alt="EcoSustain Campus logo" />
        <div className="eco-brand">
          <span className="eco-brand-top">AI-Driven</span>
          <span className="eco-brand-name">EcoSustain Campus</span>
        </div>
      </header>

    <main className="eco-page">
      {/* ---------- Left: door + boy animation ---------- */}
      <section className="eco-scene">
        <svg viewBox="0 0 560 420" role="img" aria-label="A person walking into an open green door" className="eco-svg">
          <rect x="10" y="392" width="540" height="10" rx="5" fill="#E6EAD5" />
          <path d="M40 392C32 330 62 272 112 270 168 272 184 340 176 392Z" fill="#E6EAD5" />
          <path d="M84 300L150 392" stroke="#FDFCF8" strokeWidth="3" strokeLinecap="round" />
          <path d="M232 392V190a70 70 0 0 1 140 0V392Z" fill="#E6EAD5" />
          <path d="M395 392C392 350 415 322 445 324 485 326 505 360 500 392Z" fill="#E6EAD5" />
          <path d="M430 392L470 340" stroke="#FDFCF8" strokeWidth="3" strokeLinecap="round" />

          {/* Door ke peeche ki roshni */}
          <path d="M190 392V217a55 55 0 0 1 110 0V392Z" fill="#F4F7D0" />

          <g className="eco-door">
            <path d="M190 392V217a55 55 0 0 1 110 0V392Z" fill="#0A4228" />
            <rect x="205" y="215" width="80" height="80" rx="6" fill="#FDFCF8" />
            <path d="M231.7 215V295M258.3 215V295M205 241.7H285M205 268.3H285" stroke="#0A4228" strokeWidth="4" />
            <rect x="276" y="305" width="7" height="24" rx="3.5" fill="#B7E33A" />
          </g>

          <g className="eco-boy">
            <path d="M432 300H442L440 392H428Z M460 300H470L474 392H462Z" fill="#0B2418" />
            <path d="M428 240H476L482 300H424Z" fill="#0A4228" />
            <path d="M430 250L414 292" stroke="#E8AFA0" strokeWidth="7" strokeLinecap="round" />
            <circle cx="452" cy="212" r="14" fill="#0B2418" />
            <circle cx="449" cy="216" r="11" fill="#E8AFA0" />
          </g>
        </svg>
      </section>

      {/* ---------- Right: login card ---------- */}
      <section className="eco-panel">
        <div className="eco-card">

          {/* ===== Screen 1: Sign in ===== */}
          {view === 'signin' && (
            <>
              <span className="eco-badge">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0A4228" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6l8-3z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
                Admin console
              </span>
              <h1 className="eco-title">Sign in</h1>
              <p className="eco-lead">Access the EcoSustain control room to manage collection, sorting and sustainability reports.</p>

              <form onSubmit={handleSignIn} noValidate className="eco-form">
                <EmailField value={email} onChange={setEmail} />
                <PasswordField
                  id="password"
                  label="Password"
                  value={password}
                  onChange={setPassword}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  show={showPassword}
                  onToggle={() => setShowPassword((v) => !v)}
                  extra={<button type="button" className="eco-forgot" onClick={() => go('forgot')}>Forgot password?</button>}
                />
                <p className="eco-error" role="alert" aria-live="polite">{error}</p>
                <button type="submit" className="eco-submit" disabled={loading}>
                  {loading ? 'Signing in…' : 'Sign in to console'}
                </button>
              </form>
            </>
          )}

          {/* ===== Screen 2: Forgot password (email puchna) ===== */}
          {view === 'forgot' && (
            <>
              <button type="button" className="eco-back" onClick={() => go('signin')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0A4228" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
                Back to sign in
              </button>
              <span className="eco-badge">Account recovery</span>
              <h1 className="eco-title">Forgot password?</h1>
              <p className="eco-lead">Enter your admin email and we will send you a link to reset your password.</p>

              <form onSubmit={handleForgot} noValidate className="eco-form">
                <EmailField value={email} onChange={setEmail} />
                <p className="eco-error" role="alert" aria-live="polite">{error}</p>
                <button type="submit" className="eco-submit" disabled={loading}>
                  {loading ? 'Sending…' : 'Send reset link'}
                </button>
              </form>
            </>
          )}

          {/* ===== Screen 3: Check your email ===== */}
          {view === 'sent' && (
            <div className="eco-form" role="status" aria-live="polite">
              <div className="eco-mail-ic">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0A4228" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="M3 7l9 6 9-6" />
                </svg>
              </div>
              <h1 className="eco-title">Check your email</h1>
              <p className="eco-lead" style={{ margin: 0 }}>
                If an admin account exists for <span className="eco-strong">{email}</span>, we have sent a link to reset your password. The link expires in 30 minutes.
              </p>
              <p className="eco-note">Did not get it? Check your spam folder.</p>
              <p className="eco-error" role="alert">{error}</p>
              <div className="eco-actions">
                {!USE_BACKEND && (
                  <button type="button" className="eco-submit" onClick={() => { setToken('demo'); go('reset'); }}>
                    Open reset link (demo)
                  </button>
                )}
                <button type="button" className="eco-ghost" onClick={handleResend} disabled={loading || resendIn > 0}>
                  {resendIn > 0 ? `Resend link (${resendIn}s)` : 'Resend link'}
                </button>
                <button type="button" className="eco-ghost" onClick={() => go('forgot')}>Use a different email</button>
                <button type="button" className="eco-back" style={{ alignSelf: 'center' }} onClick={() => go('signin')}>Back to sign in</button>
              </div>
              {!USE_BACKEND && <p className="eco-note">Demo mode: no real email is sent yet. The demo button above opens the next step.</p>}
            </div>
          )}

          {/* ===== Screen 4: Naya password ===== */}
          {view === 'reset' && (
            <>
              <span className="eco-badge">Set new password</span>
              <h1 className="eco-title">Create new password</h1>
              <p className="eco-lead">Choose a strong password you have not used before.</p>

              <form onSubmit={handleReset} noValidate className="eco-form">
                <PasswordField
                  id="new-password"
                  label="New password"
                  value={newPassword}
                  onChange={setNewPassword}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  show={showPassword}
                  onToggle={() => setShowPassword((v) => !v)}
                />
                <PasswordField
                  id="confirm-password"
                  label="Confirm password"
                  value={confirm}
                  onChange={setConfirm}
                  autoComplete="new-password"
                  placeholder="Type it again"
                  show={showPassword}
                  onToggle={() => setShowPassword((v) => !v)}
                />
                <p className="eco-error" role="alert" aria-live="polite">{error}</p>
                <button type="submit" className="eco-submit" disabled={loading}>
                  {loading ? 'Saving…' : 'Reset password'}
                </button>
              </form>
            </>
          )}

          {/* ===== Screen 5: Done ===== */}
          {view === 'done' && (
            <div className="eco-form" role="status" aria-live="polite">
              <div className="eco-mail-ic">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#0A4228" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
              </div>
              <h1 className="eco-title">Password updated</h1>
              <p className="eco-lead" style={{ margin: 0 }}>Your password has been changed. You can now sign in with your new password.</p>
              <button type="button" className="eco-submit" onClick={() => go('signin')}>Back to sign in</button>
            </div>
          )}

        </div>
      </section>

      {/* ---------- Saari styling yahin hai (styled-jsx, Next.js mein built-in) ---------- */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@600;700&family=Instrument+Sans:wght@400;500;600;700&display=swap');

        html, body { margin: 0; padding: 0; }
        .eco-page, .eco-page * { box-sizing: border-box; }

        .eco-root {
          min-height: 100vh; display: flex; flex-direction: column;
          background: #faf7ee; color: #0b2418;
          font-family: 'Instrument Sans', system-ui, -apple-system, 'Segoe UI', sans-serif;
        }
        .eco-page { flex: 1; display: flex; flex-wrap: wrap; align-items: center; }

        .eco-header { display: flex; align-items: center; gap: 14px; padding: 14px 28px; border-bottom: 1px solid #e3e0d2; }
        .eco-logo { flex-shrink: 0; display: block; width: 52px; height: 52px; object-fit: contain; border-radius: 12px; }
        .eco-brand { display: flex; flex-direction: column; gap: 4px; }
        .eco-brand-top { align-self: flex-start; padding: 3px 10px; background: #e3ead3; border-radius: 999px; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #0a4228; }
        .eco-brand-name { font-family: 'Fraunces', Georgia, serif; font-size: 24px; font-weight: 700; line-height: 1.1; }
        .eco-scene { flex: 1 1 420px; padding: 24px; display: flex; justify-content: center; }
        .eco-panel { flex: 1 1 420px; padding: 20px; display: flex; justify-content: center; }
        .eco-svg { width: 100%; max-width: 420px; height: auto; }

        /* Animation: poora loop 9s ka hai. Speed badalni ho to sirf 9s change karein. */
        .eco-door { transform-box: fill-box; transform-origin: left center; animation: eco-door 9s ease-in-out infinite; }
        .eco-boy { animation: eco-boy 9s ease-in-out infinite; }
        @keyframes eco-door {
          0%, 28% { transform: scaleX(1); }
          40%, 62% { transform: scaleX(0.2); }
          74%, 100% { transform: scaleX(1); }
        }
        @keyframes eco-boy {
          0% { opacity: 0; transform: translateX(0); }
          4% { opacity: 1; transform: translateX(0); }
          30%, 44% { opacity: 1; transform: translateX(-110px); }
          58%, 100% { opacity: 0; transform: translateX(-190px); }
        }
        @media (prefers-reduced-motion: reduce) { .eco-door, .eco-boy { animation: none; } }

        .eco-card {
          width: 100%; max-width: 430px; padding: 32px 30px;
          background: #fdfcf8; border: 1px solid #e3e0d2; border-radius: 30px;
          box-shadow: 0 24px 60px rgba(10, 66, 40, 0.1);
          display: flex; flex-direction: column; gap: 18px;
        }
        .eco-badge {
          align-self: flex-start; display: flex; align-items: center; gap: 8px;
          padding: 8px 16px; background: #e3ead3; border-radius: 999px; font-size: 14px; font-weight: 700;
        }
        .eco-title { margin: 0; font-family: 'Fraunces', Georgia, serif; font-size: 32px; line-height: 1.1; }
        .eco-lead { margin: -8px 0 0; font-size: 15px; line-height: 1.55; color: #4d5b52; }

        .eco-form { display: flex; flex-direction: column; gap: 16px; }
        .eco-field { display: flex; flex-direction: column; gap: 8px; }
        .eco-label { font-size: 15px; font-weight: 600; }
        .eco-label-row { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
        .eco-forgot { font-size: 14px; font-weight: 700; color: #0a4228; text-decoration: none; }
        .eco-forgot:hover { text-decoration: underline; }

        .eco-input-wrap { position: relative; display: flex; align-items: center; }
        .eco-icon { position: absolute; left: 15px; pointer-events: none; }
        .eco-input {
          width: 100%; height: 46px; padding: 0 14px 0 44px; font: inherit; font-size: 15px; color: #0b2418;
          background: #fff; border: 1.5px solid #8f998a; border-radius: 23px;
        }
        .eco-input-pw { padding-right: 56px; }
        .eco-input:focus { outline: 3px solid #b7e33a; outline-offset: 1px; border-color: #0a4228; }
        .eco-eye {
          position: absolute; right: 4px; width: 44px; height: 44px; border: 0; border-radius: 22px;
          background: transparent; display: flex; align-items: center; justify-content: center; cursor: pointer;
        }
        .eco-eye:focus-visible, .eco-submit:focus-visible { outline: 3px solid #b7e33a; outline-offset: 2px; }

        .eco-error { margin: -8px 0 0; min-height: 20px; font-size: 14px; font-weight: 600; color: #b3261e; }

        .eco-submit {
          height: 48px; width: 100%; border: 0; border-radius: 24px; background: #0a4228; color: #fff;
          font: inherit; font-size: 16px; font-weight: 700; cursor: pointer; transition: background 0.2s ease;
        }
        .eco-submit:hover:not(:disabled) { background: #0d5632; }
        .eco-submit:disabled { opacity: 0.7; cursor: not-allowed; }

        @media (max-width: 760px) {
          .eco-scene { padding: 16px 16px 0; }
          .eco-scene .eco-svg { max-width: 300px; }
          .eco-card { padding: 24px 20px; border-radius: 24px; }
          .eco-title { font-size: 28px; }
          .eco-header { padding: 14px 20px; gap: 12px; }
          .eco-logo { width: 44px; height: 44px; }
          .eco-brand-name { font-size: 21px; }
        }
      
        .eco-forgot { background: none; border: 0; padding: 0; font: inherit; font-size: 14px; font-weight: 700; color: #0a4228; cursor: pointer; }
        .eco-forgot:hover, .eco-back:hover { text-decoration: underline; }
        .eco-forgot:focus-visible, .eco-back:focus-visible, .eco-ghost:focus-visible { outline: 3px solid #b7e33a; outline-offset: 2px; }
        .eco-back { display: inline-flex; align-items: center; gap: 6px; align-self: flex-start; background: none; border: 0; padding: 0; font: inherit; font-size: 14px; font-weight: 700; color: #0a4228; cursor: pointer; }
        .eco-mail-ic { width: 56px; height: 56px; border-radius: 50%; background: #e3ead3; display: flex; align-items: center; justify-content: center; }
        .eco-actions { display: flex; flex-direction: column; gap: 10px; }
        .eco-ghost { height: 46px; width: 100%; border: 1.5px solid #8f998a; border-radius: 23px; background: transparent; color: #0b2418; font: inherit; font-size: 15px; font-weight: 700; cursor: pointer; }
        .eco-ghost:hover:not(:disabled) { background: #f1efe3; }
        .eco-ghost:disabled { opacity: 0.5; cursor: not-allowed; }
        .eco-note { margin: 0; font-size: 13px; line-height: 1.5; color: #4d5b52; }
        .eco-strong { font-weight: 700; word-break: break-all; color: #0b2418; }
      `}</style>
    </main>
    </div>
  );
}