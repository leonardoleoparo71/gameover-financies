'use client';

import { useState, useEffect } from 'react';
import { api, User } from '@/lib/api';

interface SalaryInputProps {
  initialSalary?: number;
  onUpdate?: (newSalary: number) => void;
}

export default function SalaryInput({ initialSalary = 0, onUpdate }: SalaryInputProps) {
  const [salary, setSalary] = useState(initialSalary);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSalary(initialSalary);
  }, [initialSalary]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.updateProfile({ salary });
      setIsEditing(false);
      if (onUpdate) onUpdate(salary);
    } catch (err) {
      alert('Erro ao salvar salário');
    } finally {
      setLoading(false);
    }
  };

  if (!isEditing) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px',
        padding: '12px 16px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
        fontSize: '0.9rem'
      }}>
        <div style={{ flex: 1 }}>
          <span style={{ color: 'rgba(255,255,255,0.5)', display: 'block', fontSize: '0.75rem', marginBottom: '2px' }}>
            SALÁRIO MENSAL (BASE)
          </span>
          <strong style={{ fontSize: '1.1rem', color: 'var(--brand-secondary)' }}>
            {salary.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </strong>
        </div>
        <button 
          className="btn btn-ghost btn-sm" 
          onClick={() => setIsEditing(true)}
          style={{ padding: '6px 12px' }}
        >
          ✏️ Editar
        </button>
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'flex-end', 
      gap: '12px',
      padding: '16px',
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid var(--brand-secondary)',
      borderRadius: '12px',
    }}>
      <div style={{ flex: 1 }}>
        <label style={{ color: 'rgba(255,255,255,0.6)', display: 'block', fontSize: '0.75rem', marginBottom: '8px' }}>
          NOVO VALOR DO SALÁRIO
        </label>
        <input 
          type="number" 
          className="input" 
          value={salary} 
          onChange={(e) => setSalary(Number(e.target.value))}
          style={{ width: '100%', fontSize: '1rem' }}
          autoFocus
        />
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button 
          className="btn btn-ghost" 
          onClick={() => {
            setSalary(initialSalary);
            setIsEditing(false);
          }}
          disabled={loading}
        >
          Cancelar
        </button>
        <button 
          className="btn btn-primary" 
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? '...' : 'Salvar'}
        </button>
      </div>
    </div>
  );
}
