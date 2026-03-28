'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import styles from '../auth.module.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    
    try {
      const res = await api.forgotPassword(email);
      setMessage(res.message);
    } catch (err: any) {
      setError(err.message || 'Erro ao processar solicitação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logo} style={{ display: 'flex', justifyContent: 'center' }}>
            <img src="/logo.webp" alt="GameOver" width={48} height={48} />
          </div>
          <h1 className={styles.title}>Recuperar Senha</h1>
          <p className={styles.subtitle}>Digite seu e-mail para receber o link de recuperação</p>
        </div>

        {!message && (
          <div style={{ 
            background: 'rgba(var(--brand-primary-rgb), 0.1)', 
            border: '1px solid var(--brand-primary-light)', 
            borderRadius: '12px', 
            padding: '16px', 
            marginBottom: '24px',
            fontSize: '0.875rem',
            color: 'var(--text-secondary)'
          }}>
            <p style={{ fontWeight: 600, color: 'var(--brand-primary-light)', marginBottom: '8px' }}>
              💡 Como funciona:
            </p>
            <ul style={{ paddingLeft: '20px', margin: 0 }}>
              <li>Enviaremos um link seguro para o seu e-mail.</li>
              <li>O link expira em <strong>1 hora</strong> por segurança.</li>
              <li>Após clicar no link, você poderá criar uma nova senha.</li>
            </ul>
          </div>
        )}

        {!message ? (
          <form onSubmit={handleSubmit} className={styles.form}>
            {error && <div className={styles.error}>{error}</div>}

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

            <button
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={loading}
            >
              {loading ? 'Enviando...' : 'Enviar Link'}
            </button>
          </form>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>📩</div>
            <p style={{ color: 'var(--brand-secondary)', fontWeight: 600, marginBottom: '20px' }}>
              {message}
            </p>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Verifique sua caixa de entrada e spam.
            </p>
          </div>
        )}

        <p className={styles.switch}>
          Lembrou a senha?{' '}
          <Link href="/login">Voltar ao login</Link>
        </p>
      </div>
    </div>
  );
}
