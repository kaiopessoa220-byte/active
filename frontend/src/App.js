import React, { useState, useEffect } from 'react';
import './index.css';
import Sidebar from './components/Sidebar';
import DashboardPage from './pages/DashboardPage';
import UploadPage from './pages/UploadPage';
import ProjectsPage from './pages/ProjectsPage';
import { ProjectsProvider } from './hooks/useProjects';

export default function App() {
  const [page, setPage] = useState('dashboard');

  useEffect(() => {
    const handler = (e) => setPage(e.detail);
    window.addEventListener('navigate', handler);
    return () => window.removeEventListener('navigate', handler);
  }, []);

  const titles = {
    dashboard: 'Dashboard',
    upload: 'Importar Dados',
    projects: 'Projetos',
  };

  return (
    <ProjectsProvider>
      <div className="app-layout">
        <Sidebar page={page} setPage={setPage} />
        <div className="main-content">
          <div className="topbar">
            <div className="page-title">{titles[page]}</div>
            <div className="text-dim text-xs font-mono">ActiveMetrics v1.0</div>
          </div>
          {page === 'dashboard' && <DashboardPage />}
          {page === 'upload' && <UploadPage />}
          {page === 'projects' && <ProjectsPage />}
        </div>
      </div>
    </ProjectsProvider>
  );
}
