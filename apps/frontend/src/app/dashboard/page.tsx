'use client';

import { useEffect, useState, useCallback } from 'react';
import { api, Summary, MonthlySnapshot } from '@/lib/api';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import styles from './page.module.css';

const MONTH_NAMES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

function fmt(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function StatCard({ label, value, icon, className, sub }: {
  label: string; value: string; icon: string; className?: string; sub?: string;
}) {
  return (
    <div className={`stat-card ${className || ''}`}>
      <span className="stat-icon">{icon}</span>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {sub && <div className="stat-delta">{sub}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [snapshots, setSnapshots] = useState<MonthlySnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, snaps] = await Promise.all([api.getSummary(), api.getSnapshots()]);
      setSummary(s);
      setSnapshots(snaps);
    } catch {/* ignore */} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const chartData = [...snapshots]
    .sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month)
    .slice(-6)
    .map(s => ({
      name: `${MONTH_NAMES[s.month - 1]}/${String(s.year).slice(2)}`,
      Renda: s.totalIncome,
      Gastos: s.totalExpense,
      Guardado: s.totalSaved,
    }));

  const exportPDF = async () => {
    setExporting(true);
    try {
      const element = document.getElementById('dashboard-content');
      if (!element) return;
      const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#0f1117' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`GameOver_Resumo_${summary?.month}_${summary?.year}.pdf`);
    } catch (e) {
      alert('Erro ao exportar PDF');
    } finally {
      setExporting(false);
    }
  };

  if (loading) return (
    <div className={styles.loading}>
      <div className={styles.spinner} />
      <span>Carregando dados...</span>
    </div>
  );

  return (
    <div className="animate-fade-in" id="dashboard-content" style={{ padding: '20px' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Visão geral de {MONTH_NAMES[(summary?.month ?? 1) - 1]} {summary?.year}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary btn-sm" onClick={exportPDF} disabled={exporting}>
            {exporting ? '⏳ Gerando...' : '📄 Exportar PDF'}
          </button>
          <button className="btn btn-secondary btn-sm" onClick={load}>
            🔄 Atualizar
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className={`grid-4 ${styles.statsGrid}`}>
        <StatCard
          label="Renda do Mês"
          value={fmt(summary?.totalIncome ?? 0)}
          icon="💰"
          className="income"
        />
        <StatCard
          label="Total de Gastos"
          value={fmt(summary?.totalExpense ?? 0)}
          icon="💸"
          className="expense"
          sub={`${summary?.spendRate?.toFixed(1) ?? 0}% da renda`}
        />
        <StatCard
          label="Valor Guardado"
          value={fmt(summary?.saved ?? 0)}
          icon="🏦"
          className={(summary?.saved ?? 0) >= 0 ? 'income' : 'expense'}
          sub={`${summary?.savingsRate?.toFixed(1) ?? 0}% da renda`}
        />
        <StatCard
          label="Compras Futuras"
          value={fmt(summary?.totalPurchasesCost ?? 0)}
          icon="🛒"
          className="goal"
          sub="Total planejado"
        />
      </div>

      {/* Two-column below */}
      <div className={styles.gridBelow}>

        {/* Insights */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">🧠 Resumo Inteligente</span>
          </div>
          {summary && summary.insights.length > 0 ? (
            <ul className={styles.insightList}>
              {summary.insights.map((ins, i) => (
                <li key={i} className={styles.insightItem}>{ins}</li>
              ))}
            </ul>
          ) : (
            <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
              <span className="empty-state-icon">💡</span>
              <p className="empty-state-text">Adicione transações para receber seus primeiros insights.</p>
            </div>
          )}
        </div>

        {/* Balance Progress */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">📊 Distribuição</span>
          </div>

          <div className={styles.distItem}>
            <div className={styles.distLabel}>
              <span>Gastos</span>
              <span className="text-red">{summary?.spendRate?.toFixed(1) ?? 0}%</span>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill red"
                style={{ width: `${Math.min(summary?.spendRate ?? 0, 100)}%` }}
              />
            </div>
          </div>

          <div className={styles.distItem} style={{ marginTop: 'var(--space-4)' }}>
            <div className={styles.distLabel}>
              <span>Guardado</span>
              <span className="text-green">{summary?.savingsRate?.toFixed(1) ?? 0}%</span>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill green"
                style={{ width: `${Math.max(Math.min(summary?.savingsRate ?? 0, 100), 0)}%` }}
              />
            </div>
          </div>

          <div className="divider" />

          <div className={styles.distSummary}>
            <div className={styles.distPill} style={{ background: 'rgba(16,185,129,0.12)', color: 'var(--brand-secondary)' }}>
              <span>✅ Guardado</span>
              <strong>{fmt(summary?.saved ?? 0)}</strong>
            </div>
            <div className={styles.distPill} style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--brand-danger)' }}>
              <span>💸 Gasto</span>
              <strong>{fmt(summary?.totalExpense ?? 0)}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* History Chart */}
      {chartData.length > 0 && (
        <div className="card" style={{ marginTop: 'var(--space-5)' }}>
          <div className="card-header">
            <span className="card-title">📈 Histórico dos Últimos Meses</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="gradRenda" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradGastos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradGuardado" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false}
                tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: '10px', color: 'var(--text-primary)' }}
                formatter={(v: number) => fmt(v)}
              />
              <Legend wrapperStyle={{ color: 'var(--text-secondary)', fontSize: 12 }} />
              <Area type="monotone" dataKey="Renda" stroke="#10b981" strokeWidth={2} fill="url(#gradRenda)" dot={false} />
              <Area type="monotone" dataKey="Gastos" stroke="#ef4444" strokeWidth={2} fill="url(#gradGastos)" dot={false} />
              <Area type="monotone" dataKey="Guardado" stroke="#6366f1" strokeWidth={2} fill="url(#gradGuardado)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {chartData.length === 0 && (
        <div className="card" style={{ marginTop: 'var(--space-5)' }}>
          <div className="empty-state">
            <span className="empty-state-icon">📈</span>
            <p className="empty-state-text">
              O histórico aparecerá aqui depois que você salvar o snapshot do mês. Use o botão no menu de Despesas.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
