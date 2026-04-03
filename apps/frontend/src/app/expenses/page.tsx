'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { api, Transaction } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

const CATEGORIES = [
  { value: 'essential', label: '🏠 Essencial' },
  { value: 'leisure', label: '🎮 Lazer' },
  { value: 'investment', label: '📈 Investimento' },
  { value: 'future_purchase', label: '🛒 Compra Futura' },
];

const CATEGORY_COLORS: Record<string, string> = {
  essential: 'var(--brand-primary-light)',
  leisure: 'var(--brand-accent)',
  investment: 'var(--brand-secondary)',
  future_purchase: '#f472b6',
};

function fmt(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR');
}

interface FormData {
  type: 'income' | 'expense';
  category: 'essential' | 'leisure' | 'investment' | 'future_purchase';
  name: string;
  amount: string;
  date: string;
}

const emptyForm: FormData = {
  type: 'expense',
  category: 'essential',
  name: '',
  amount: '',
  date: new Date().toISOString().split('T')[0],
};

export default function ExpensesPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');

  const now = new Date();
  const [month] = useState(now.getMonth() + 1);
  const [year] = useState(now.getFullYear());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getTransactions({ month, year });
      setTransactions(data);
    } catch {/**/} finally { setLoading(false); }
  }, [month, year]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setError(''); setShowModal(true); };
  const openEdit = (t: Transaction) => {
    setEditing(t);
    setForm({ type: t.type, category: t.category, name: t.name, amount: String(t.amount), date: t.date.split('T')[0] });
    setError(''); setShowModal(true);
  };

  const close = () => { setShowModal(false); setEditing(null); };

  const save = async () => {
    if (!form.name || !form.amount) { setError('Preencha nome e valor'); return; }
    
    const payload = { ...form, amount: parseFloat(form.amount) };
    const tempId = editing ? editing.id : `temp-${Date.now()}`;
    const oldTransactions = [...transactions];
    const isEdit = !!editing;
    const editId = editing?.id;

    // Optimistic Update: Modifica estado local e Fecha Modal Imediatamente
    if (isEdit) {
      setTransactions(prev => prev.map(t => t.id === editId ? { ...t, ...payload } as any : t));
    } else {
      const newTemp = { 
        ...payload, 
        id: tempId, 
        userId: user?.id || '', 
        date: payload.date ? new Date(payload.date).toISOString() : new Date().toISOString() 
      } as unknown as Transaction;
      setTransactions(prev => [newTemp, ...prev]);
    }
    close();

    // Background Processing
    try {
      if (isEdit) {
        await api.updateTransaction(editId!, payload);
      } else {
        const result = await api.createTransaction(payload);
        setTransactions(prev => prev.map(t => t.id === tempId ? result : t));
      }
    } catch (e: unknown) {
      alert(e instanceof Error ? "Erro ao salvar transação. " + e.message : 'Erro ao salvar. Revertendo...');
      setTransactions(oldTransactions);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Remover esta transação?')) return;
    const oldTransactions = [...transactions];
    
    // Fast-remove
    setTransactions(prev => prev.filter(t => t.id !== id));
    
    try {
      await api.deleteTransaction(id);
    } catch (e: unknown) {
      alert(e instanceof Error ? "Erro ao tentar remover. " + e.message : 'Erro ao deletar. Revertendo...');
      setTransactions(oldTransactions);
    }
  };

  const saveSnapshot = async () => {
    try {
      await api.saveSnapshot();
      alert('Snapshot do mês salvo!');
    } catch { alert('Erro ao salvar snapshot'); }
  };

  const totalIncome = useMemo(() => {
    return transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0) + (user?.salary || 0);
  }, [transactions, user?.salary]);

  const totalExpense = useMemo(() => {
    return transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  }, [transactions]);

  const displayTransactions = useMemo(() => {
    const list = [...transactions];
    if (user?.salary && user.salary > 0) {
      list.unshift({
        id: 'salary-virtual',
        userId: user.id,
        type: 'income',
        category: 'essential',
        name: 'Salário Mensal (Base)',
        amount: user.salary,
        date: new Date(year, month - 1, 1).toISOString(),
      });
    }
    return list.filter(t => filterType === 'all' || t.type === filterType);
  }, [transactions, user, filterType, month, year]);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Despesas & Receitas</h1>
          <p className="page-subtitle">Transações de {month.toString().padStart(2,'0')}/{year}</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <button className="btn btn-secondary btn-sm" onClick={saveSnapshot}>
            💾 Salvar Snapshot
          </button>
          <button className="btn btn-primary" onClick={openCreate}>+ Nova Transação</button>
        </div>
      </div>

      {/* Summary Row */}
      <div className={styles.summaryRow}>
        <div className={styles.summaryCard} style={{ borderColor: 'rgba(16,185,129,0.4)' }}>
          <span className={styles.summaryLabel}>💰 Renda</span>
          <span className={styles.summaryValue} style={{ color: 'var(--brand-secondary)' }}>
            {loading ? <div className="skeleton" style={{ width: '80px', height: '28px' }} /> : fmt(totalIncome)}
          </span>
        </div>
        <div className={styles.summaryCard} style={{ borderColor: 'rgba(239,68,68,0.4)' }}>
          <span className={styles.summaryLabel}>💸 Gastos</span>
          <span className={styles.summaryValue} style={{ color: 'var(--brand-danger)' }}>
            {loading ? <div className="skeleton" style={{ width: '80px', height: '28px' }} /> : fmt(totalExpense)}
          </span>
        </div>
        <div className={styles.summaryCard} style={{ borderColor: (totalIncome - totalExpense) >= 0 ? 'rgba(99,102,241,0.4)' : 'rgba(239,68,68,0.4)' }}>
          <span className={styles.summaryLabel}>🏦 Saldo</span>
          <span className={styles.summaryValue} style={{ color: (totalIncome - totalExpense) >= 0 ? 'var(--brand-primary-light)' : 'var(--brand-danger)' }}>
            {loading ? <div className="skeleton" style={{ width: '80px', height: '28px' }} /> : fmt(totalIncome - totalExpense)}
          </span>
        </div>
      </div>

      {/* Filter tabs */}
      <div className={styles.tabs}>
        {(['all', 'income', 'expense'] as const).map(f => (
          <button
            key={f}
            className={`${styles.tab} ${filterType === f ? styles.tabActive : ''}`}
            onClick={() => setFilterType(f)}
          >
            {f === 'all' ? 'Todas' : f === 'income' ? '💰 Receitas' : '💸 Despesas'}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {[1,2,3,4,5].map(i => (
            <div key={i} className={styles.row} style={{ opacity: 0.5 }}>
              <div className={styles.rowLeft}>
                <div className={`${styles.rowDot} skeleton`} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ height: '16px', width: '120px', marginBottom: '8px' }} />
                  <div className="skeleton" style={{ height: '12px', width: '200px' }} />
                </div>
              </div>
              <div className={styles.rowRight}>
                <div className="skeleton" style={{ height: '24px', width: '80px' }} />
              </div>
            </div>
          ))}
        </div>
      ) : displayTransactions.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">📭</span>
          <p className="empty-state-text">Nenhuma transação encontrada. Que tal adicionar uma?</p>
          <button className="btn btn-primary" onClick={openCreate}>+ Adicionar</button>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {displayTransactions.map((t, i) => {
            const isSalary = t.id === 'salary-virtual';
            return (
              <div
                key={t.id}
                className={`${styles.row} ${isSalary ? styles.salaryRow : ''}`}
                style={{ borderTop: i > 0 ? '1px solid var(--border-subtle)' : 'none' }}
              >
                <div className={styles.rowLeft}>
                  <div
                    className={styles.rowDot}
                    style={{ background: CATEGORY_COLORS[t.category] || 'var(--brand-primary)' }}
                  />
                  <div>
                    <div className={styles.rowName}>
                      {t.name}
                      {isSalary && <span className={styles.salaryBadge}>FIXO</span>}
                    </div>
                    <div className={styles.rowMeta}>
                      <span className={`badge ${t.type === 'income' ? 'badge-green' : 'badge-red'}`}>
                        {t.type === 'income' ? 'Receita' : 'Despesa'}
                      </span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.775rem' }}>
                        · {CATEGORIES.find(c => c.value === t.category)?.label} · {fmtDate(t.date)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className={styles.rowRight}>
                  <span
                    className={styles.rowAmount}
                    style={{ color: t.type === 'income' ? 'var(--brand-secondary)' : 'var(--brand-danger)' }}
                  >
                    {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                  </span>
                  {!isSalary && (
                    <>
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(t)}>✏️</button>
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => remove(t.id)}>🗑️</button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) close(); }}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">{editing ? 'Editar Transação' : 'Nova Transação'}</h3>
              <button className="btn btn-ghost btn-icon" onClick={close}>✕</button>
            </div>
            <div className="modal-body">
              {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3) var(--space-4)', color: 'var(--brand-danger)', fontSize: '0.875rem' }}>{error}</div>}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">Tipo</label>
                  <select className="select" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as 'income' | 'expense' }))}>
                    <option value="income">💰 Receita</option>
                    <option value="expense">💸 Despesa</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Categoria</label>
                  <select className="select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as any }))}>
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Nome / Descrição</label>
                <input className="input" placeholder="Ex: Salário, Conta de luz..." value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">Valor (R$)</label>
                  <input className="input" type="number" min="0" step="0.01" placeholder="0,00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Data</label>
                  <input className="input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={close}>Cancelar</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? 'Salvando...' : editing ? 'Salvar Alterações' : 'Adicionar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
