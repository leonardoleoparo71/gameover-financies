'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import Image from 'next/image';
import { GoogleLogin } from '@react-oauth/google';
import styles from '../auth.module.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, loginWithGoogle } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logo} style={{ display: 'flex', justifyContent: 'center' }}>
            <Image src="/logo.webp" alt="GameOver" width={48} height={48} />
          </div>
          <h1 className={styles.title}>Bem-vindo ao GameOver</h1>
          <p className={styles.subtitle}>Faça login para continuar sua jornada</p>
        </div>

        {error && <div className={styles.error} style={{ marginBottom: '20px' }}>{error}</div>}

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              try {
                setLoading(true);
                if (credentialResponse.credential) await loginWithGoogle(credentialResponse.credential);
              } catch (err: any) {
                setError(err.message || 'Erro no login com Google');
                setLoading(false);
              }
            }}
            onError={() => {
              setError('Falha no login com Google. Verifique a configuração.');
            }}
            useOneTap
            theme="filled_black"
            shape="pill"
            text="continue_with"
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
          <hr style={{ flex: 1, borderColor: '#1f2937', borderTop: 'none' }} />
          <span style={{ padding: '0 10px', color: '#6b7280', fontSize: '0.875rem' }}>OU COM E-MAIL</span>
          <hr style={{ flex: 1, borderColor: '#1f2937', borderTop: 'none' }} />
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="input"
              placeholder="seu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label">Senha</label>
              <Link href="/forgot-password" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--brand-primary-light)' }}>
                Esqueceu a senha?
              </Link>
            </div>
            <div className={styles.inputWrapper}>
              <input
                type={showPassword ? "text" : "password"}
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={{ paddingRight: '40px' }}
              />
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                title={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? "👁️‍🗨️" : "👁️"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={loading}
            style={{ transition: 'all 0.3s' }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', animation: 'pulse 1.5s infinite' }}>
                ⏳ Conectando...
              </span>
            ) : 'Entrar'}
          </button>
        </form>

        <p className={styles.switch}>
          Não tem conta?{' '}
          <Link href="/register">Criar conta</Link>
        </p>
      </div>
    </div>
  );
}
