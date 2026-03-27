'use client';

import { useEffect, useState, useCallback } from 'react';
import { api, FuturePurchase } from '@/lib/api';
import Image from 'next/image';
import styles from './page.module.css';

function fmt(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

interface FormData {
  name: string; description: string; value: string; link: string; imageUrl: string;
}
const emptyForm: FormData = { name: '', description: '', value: '', link: '', imageUrl: '' };

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<FuturePurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<FuturePurchase | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try { setPurchases(await api.getPurchases()); }
    catch {/**/} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setError(''); setShowModal(true); };
  const openEdit = (p: FuturePurchase) => {
    setEditing(p);
    setForm({ name: p.name, description: p.description ?? '', value: String(p.value), link: p.link ?? '', imageUrl: p.imageUrl ?? '' });
    setError(''); setShowModal(true);
  };
  const close = () => { setShowModal(false); setEditing(null); };

  const save = async () => {
    if (!form.name || !form.value) { setError('Nome e valor são obrigatórios'); return; }
    setSaving(true); setError('');
    try {
      const payload = { ...form, value: parseFloat(form.value) };
      if (editing) await api.updatePurchase(editing.id, payload);
      else await api.createPurchase(payload);
      await load(); close();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Erro ao salvar'); }
    finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!confirm('Remover esta compra?')) return;
    await api.deletePurchase(id); await load();
  };

  const total = purchases.reduce((s, p) => s + p.value, 0);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Compras Futuras</h1>
          <p className="page-subtitle">
            {purchases.length} {purchases.length === 1 ? 'item planejado' : 'itens planejados'} · Total: {fmt(total)}
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Nova Compra</button>
      </div>

      {loading ? (
        <div className={styles.loading}><div className={styles.spinner} /></div>
      ) : purchases.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">🛒</span>
          <p className="empty-state-text">Nenhuma compra futura planejada ainda. Adicione itens que você quer comprar!</p>
          <button className="btn btn-primary" onClick={openCreate}>+ Adicionar</button>
        </div>
      ) : (
        <div className={`grid-auto`}>
          {purchases.map(p => (
            <div key={p.id} className={styles.purchaseCard}>
              {p.imageUrl && (
                <div className={styles.cardImg}>
                  <Image src={p.imageUrl} alt={p.name} fill style={{ objectFit: 'cover' }} unoptimized />
                </div>
              )}
              <div className={styles.cardBody}>
                <div className={styles.cardName}>{p.name}</div>
                {p.description && <p className={styles.cardDesc}>{p.description}</p>}
                <div className={styles.cardValue}>{fmt(p.value)}</div>
                {p.link && (
                  <a href={p.link} target="_blank" rel="noopener noreferrer" className={styles.cardLink}>
                    🔗 Ver produto
                  </a>
                )}
              </div>
              <div className={styles.cardActions}>
                <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(p)}>✏️</button>
                <button className="btn btn-ghost btn-sm btn-icon" onClick={() => remove(p.id)}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) close(); }}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">{editing ? 'Editar Compra' : 'Nova Compra Futura'}</h3>
              <button className="btn btn-ghost btn-icon" onClick={close}>✕</button>
            </div>
            <div className="modal-body">
              {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3) var(--space-4)', color: 'var(--brand-danger)', fontSize: '0.875rem' }}>{error}</div>}
              <div className="form-group">
                <label className="form-label">Nome *</label>
                <input className="input" placeholder="Ex: iPhone 15, Notebook..." value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Descrição</label>
                <textarea className="textarea" placeholder="Detalhes opcionais..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
              </div>
              <div className="form-group">
                <label className="form-label">Valor (R$) *</label>
                <input className="input" type="number" min="0" step="0.01" placeholder="0,00" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Link do Produto (URL)</label>
                <input className="input" type="url" placeholder="https://..." value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">URL da Imagem (opcional)</label>
                <input className="input" type="url" placeholder="https://..." value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={close}>Cancelar</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? 'Salvando...' : editing ? 'Salvar' : 'Adicionar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
