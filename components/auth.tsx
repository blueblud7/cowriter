'use client';
import { useState } from 'react';
import { InkiMascot } from './mascot';
import { supabase } from '@/lib/supabase';
import type { Lang, T } from '@/lib/data';

export interface AuthUser {
  email: string;
  name: string;
  provider?: string;
  guest?: boolean;
}

interface AuthScreenProps {
  t: T;
  lang: Lang;
  onSignedIn: (user: AuthUser) => void;
}

const QUOTES = {
  kr: [
    { q: '모든 초고는 다음 문장에게 자리를 내어주기 위해 쓰여진다.', a: '— 어느 작가의 노트' },
    { q: '한 줄이면 충분해. 그 다음 줄은 그 한 줄이 데려와.',         a: '— Inki' },
    { q: '오래 쓰는 사람의 비결은 매일 짧게 쓰는 것.',                 a: '— 어느 편집자' },
  ],
  en: [
    { q: "Every draft is written to make room for the next sentence.", a: "— a writer's notebook" },
    { q: 'One line is enough. The next will follow it home.',          a: '— Inki' },
    { q: 'Long-lasting writers write short, every day.',               a: '— an editor' },
  ],
};

export function AuthScreen({ t, lang, onSignedIn }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const quote = QUOTES[lang][0];

  const S = lang === 'kr' ? {
    welcome: '돌아온 걸 환영해요',
    welcomeSignup: '오늘부터 같이 써요',
    subLogin: '오늘은 어떤 결로 시작해볼까요?',
    subSignup: '이름을 알려주면, 우리가 부를게요.',
    name: '이름',
    namePlaceholder: '뭐라고 부를까요?',
    email: '이메일',
    password: '비밀번호',
    forgot: '비밀번호를 잊었어요',
    remember: '이 기기에서 자동 로그인',
    login: '들어가기',
    signup: '시작하기',
    or: '또는',
    google: 'Google로 계속',
    apple: 'Apple로 계속',
    kakao: '카카오로 계속',
    guest: '둘러보기로 시작 →',
    noAccount: '계정이 없어요',
    haveAccount: '이미 계정이 있어요',
    toSignup: '회원가입',
    toLogin: '로그인',
    terms: '계속하면 이용약관과 개인정보처리방침에 동의하는 거예요.',
    badge: '글쓰는 사람을 위한 작업실',
    privacy: '개인정보', termsLink: '이용약관', help: '도움말',
  } : {
    welcome: 'Welcome back',
    welcomeSignup: "Let's start writing together",
    subLogin: 'What grain shall we begin on today?',
    subSignup: "Tell us your name and we'll use it.",
    name: 'Name',
    namePlaceholder: 'What should we call you?',
    email: 'Email',
    password: 'Password',
    forgot: 'Forgot password',
    remember: 'Keep me signed in on this device',
    login: 'Sign in',
    signup: 'Create account',
    or: 'or',
    google: 'Continue with Google',
    apple: 'Continue with Apple',
    kakao: 'Continue with Kakao',
    guest: 'Take a look around →',
    noAccount: 'No account yet?',
    haveAccount: 'Already have an account?',
    toSignup: 'Sign up',
    toLogin: 'Sign in',
    terms: 'By continuing you agree to the Terms and Privacy Policy.',
    badge: 'A writing room for writers',
    privacy: 'Privacy', termsLink: 'Terms', help: 'Help',
  };

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    setError(null);
    try {
      if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onSignedIn({ email, name: data.user?.user_metadata?.name || email.split('@')[0] });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { data: { name: name || email.split('@')[0] } },
        });
        if (error) throw error;
        onSignedIn({ email, name: name || email.split('@')[0] });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '오류가 발생했어요.');
    } finally {
      setLoading(false);
    }
  };

  const signInWithProvider = async (provider: 'google' | 'apple') => {
    await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: window.location.origin } });
  };

  return (
    <div className="auth-screen">
      {/* Left — atmosphere panel */}
      <aside className="auth-aside">
        <div className="auth-aside-brand">
          <InkiMascot size={28} mood="warm" />
          <span>{t.brand}</span>
        </div>

        <div className="auth-quote">
          <span className="auth-quote-mark">"</span>
          <blockquote>{quote.q}</blockquote>
          <cite>{quote.a}</cite>
        </div>

        <div className="auth-aside-foot">
          <span className="auth-aside-badge">{S.badge}</span>
          <div className="auth-aside-mascot">
            <InkiMascot size={80} mood="smile" pulse />
          </div>
        </div>

        <span className="auth-blob auth-blob-1" />
        <span className="auth-blob auth-blob-2" />
      </aside>

      {/* Right — form */}
      <main className="auth-main">
        <header className="auth-head">
          <div className="auth-mode-toggle">
            <button data-on={mode === 'login' ? '1' : '0'} onClick={() => setMode('login')}>
              {S.toLogin}
            </button>
            <button data-on={mode === 'signup' ? '1' : '0'} onClick={() => setMode('signup')}>
              {S.toSignup}
            </button>
          </div>
        </header>

        <div className="auth-card">
          <div className="auth-greet">
            <h1>{mode === 'login' ? S.welcome : S.welcomeSignup}</h1>
            <p>{mode === 'login' ? S.subLogin : S.subSignup}</p>
          </div>

          <form className="auth-form" onSubmit={submit} autoComplete="on">
            {mode === 'signup' && (
              <label className="auth-field">
                <span className="auth-field-label">{S.name}</span>
                <input className="auth-input" type="text"
                       value={name} onChange={(e) => setName(e.target.value)}
                       placeholder={S.namePlaceholder} autoComplete="name" />
              </label>
            )}

            <label className="auth-field">
              <span className="auth-field-label">{S.email}</span>
              <input className="auth-input" type="email" required
                     value={email} onChange={(e) => setEmail(e.target.value)}
                     placeholder="you@cowriter.app" autoComplete="email" />
            </label>

            <label className="auth-field">
              <span className="auth-field-label">
                {S.password}
                {mode === 'login' && (
                  <a href="#" className="auth-forgot" onClick={(e) => e.preventDefault()}>{S.forgot}</a>
                )}
              </span>
              <div className="auth-pw-wrap">
                <input className="auth-input"
                       type={showPw ? 'text' : 'password'} required
                       value={password} onChange={(e) => setPassword(e.target.value)}
                       placeholder="••••••••"
                       autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
                <button type="button" className="auth-pw-toggle"
                        onClick={() => setShowPw(!showPw)}
                        aria-label="toggle password visibility">
                  {showPw ? '◓' : '◐'}
                </button>
              </div>
            </label>

            {mode === 'login' && (
              <label className="auth-check">
                <input type="checkbox" checked={remember}
                       onChange={(e) => setRemember(e.target.checked)} />
                <span className="auth-check-box" />
                <span>{S.remember}</span>
              </label>
            )}

            {error && (
              <div style={{ fontSize: 12, color: '#C0392B', background: '#FDF0EE', border: '1px solid #F5C6C0', borderRadius: 8, padding: '8px 12px' }}>
                {error}
              </div>
            )}

            <button className="btn btn-primary auth-submit" type="submit" disabled={loading}>
              {loading ? '...' : (mode === 'login' ? S.login : S.signup)} →
            </button>

            <div className="auth-divider"><span>{S.or}</span></div>

            <div className="auth-providers">
              <button type="button" className="auth-provider"
                      onClick={() => signInWithProvider('google')}>
                <span className="auth-provider-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="16" height="16">
                    <path fill="#4285F4" d="M22.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h5.92a5.07 5.07 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.21-4.74 3.21-8.33z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.28-1.93-6.14-4.52H2.2v2.84A11 11 0 0 0 12 23z"/>
                    <path fill="#FBBC05" d="M5.86 14.11A6.6 6.6 0 0 1 5.5 12c0-.74.13-1.45.36-2.11V7.05H2.2A11 11 0 0 0 1 12c0 1.77.43 3.45 1.2 4.95l3.66-2.84z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.65l3.15-3.15C17.45 2.07 14.97 1 12 1 7.7 1 3.99 3.47 2.2 7.05L5.86 9.9C6.72 7.3 9.14 5.38 12 5.38z"/>
                  </svg>
                </span>
                <span>{S.google}</span>
              </button>

              <button type="button" className="auth-provider"
                      onClick={() => signInWithProvider('apple')}>
                <span className="auth-provider-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="16" height="16">
                    <path fill="currentColor" d="M17.05 13c-.03-2.5 2.04-3.7 2.13-3.75-1.16-1.7-2.97-1.93-3.62-1.96-1.54-.16-3.01.91-3.79.91-.78 0-1.99-.89-3.27-.86-1.68.03-3.24.98-4.1 2.49-1.75 3.04-.45 7.53 1.25 9.99.84 1.2 1.83 2.55 3.12 2.5 1.25-.05 1.73-.81 3.24-.81 1.51 0 1.94.81 3.27.78 1.35-.02 2.21-1.22 3.04-2.43.96-1.4 1.36-2.75 1.38-2.82-.03-.01-2.65-1.02-2.68-4.04zM14.5 4.6c.69-.84 1.16-2 1.03-3.16-.99.04-2.2.66-2.92 1.5-.64.74-1.21 1.93-1.06 3.06 1.11.09 2.25-.56 2.95-1.4z"/>
                  </svg>
                </span>
                <span>{S.apple}</span>
              </button>

              {lang === 'kr' && (
                <button type="button" className="auth-provider auth-provider-kakao"
                        onClick={() => onSignedIn({ email: 'demo@kakao.com', name: 'Demo', provider: 'kakao' })}>
                  <span className="auth-provider-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="14" height="14">
                      <path fill="#3C1E1E" d="M12 3C6.48 3 2 6.58 2 11c0 2.8 1.84 5.27 4.64 6.7L5.5 21l4.27-2.5c.72.1 1.46.15 2.23.15 5.52 0 10-3.58 10-8s-4.48-7.65-10-7.65z"/>
                    </svg>
                  </span>
                  <span>{S.kakao}</span>
                </button>
              )}
            </div>

            <button type="button" className="auth-guest"
                    onClick={() => onSignedIn({ email: 'guest', name: lang === 'kr' ? '손님' : 'Guest', guest: true })}>
              {S.guest}
            </button>
          </form>

          <p className="auth-terms">{S.terms}</p>
        </div>

        <footer className="auth-foot">
          <span>© 2026 CoWriter</span>
          <span style={{ display: 'flex', gap: 14 }}>
            <a href="#" onClick={(e) => e.preventDefault()}>{S.privacy}</a>
            <a href="#" onClick={(e) => e.preventDefault()}>{S.termsLink}</a>
            <a href="#" onClick={(e) => e.preventDefault()}>{S.help}</a>
          </span>
        </footer>
      </main>
    </div>
  );
}
