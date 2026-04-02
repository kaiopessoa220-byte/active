import React, { useState } from 'react';
import { useProjects } from '../hooks/useProjects';
import { api } from '../utils/api';
import ProjectModal from '../components/ProjectModal';

export default function ProjectsPage() {
  const { projects, loading, refresh } = useProjects();
  const [modal, setModal] = useState(null); // null | 'create' | project obj
  const [deleting, setDeleting] = useState(null);

  async function handleDelete(p) {
    if (!window.confirm(`Excluir "${p.name}" e todos os dados associados?`)) return;
    setDeleting(p.id);
    try {
      await api.deleteProject(p.id);
      await refresh();
    } catch (e) {
      alert(e.message);
    } finally {
      setDeleting(null);
    }
  }

  if (loading) return <div className="empty-state"><div className="spinner" style={{margin:'0 auto'}} /></div>;

  return (
    <div className="page-content">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-bold" style={{fontSize:20}}>Projetos</h2>
          <p className="text-muted text-sm mt-2">Gerencie os projetos de campanha</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('create')}>
          + Novo Projeto
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-icon">🗂️</div>
          <div className="empty-title">Nenhum projeto criado</div>
          <div className="empty-sub mb-4">Crie um projeto para começar a importar dados</div>
          <button className="btn btn-primary" onClick={() => setModal('create')}>Criar Primeiro Projeto</button>
        </div>
      ) : (
        <div className="grid-2">
          {projects.map(p => (
            <div key={p.id} className="card" style={{borderTop:`3px solid ${p.color}`}}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div style={{
                    width:40, height:40, borderRadius:10,
                    background:`${p.color}22`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:18
                  }}>📊</div>
                  <div>
                    <div className="font-semibold" style={{fontSize:15}}>{p.name}</div>
                    <div className="text-dim text-xs" style={{fontFamily:'JetBrains Mono, monospace'}}>
                      {p.color}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="btn btn-ghost btn-sm" onClick={() => setModal(p)}>Editar</button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(p)}
                    disabled={deleting === p.id}
                  >
                    {deleting === p.id ? <span className="spinner" /> : 'Excluir'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <ProjectModal
          project={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
