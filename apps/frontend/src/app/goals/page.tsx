'use client';

import { useEffect, useState, useCallback } from 'react';
import { api, Goal, Summary } from '@/lib/api';
import { toast } from 'sonner';
import styles from './page.module.css';

function fmt(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

interface FormData { name: string; targetValue: string; deadline: string; }
const emptyForm: FormData = { name: '', targetValue: '', deadline: '' };

function getProgressColor(pct: number) {
  if (pct >= 75) return 'green';
  if (pct >= 40) return '';
  return 'amber';
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [itemToDelete, setItemToDelete] = useState<Goal | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [g, s] = await Promise.all([api.getGoals(), api.getSummary()]);
      setGoals(g); setSummary(s);
    } catch {/**/} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setError(''); setShowModal(true); };
  const openEdit = (g: Goal) => {
    setEditing(g);
    setForm({ name: g.name, targetValue: String(g.targetValue), deadline: g.deadline ? g.deadline.split('T')[0] : '' });
    setError(''); setShowModal(true);
  };
  const close = () => { setShowModal(false); setEditing(null); };

  const save = async () => {
    if (!form.name || !form.targetValue) { setError('Nome e valor alvo são obrigatórios'); return; }
    
    const payload = { name: form.name, targetValue: parseFloat(form.targetValue), deadline: form.deadline ? new Date(form.deadline).toISOString() : undefined };
    const tempId = editing ? editing.id : `temp-${Date.now()}`;
    const oldGoals = [...goals];
    const isEdit = !!editing;
    const editId = editing?.id;

    // Optimistic fast UI update
    if (isEdit) {
      setGoals(prev => prev.map(g => g.id === editId ? { ...g, ...payload, deadline: payload.deadline } as any : g));
    } else {
      const newTemp = { ...payload, id: tempId, userId: '', createdAt: new Date().toISOString() } as Goal;
      setGoals(prev => [newTemp, ...prev]);
    }
    close();

    try {
      if (isEdit) {
        await api.updateGoal(editId!, payload);
        toast.success('Meta atualizada');
      } else {
        const result = await api.createGoal(payload);
        setGoals(prev => prev.map(g => g.id === tempId ? result : g));
        toast.success('Meta criada');
      }
    } catch (e: unknown) { 
      toast.error(e instanceof Error ? "Erro ao salvar meta. " + e.message : 'Erro ao salvar. Revertendo...');
      setGoals(oldGoals);
    }
  };

  const confirmRemove = async () => {
    if (!itemToDelete) return;
    const id = itemToDelete.id;
    const oldGoals = [...goals];
    
    // Fast-remove
    setGoals(prev => prev.filter(g => g.id !== id));
    setItemToDelete(null);
    
    try {
      await api.deleteGoal(id);
      toast.success('Meta removida');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? "Erro ao deletar: " + e.message : "Erro ao remover meta.");
      setGoals(oldGoals);
    }
  };

  // Progress = saved this month / target
  const saved = summary?.saved ?? 0;
  const totalPurchases = summary?.totalPurchasesCost ?? 0;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Metas Financeiras</h1>
          <p className="page-subtitle">{goals.length} {goals.length === 1 ? 'meta definida' : 'metas definidas'}</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={openCreate}>+ Nova Meta</button>
        </div>
      </div>

      {/* Saved banner */}
      {summary && (
        <div className={styles.savedBanner}>
          <div>
            <span className={styles.bannerLabel}>💰 Disponível este mês</span>
            <span className={styles.bannerValue} style={{ color: saved >= 0 ? 'var(--brand-secondary)' : 'var(--brand-danger)' }}>
              {fmt(saved)}
            </span>
          </div>
          <div className="divider" style={{ width: '1px', height: 'auto', margin: 0 }} />
          <div>
            <span className={styles.bannerLabel}>🛒 Comprometido em compras</span>
            <span className={styles.bannerValue} style={{ color: 'var(--brand-accent)' }}>{fmt(totalPurchases)}</span>
          </div>
          <div className="divider" style={{ width: '1px', height: 'auto', margin: 0 }} />
          <div>
            <span className={styles.bannerLabel}>🏦 Saldo líquido</span>
            <span className={styles.bannerValue} style={{ color: (saved - totalPurchases) >= 0 ? 'var(--brand-primary-light)' : 'var(--brand-danger)' }}>
              {fmt(saved - totalPurchases)}
            </span>
          </div>
        </div>
      )}

      {loading ? (
        <div className={styles.loading}><div className={styles.spinner} /></div>
      ) : goals.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">🎯</span>
          <p className="empty-state-text">Nenhuma meta financeira definida. Crie sua primeira meta!</p>
          <button className="btn btn-primary" onClick={openCreate}>+ Criar Meta</button>
        </div>
      ) : (
        <div className="grid-auto">
          {goals.map(g => {
            const progress = Math.min((saved / g.targetValue) * 100, 100);
            const color = getProgressColor(progress);
            const daysLeft = g.deadline ? Math.ceil((new Date(g.deadline).getTime() - Date.now()) / 86400000) : null;

            return (
              <div key={g.id} className={styles.goalCard}>
                <div className={styles.goalHeader}>
                  <span className={styles.goalName}>🎯 {g.name}</span>
                  <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(g)}>✏️</button>
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setItemToDelete(g)}>🗑️</button>
                  </div>
                </div>

                <div className={styles.goalTarget}>Meta: {fmt(g.targetValue)}</div>

                <div className={styles.progressInfo}>
                  <span className={styles.progressPct} style={{
                    color: color === 'green' ? 'var(--brand-secondary)' : color === 'amber' ? 'var(--brand-accent)' : 'var(--brand-primary-light)'
                  }}>
                    {progress.toFixed(0)}%
                  </span>
                  <span className={styles.progressSaved}>{fmt(Math.min(saved, g.targetValue))} de {fmt(g.targetValue)}</span>
                </div>

                <div className="progress-track" style={{ height: 10, marginTop: 'var(--space-2)' }}>
                  <div className={`progress-fill ${color}`} style={{ width: `${Math.max(progress, 0)}%` }} />
                </div>

                <div className={styles.goalFooter}>
                  {daysLeft !== null ? (
                    <span className={`badge ${daysLeft < 0 ? 'badge-red' : daysLeft < 30 ? 'badge-yellow' : 'badge-gray'}`}>
                      {daysLeft < 0 ? '⚠️ Prazo vencido' : `⏳ ${daysLeft} dias restantes`}
                    </span>
                  ) : (
                    <span className="badge badge-gray">Sem prazo</span>
                  )}
                  {g.deadline && (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      {new Date(g.deadline).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) close(); }}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">{editing ? 'Editar Meta' : 'Nova Meta Financeira'}</h3>
              <button className="btn btn-ghost btn-icon" onClick={close}>✕</button>
            </div>
            <div className="modal-body">
              {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3) var(--space-4)', color: 'var(--brand-danger)', fontSize: '0.875rem' }}>{error}</div>}
              <div className="form-group">
                <label className="form-label">Nome da Meta *</label>
                <input className="input" placeholder="Ex: Viagem para Europa, Reserva de emergência..." value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Valor Alvo (R$) *</label>
                <input className="input" type="number" min="0" step="0.01" placeholder="10000,00" value={form.targetValue} onChange={e => setForm(f => ({ ...f, targetValue: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Prazo (opcional)</label>
                <input className="input" type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
                <span className="form-hint">Deixe em branco se não houver prazo definido</span>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={close}>Cancelar</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? 'Salvando...' : editing ? 'Salvar' : 'Criar Meta'}
              </button>
            </div>
          </div>
        </div>
      )}

      {itemToDelete && (
        <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setItemToDelete(null); }}>
          <div className="modal" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: 'var(--brand-danger)' }}>Remover Meta</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setItemToDelete(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-secondary)' }}>
                Tem certeza que deseja remover a meta <strong>{itemToDelete.name}</strong>? Todo o progresso será deletado.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setItemToDelete(null)}>Cancelar</button>
              <button className="btn btn-primary" style={{ background: 'var(--brand-danger)', color: '#fff', borderColor: 'transparent' }} onClick={confirmRemove}>
                Sim, remover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
