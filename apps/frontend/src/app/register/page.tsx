'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import Image from 'next/image';
import { GoogleLogin } from '@react-oauth/google';
import styles from '../auth.module.css';

export default function RegisterPage() {
  const { register, loginWithGoogle } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    setLoading(true);
    try {
      await register(name, email, password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao criar conta');
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
          <h1 className={styles.title}>Criar sua conta</h1>
          <p className={styles.subtitle}>Comece sua jornada financeira épica</p>
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
              setError('Falha ao criar conta com Google. Verifique a configuração.');
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
            <label className="form-label">Nome</label>
            <input
              type="text"
              className="input"
              placeholder="Seu nome"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

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
            <label className="form-label">Senha</label>
            <div className={styles.inputWrapper}>
              <input
                type={showPassword ? "text" : "password"}
                className="input"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
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
            <span className="form-hint">A senha deve ter ao menos 6 caracteres</span>
          </div>

          <div className="form-group">
            <label className="form-label">Confirmar Senha</label>
            <div className={styles.inputWrapper}>
              <input
                type={showConfirmPassword ? "text" : "password"}
                className="input"
                placeholder="Digite a senha novamente"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                style={{ paddingRight: '40px' }}
              />
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex={-1}
                title={showConfirmPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showConfirmPassword ? "👁️‍🗨️" : "👁️"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={loading}
          >
            {loading ? 'Criando conta...' : 'Criar conta'}
          </button>
        </form>

        <p className={styles.switch}>
          Já tem uma conta?{' '}
          <Link href="/login">Fazer login</Link>
        </p>
      </div>
    </div>
  );
}
