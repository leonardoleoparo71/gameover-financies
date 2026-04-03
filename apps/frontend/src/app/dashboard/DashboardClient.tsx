'use client';

import { useEffect, useState, useCallback, memo, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { api, Summary, MonthlySnapshot } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import SalaryInput from '@/components/SalaryInput';
import styles from './page.module.css';

// Lazy load HistoryChart to fix SSR and performance
const HistoryChart = dynamic(() => import('./HistoryChart'), { 
  ssr: false, 
  loading: () => <div className="skeleton" style={{ height: '260px', width: '100%', borderRadius: 'var(--radius-lg)' }} /> 
});

const MONTH_NAMES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

function fmt(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const StatCard = memo(({ label, value, icon, className, sub, loading }: {
  label: string; value?: string; icon: string; className?: string; sub?: string; loading?: boolean;
}) => {
  if (loading) return (
    <div className={`stat-card ${className || ''}`}>
      <div className="skeleton" style={{ height: '12px', width: '40%', marginBottom: 'var(--space-2)' }} />
      <div className="skeleton" style={{ height: '32px', width: '80%', marginBottom: 'var(--space-2)' }} />
      <div className="skeleton" style={{ height: '10px', width: '50%' }} />
    </div>
  );

  return (
    <div className={`stat-card ${className || ''}`}>
      <span className="stat-icon">{icon}</span>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {sub && <div className="stat-delta">{sub}</div>}
    </div>
  );
});

StatCard.displayName = 'StatCard';

export default function DashboardClient({ initialSummary, initialSnapshots }: { initialSummary: Summary | null, initialSnapshots: MonthlySnapshot[] }) {
  const [summary, setSummary] = useState<Summary | null>(initialSummary);
  const [snapshots, setSnapshots] = useState<MonthlySnapshot[]>(initialSnapshots);
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(!initialSummary);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, snaps] = await Promise.all([
        api.getSummary(), 
        api.getSnapshots()
      ]);
      setSummary(s);
      setSnapshots(snaps);
    } catch {/* ignore */} finally {
      setTimeout(() => setLoading(false), 300); // Shorter delay
    }
  }, []);

  useEffect(() => { 
    if (!initialSummary) {
      load(); 
    }
  }, [load, initialSummary]);
  
  const handleSalaryUpdate = async () => {
    await refreshUser();
    load();
  };

  const chartData = useMemo(() => {
    return [...snapshots]
      .sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month)
      .slice(-6)
      .map(s => ({
        name: `${MONTH_NAMES[s.month - 1]}/${String(s.year).slice(2)}`,
        Renda: s.totalIncome,
        Gastos: s.totalExpense,
        Guardado: s.totalSaved,
      }));
  }, [snapshots]);

  const exportPDF = async () => {
    setExporting(true);
    try {
      const element = document.getElementById('dashboard-content');
      if (!element) return;
      
      // Lazy load das bibliotecas pesadas de PDF (Code Splitting)
      const [html2canvas, jsPDF] = await Promise.all([
        import('html2canvas').then(mod => mod.default),
        import('jspdf').then(mod => mod.default)
      ]);

      const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#020408' });
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

  return (
    <div className="animate-fade-in" id="dashboard-content" style={{ padding: '20px' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            {loading ? <span className="skeleton" style={{ width: '180px', height: '14px', display: 'inline-block' }} /> : `Visão geral de ${MONTH_NAMES[(summary?.month ?? 1) - 1]} ${summary?.year}`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button className="btn btn-secondary btn-sm" onClick={exportPDF} disabled={exporting || loading}>
            {exporting ? '⏳ Gerando...' : '📄 Exportar PDF'}
          </button>
          <button className="btn btn-secondary btn-sm" onClick={load} disabled={loading}>
            🔄 Atualizar
          </button>
        </div>
      </div>

      {!loading && (
        <div style={{ marginBottom: '24px', maxWidth: '400px' }}>
          <SalaryInput initialSalary={user?.salary} onUpdate={handleSalaryUpdate} />
        </div>
      )}

      {/* Stat Cards */}
      <div className={`grid-4 ${styles.statsGrid}`}>
        <StatCard
          loading={loading}
          label="Renda do Mês"
          value={fmt(summary?.totalIncome ?? 0)}
          icon="💰"
          className="income"
        />
        <StatCard
          loading={loading}
          label="Total de Gastos"
          value={fmt(summary?.totalExpense ?? 0)}
          icon="💸"
          className="expense"
          sub={`${summary?.spendRate?.toFixed(1) ?? 0}% da renda`}
        />
        <StatCard
          loading={loading}
          label="Valor Guardado"
          value={fmt(summary?.saved ?? 0)}
          icon="🏦"
          className={(summary?.saved ?? 0) >= 0 ? 'income' : 'expense'}
          sub={`${summary?.savingsRate?.toFixed(1) ?? 0}% da renda`}
        />
        <StatCard
          loading={loading}
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
          {loading ? (
             <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '10px' }}>
                <div className="skeleton" style={{ height: '14px', width: '90%' }} />
                <div className="skeleton" style={{ height: '14px', width: '80%' }} />
                <div className="skeleton" style={{ height: '14px', width: '85%' }} />
             </div>
          ) : summary && summary.insights.length > 0 ? (
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
              {loading ? <div className="skeleton" style={{ width: '40px', height: '14px' }} /> : <span className="text-red">{summary?.spendRate?.toFixed(1) ?? 0}%</span>}
            </div>
            <div className="progress-track">
              <div
                className="progress-fill red"
                style={{ width: loading ? '0%' : `${Math.min(summary?.spendRate ?? 0, 100)}%` }}
              />
            </div>
          </div>

          <div className={styles.distItem} style={{ marginTop: 'var(--space-4)' }}>
            <div className={styles.distLabel}>
              <span>Guardado</span>
              {loading ? <div className="skeleton" style={{ width: '40px', height: '14px' }} /> : <span className="text-green">{summary?.savingsRate?.toFixed(1) ?? 0}%</span>}
            </div>
            <div className="progress-track">
              <div
                className="progress-fill green"
                style={{ width: loading ? '0%' : `${Math.max(Math.min(summary?.savingsRate ?? 0, 100), 0)}%` }}
              />
            </div>
          </div>

          <div className="divider" />

          <div className={styles.distSummary}>
            <div className={styles.distPill} style={{ background: 'hsla(162, 84%, 39%, 0.12)', color: 'var(--brand-secondary)' }}>
              <span>✅ Guardado</span>
              {loading ? <div className="skeleton" style={{ width: '60px', height: '14px' }} /> : <strong>{fmt(summary?.saved ?? 0)}</strong>}
            </div>
            <div className={styles.distPill} style={{ background: 'hsla(0, 84%, 60%, 0.1)', color: 'var(--brand-danger)' }}>
              <span>💸 Gasto</span>
              {loading ? <div className="skeleton" style={{ width: '60px', height: '14px' }} /> : <strong>{fmt(summary?.totalExpense ?? 0)}</strong>}
            </div>
          </div>
        </div>
      </div>

      {/* History Chart */}
      <div className="card" style={{ marginTop: 'var(--space-5)' }}>
        <div className="card-header">
          <span className="card-title">📈 Histórico dos Últimos Meses</span>
        </div>
        {!loading && chartData.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">📈</span>
            <p className="empty-state-text">
              O histórico aparecerá aqui depois que você salvar o snapshot do mês.
            </p>
          </div>
        ) : (
          <HistoryChart data={loading ? [] : chartData} />
        )}
      </div>
    </div>
  );
}
