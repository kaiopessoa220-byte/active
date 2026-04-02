import React, { useState } from 'react';
import { COLORS } from '../utils/format';
import { api } from '../utils/api';
import { useProjects } from '../hooks/useProjects';

export default function ProjectModal({ onClose, project }) {
  const { refresh } = useProjects();
  const [name, setName] = useState(project?.name || '');
  const [color, setColor] = useState(project?.color || COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    if (!name.trim()) return setError('Nome é obrigatório');
    setLoading(true);
    setError('');
    try {
      if (project) {
        await api.updateProject(project.id, { name: name.trim(), color });
      } else {
        await api.createProject({ name: name.trim(), color });
      }
      await refresh();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">
          <span>{project ? 'Editar Projeto' : 'Novo Projeto'}</span>
          <button onClick={onClose} className="btn btn-ghost btn-sm">✕</button>
        </div>

        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Nome do Projeto</label>
            <input
              className="form-control"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Newsletter Clientes"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Cor Principal</label>
            <div className="color-options">
              {COLORS.map(c => (
                <div
                  key={c}
                  className={`color-dot${color === c ? ' selected' : ''}`}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>

          {error && <div className="alert alert-error mb-4">⚠️ {error}</div>}

          <div className="flex gap-3 mt-4">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : null}
              {project ? 'Salvar' : 'Criar Projeto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
