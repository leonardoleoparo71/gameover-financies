'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import ReactFlow, {
  Background, Controls, Edge, Node, addEdge,
  applyNodeChanges, applyEdgeChanges, Connection, NodeChange, EdgeChange,
  MarkerType, Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import { api, TreeNode } from '@/lib/api';
import styles from './page.module.css';

interface FormData {
  title: string; description: string; status: 'pending'|'in_progress'|'done'; color: string; date: string; imageUrl: string; parentId: string;
}
const emptyForm: FormData = { title: '', description: '', status: 'pending', color: '', date: '', imageUrl: '', parentId: '' };

const STATUS_COLORS = {
  pending: 'var(--text-muted)',
  in_progress: 'var(--brand-accent)',
  done: 'var(--brand-secondary)'
};

const STATUS_LABELS = { pending: 'Pendente', in_progress: 'Em andamento', done: 'Concluído' };

export default function PlanningPage() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [rawNodes, setRawNodes] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<TreeNode | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [copiedNode, setCopiedNode] = useState<TreeNode | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getTree();
      setRawNodes(data);

      const rfNodes: Node[] = data.map(n => {
        const nodeColor = n.color || STATUS_COLORS[n.status];
        return {
          id: n.id,
          type: 'default',
          position: { x: n.positionX, y: n.positionY },
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
          data: {
            label: (
              <div className={styles.nodeContent} onDoubleClick={() => openEdit(n)}>
                <div className={styles.nodeHeader}>
                  <div className={styles.nodeStatus} style={{ background: nodeColor }} />
                  <strong>{n.title}</strong>
                </div>
                {n.date && <div className={styles.nodeDate}>{new Date(n.date).toLocaleDateString('pt-BR')}</div>}
              </div>
            )
          },
          style: {
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            border: `1px solid ${nodeColor}`,
            borderRadius: '8px',
            padding: '10px',
            width: 200,
            boxShadow: 'var(--shadow-md)',
          }
        };
      });

      const rfEdges: Edge[] = data.filter(n => n.parentId).map(n => {
        const nodeColor = n.color || STATUS_COLORS[n.status];
        return {
          id: `e${n.parentId}-${n.id}`,
          source: n.parentId!,
          target: n.id,
          animated: n.status === 'in_progress',
          style: { stroke: nodeColor, strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: nodeColor }
        };
      });

      setNodes(rfNodes);
      setEdges(rfEdges);
    } catch {/**/} finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { load(); }, [load]);

  const onNodesChange = useCallback((chs: NodeChange[]) => setNodes(nds => applyNodeChanges(chs, nds)), []);
  const onEdgesChange = useCallback((chs: EdgeChange[]) => setEdges(eds => applyEdgeChanges(chs, eds)), []);

  const onConnect = useCallback(async (conn: Connection) => {
    if (!conn.source || !conn.target) return;
    setEdges(eds => addEdge({ ...conn, animated: true }, eds));
    try { await api.updateNode(conn.target, { parentId: conn.source }); } catch { load(); }
  }, [load]);

  const onNodeDragStop = useCallback(async (_: any, node: Node) => {
    try { await api.updateNode(node.id, { positionX: node.position.x, positionY: node.position.y }); } catch {/**/}
  }, []);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setError(''); setShowModal(true); };
  const openEdit = (n: TreeNode) => {
    setEditing(n);
    setForm({ title: n.title, description: n.description || '', status: n.status, color: n.color || '', date: n.date ? n.date.split('T')[0] : '', imageUrl: n.imageUrl || '', parentId: n.parentId || '' });
    setError(''); setShowModal(true);
  };
  const close = () => { setShowModal(false); setEditing(null); };

  const handleKeyDown = useCallback(async (e: React.KeyboardEvent) => {
    const selectedNode = nodes.find(n => n.selected);
    const rawNode = rawNodes.find(n => n.id === selectedNode?.id);

    // Copy
    if ((e.ctrlKey || e.metaKey) && e.key === 'c' && rawNode) {
      setCopiedNode(rawNode);
    }

    // Paste
    if ((e.ctrlKey || e.metaKey) && e.key === 'v' && copiedNode) {
      const payload = { ...copiedNode, title: `${copiedNode.title} (Cópia)`, positionX: copiedNode.positionX + 30, positionY: copiedNode.positionY + 30, parentId: copiedNode.parentId || undefined };
      await api.createNode(payload as any);
      load();
    }

    // Duplicate
    if ((e.ctrlKey || e.metaKey) && e.key === 'd' && rawNode) {
      e.preventDefault();
      const payload = { ...rawNode, title: `${rawNode.title} (Cópia)`, positionX: rawNode.positionX + 30, positionY: rawNode.positionY + 30, parentId: rawNode.parentId || undefined };
      await api.createNode(payload as any);
      load();
    }
  }, [nodes, rawNodes, copiedNode, load]);

  const save = async () => {
    if (!form.title) { setError('Título é obrigatório'); return; }
    setSaving(true); setError('');
    try {
      const payload = { ...form, parentId: form.parentId || undefined, color: form.color || undefined, date: form.date || undefined };
      if (editing) await api.updateNode(editing.id, payload);
      else await api.createNode({ ...payload, positionX: Math.random() * 200, positionY: Math.random() * 200 });
      await load(); close();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Erro ao salvar'); }
    finally { setSaving(false); }
  };

  const remove = async () => {
    if (!editing || !confirm('Remover este nó?')) return;
    setSaving(true);
    try { await api.deleteNode(editing.id); await load(); close(); }
    catch { alert('Erro ao remover'); setSaving(false); }
  };

  if (loading && nodes.length === 0) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div style={{ height: 'calc(100vh - 4rem)', display: 'flex', flexDirection: 'column' }}>
      <div className="page-header" style={{ marginBottom: '1rem' }}>
        <div>
          <h1 className="page-title">Árvore de Planejamento</h1>
          <p className="page-subtitle">Crie nós, arraste para organizar e conecte para criar dependências.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Novo Nó</button>
      </div>

      <div 
        style={{ flex: 1, border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'var(--bg-card)' }}
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDragStop={onNodeDragStop}
          fitView
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#fff" gap={16} size={1} />
          <Controls />
        </ReactFlow>
      </div>

      {showModal && (
        <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) close(); }}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">{editing ? 'Editar Nó' : 'Novo Nó'}</h3>
              <button className="btn btn-ghost btn-icon" onClick={close}>✕</button>
            </div>
            <div className="modal-body">
              {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)', color: 'var(--brand-danger)', fontSize: '0.875rem' }}>{error}</div>}

              <div className="form-group">
                <label className="form-label">Título *</label>
                <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))}>
                      {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Cor (Opcional)</label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input type="color" className="input" style={{ width: '50px', padding: '0 4px', height: '40px' }} value={form.color || '#6366f1'} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} />
                      {form.color && (
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setForm(f => ({ ...f, color: '' }))}>Limpar</button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Data Limite (opcional)</label>
                  <input className="input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                </div>

              <div className="form-group">
                <label className="form-label">Descrição (opcional)</label>
                <textarea className="textarea" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>

              <div className="form-group">
                <label className="form-label">Conectar a (Pai)</label>
                <select className="select" value={form.parentId} onChange={e => setForm(f => ({ ...f, parentId: e.target.value }))}>
                  <option value="">Nenhum (Nó raiz)</option>
                  {rawNodes.filter(n => n.id !== editing?.id).map(n => <option key={n.id} value={n.id}>{n.title}</option>)}
                </select>
                <span className="form-hint">Ou arraste as aslinhas no painel para conectar.</span>
              </div>
            </div>
            <div className="modal-footer" style={{ justifyContent: editing ? 'space-between' : 'flex-end' }}>
              {editing && <button className="btn btn-danger" onClick={remove} disabled={saving}>🗑️ Excluir</button>}
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <button className="btn btn-secondary" onClick={close}>Cancelar</button>
                <button className="btn btn-primary" onClick={save} disabled={saving}>
                  {saving ? 'Salvando...' : editing ? 'Salvar' : 'Criar Nó'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
