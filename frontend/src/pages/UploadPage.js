import React, { useState, useRef } from 'react';
import { parseFile, processData } from '../utils/api';
import { api } from '../utils/api';
import { useProjects } from '../hooks/useProjects';
import { COLUMN_TYPES } from '../utils/format';

function StepIndicator({ step }) {
  const steps = ['Upload', 'Mapeamento', 'Confirmar', 'Concluído'];
  return (
    <div className="steps mb-8">
      {steps.map((s, i) => (
        <React.Fragment key={i}>
          <div className={`step${step === i ? ' active' : step > i ? ' done' : ''}`}>
            <div className="step-num">{step > i ? '✓' : i + 1}</div>
            <div className="step-label">{s}</div>
          </div>
          {i < steps.length - 1 && <div className={`step-line${step > i ? ' done' : ''}`} />}
        </React.Fragment>
      ))}
    </div>
  );
}

const DATE_COLUMN_HINTS = [
  'última data de envio', 'ultima data de envio',
  'last send date', 'send date', 'data de envio', 'date sent'
];

export default function UploadPage() {
  const { projects } = useProjects();
  const [step, setStep] = useState(0);
  const [file, setFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [parseResult, setParseResult] = useState(null);
  const [mapping, setMapping] = useState({});
  const [projectId, setProjectId] = useState('');
  const [processed, setProcessed] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef();

  function reset() {
    setStep(0); setFile(null); setParseResult(null);
    setMapping({}); setProcessed(null); setSaved(false); setError('');
    setProjectId('');
  }

  async function handleFile(f) {
    if (!f) return;
    setFile(f);
    setParsing(true);
    setError('');
    try {
      const result = await parseFile(f);
      // Auto-detecta coluna de data
      const dateCol = result.headers.find(h =>
        DATE_COLUMN_HINTS.some(hint => h.toLowerCase().includes(hint))
      ) || null;
      setParseResult(result);
      setMapping({ ...(result.suggested || {}), date: dateCol });
      setStep(1);
    } catch (e) {
      setError(e.message);
    } finally {
      setParsing(false);
    }
  }

  async function handleProcess() {
    setError('');
    if (!projectId) return setError('Selecione um projeto');
    try {
      const result = await processData(parseResult.raw_data, mapping);
      setProcessed(result);
      setStep(2);
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      if (processed.mode === 'weekly' && processed.weeks?.length > 0) {
        // Salva cada semana separadamente
        for (const w of processed.weeks) {
          await api.saveMetrics({
            project_id: parseInt(projectId),
            year: w.year,
            month: null,
            week_start: w.week_start,
            week_label: w.week_label,
            month_label: w.month,
            sends: w.sends,
            opens: w.opens,
            clicks: w.clicks,
            unsubs: w.unsubs,
            bounces: w.bounces,
          });
        }
      } else {
        await api.saveMetrics({
          project_id: parseInt(projectId),
          ...processed
        });
      }
      setSaved(true);
      setStep(3);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  const project = projects.find(p => p.id === parseInt(projectId));
  const isWeekly = processed?.mode === 'weekly';

  const allColumnTypes = [
    ...COLUMN_TYPES,
    { key: 'date', icon: '📅', label: 'Data de Envio' }
  ];

  return (
    <div className="page-content" style={{ maxWidth: 760 }}>
      <div className="mb-6">
        <h2 className="font-bold" style={{ fontSize: 20 }}>Importar Dados</h2>
        <p className="text-muted text-sm mt-2">Importe planilhas exportadas do ActiveCampaign</p>
      </div>

      <StepIndicator step={step} />

      {/* Step 0: Upload */}
      {step === 0 && (
        <div className="card">
          <div
            className={`upload-zone${dragOver ? ' drag-over' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
            onClick={() => inputRef.current.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              style={{ display: 'none' }}
              onChange={e => handleFile(e.target.files[0])}
            />
            {parsing ? (
              <>
                <div style={{ margin: '0 auto 16px', width: 40, height: 40 }} className="spinner" />
                <div className="upload-title">Analisando planilha...</div>
              </>
            ) : (
              <>
                <div className="upload-icon">📂</div>
                <div className="upload-title">Arraste o arquivo ou clique para selecionar</div>
                <div className="upload-sub">Suporte a .csv, .xlsx e .xls</div>
              </>
            )}
          </div>
          {error && <div className="alert alert-error mt-4">⚠️ {error}</div>}
        </div>
      )}

      {/* Step 1: Mapping */}
      {step === 1 && parseResult && (
        <div className="card">
          <h3 className="font-semibold mb-2" style={{ fontSize: 15 }}>Mapeamento de Colunas</h3>
          <p className="text-muted text-sm mb-6">
            Arquivo: <strong style={{ color: 'var(--text)' }}>{file?.name}</strong> — {parseResult.total_rows} linhas
          </p>

          {mapping.date && (
            <div className="alert alert-info mb-4" style={{ fontSize: 13 }}>
              📅 Coluna de data detectada — os dados serão agrupados <strong>por semana</strong> automaticamente.
            </div>
          )}

          <div className="mb-6">
            {allColumnTypes.map(ct => (
              <div key={ct.key} className="mapping-row">
                <div className="mapping-type">
                  <span>{ct.icon}</span>
                  <span>{ct.label}</span>
                </div>
                <select
                  className="form-control"
                  value={mapping[ct.key] || ''}
                  onChange={e => setMapping({ ...mapping, [ct.key]: e.target.value || null })}
                >
                  <option value="">— Ignorar —</option>
                  {parseResult.headers.map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="divider" />

          <h3 className="font-semibold mb-4" style={{ fontSize: 15 }}>Projeto</h3>

          <div className="mb-6" style={{ maxWidth: 280 }}>
            <label className="form-label">Projeto *</label>
            <select className="form-control" value={projectId} onChange={e => setProjectId(e.target.value)}>
              <option value="">Selecionar...</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          {error && <div className="alert alert-error mb-4">⚠️ {error}</div>}

          <div className="flex gap-3">
            <button className="btn btn-ghost" onClick={reset}>← Voltar</button>
            <button className="btn btn-primary" onClick={handleProcess}>
              Processar Dados →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Confirm */}
      {step === 2 && processed && (
        <div className="card">
          <div className="alert alert-info mb-6">
            📊 {processed.rows_processed} campanhas processadas
            {isWeekly && ` → ${processed.weeks.length} semana${processed.weeks.length > 1 ? 's' : ''} detectada${processed.weeks.length > 1 ? 's' : ''}`}
          </div>

          {isWeekly && (
            <div className="mb-6">
              <h3 className="font-semibold mb-3" style={{ fontSize: 15 }}>Semanas detectadas</h3>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Semana</th>
                      <th>Mês</th>
                      <th>Envios</th>
                      <th>Aberturas</th>
                      <th>Open Rate</th>
                      <th>Cliques</th>
                      <th>CTR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processed.weeks.map(w => (
                      <tr key={w.week_start}>
                        <td className="num">{w.week_label}</td>
                        <td>{w.month}/{w.year}</td>
                        <td className="num">{w.sends.toLocaleString('pt-BR')}</td>
                        <td className="num">{w.opens.toLocaleString('pt-BR')}</td>
                        <td><span className="badge badge-green">{w.open_rate}%</span></td>
                        <td className="num">{w.clicks.toLocaleString('pt-BR')}</td>
                        <td><span className="badge badge-blue">{w.ctr}%</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <h3 className="font-semibold mb-4" style={{ fontSize: 15 }}>
            Totais: {project?.name}
          </h3>

          <div className="grid-2 mb-6">
            {[
              { label: 'Envios', value: processed.sends?.toLocaleString('pt-BR'), color: '#6366f1' },
              { label: 'Aberturas', value: processed.opens?.toLocaleString('pt-BR'), color: '#10b981', rate: `${processed.open_rate}%` },
              { label: 'Cliques', value: processed.clicks?.toLocaleString('pt-BR'), color: '#06b6d4', rate: `${processed.ctr}%` },
              { label: 'Unsubs', value: processed.unsubs?.toLocaleString('pt-BR'), color: '#f59e0b', rate: `${processed.unsub_rate}%` },
              { label: 'Bounces', value: processed.bounces?.toLocaleString('pt-BR'), color: '#ef4444', rate: `${processed.bounce_rate}%` },
            ].map(m => (
              <div key={m.label} className="metric-card" style={{ '--card-accent': m.color }}>
                <div className="metric-label">{m.label}</div>
                <div className="metric-value">{m.value}</div>
                {m.rate && <div className="metric-rate">{m.rate} taxa</div>}
              </div>
            ))}
          </div>

          {error && <div className="alert alert-error mb-4">⚠️ {error}</div>}

          <div className="flex gap-3">
            <button className="btn btn-ghost" onClick={() => setStep(1)}>← Voltar</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <span className="spinner" /> : null}
              Salvar no Histórico
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Done */}
      {step === 3 && (
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 56, marginBottom: 20 }}>🎉</div>
          <h2 className="font-bold mb-3" style={{ fontSize: 22 }}>Dados Salvos!</h2>
          <p className="text-muted mb-6">
            Dados de <strong style={{ color: 'var(--text)' }}>{project?.name}</strong> importados com sucesso.
          </p>
          <div className="flex gap-3" style={{ justifyContent: 'center' }}>
            <button className="btn btn-ghost" onClick={reset}>Importar Outro</button>
            <button className="btn btn-primary" onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'dashboard' }))}>
              Ver Dashboard →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
