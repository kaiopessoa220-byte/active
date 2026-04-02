import React from 'react';

const navItems = [
  { id: 'dashboard', icon: '📊', label: 'Dashboard' },
  { id: 'upload', icon: '⬆️', label: 'Importar Dados' },
  { id: 'projects', icon: '🗂️', label: 'Projetos' },
];

export default function Sidebar({ page, setPage }) {
  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-mark">
          <div className="logo-icon">📈</div>
          <div>
            <div className="logo-text">ActiveMetrics</div>
            <div className="logo-sub">Campaign Analytics</div>
          </div>
        </div>
      </div>
      <nav className="sidebar-nav">
        {navItems.map(item => (
          <button
            key={item.id}
            className={`nav-item${page === item.id ? ' active' : ''}`}
            onClick={() => setPage(item.id)}
          >
            <span className="icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
