const express = require('express');
const router = express.Router();
const XLSX = require('xlsx');
const db = require('../db/database');

router.get('/', async (req, res) => {
  const { project_id } = req.query;
  try {
    let query = `
      SELECT m.*, p.name as project_name
      FROM metrics m JOIN projects p ON p.id = m.project_id
    `;
    const params = [];
    if (project_id) { query += ' WHERE m.project_id = $1'; params.push(project_id); }
    query += ' ORDER BY p.name, COALESCE(m.week_start, make_date(m.year, COALESCE(m.month,1), 1)) ASC';

    const { rows } = await db.query(query, params);

    if (!rows.length) {
      return res.status(404).json({ error: 'Nenhum dado encontrado' });
    }

    // Agrupa por projeto
    const byProject = {};
    for (const r of rows) {
      if (!byProject[r.project_name]) byProject[r.project_name] = [];
      byProject[r.project_name].push(r);
    }

    const wb = XLSX.utils.book_new();

    for (const [projectName, metrics] of Object.entries(byProject)) {
      // Semanas como colunas
      const weeks = metrics.map(m => m.week_label || `${m.month}/${m.year}`);
      const numWeeks = weeks.length;

      // Monta array de arrays (sheet_from_array_of_arrays)
      const aoa = [];

      // Linha 1: título
      aoa.push(['Nuvant Performance', ...Array(numWeeks + 1).fill('')]);

      // Linha 2: subtítulo
      aoa.push(['INDICADORES DE DESEMPENHO', ...Array(numWeeks + 1).fill('')]);

      // Linha 3: vazia
      aoa.push([]);

      // Linha 4: cabeçalhos — Métrica | semana1 | semana2 | ... | Média
      aoa.push(['Métrica', ...weeks, 'Média']);

      // Linha 5: Mês de cada semana
      aoa.push(['Mês/Ano', ...metrics.map(m => m.month_label ? `${m.month_label}/${m.year}` : `${m.month}/${m.year}`), '']);

      // Helper: média ignorando zeros
      const avg = (arr) => {
        const nonZero = arr.filter(v => v > 0);
        if (!nonZero.length) return 0;
        return parseFloat((nonZero.reduce((a, b) => a + b, 0) / nonZero.length).toFixed(2));
      };

      const fmt = (v, isRate) => isRate ? `${v}%` : v;

      // Linhas de métricas
      const metricRows = [
        { label: 'Envios',          key: 'sends',        rate: false },
        { label: 'Aberturas',       key: 'opens',        rate: false },
        { label: 'Cliques',         key: 'clicks',       rate: false },
        { label: 'Unsubs',          key: 'unsubs',       rate: false },
        { label: 'Bounces',         key: 'bounces',      rate: false },
        { label: 'Open Rate (%)',   key: 'open_rate',    rate: true  },
        { label: 'CTR (%)',         key: 'ctr',          rate: true  },
        { label: 'Unsub Rate (%)',  key: 'unsub_rate',   rate: true  },
        { label: 'Bounce Rate (%)', key: 'bounce_rate',  rate: true  },
      ];

      for (const { label, key, rate } of metricRows) {
        const values = metrics.map(m => m[key] || 0);
        const media = avg(values);
        aoa.push([
          label,
          ...values.map(v => fmt(v, rate)),
          fmt(media, rate)
        ]);
      }

      const ws = XLSX.utils.aoa_to_sheet(aoa);

      // Larguras das colunas
      ws['!cols'] = [
        { wch: 18 },
        ...weeks.map(() => ({ wch: 14 })),
        { wch: 12 }
      ];

      // Nome da aba limitado a 31 chars (limite do Excel)
      const sheetName = projectName.slice(0, 31);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    }

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename="nuvant-indicadores.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
