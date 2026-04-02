const express = require('express');
const router = express.Router();
const XLSX = require('xlsx');
const db = require('../db/database');

// Cores da paleta original
const COLORS = {
  headerBg:     '1F3864', // azul escuro título
  headerText:   'FFFFFF',
  subHeaderBg:  '2E75B6', // azul médio subtítulo
  subHeaderText:'FFFFFF',
  colHeaderBg:  '1F3864', // azul escuro colunas
  colHeaderText:'FFFFFF',
  monthBg:      '2E75B6',
  monthText:    'FFFFFF',
  rowAlt:       'D6E4F0', // azul claro linhas pares
  rowWhite:     'FFFFFF',
  rateRowBg:    'EBF3FB', // azul bem claro taxas
  avgBg:        'BDD7EE', // azul médio claro média
  labelBg:      'D6E4F0',
  border:       '2E75B6',
};

function cell(ws, r, c, value, style) {
  const addr = XLSX.utils.encode_cell({ r, c });
  ws[addr] = { v: value, t: typeof value === 'number' ? 'n' : 's', s: style };
}

function buildStyle({ bgColor, fontColor, bold, fontSize, hAlign, border, wrapText } = {}) {
  const s = {};
  if (bgColor) s.fill = { fgColor: { rgb: bgColor }, patternType: 'solid' };
  s.font = {
    name: 'Arial',
    sz: fontSize || 10,
    bold: bold || false,
    color: { rgb: fontColor || '000000' }
  };
  s.alignment = {
    horizontal: hAlign || 'left',
    vertical: 'center',
    wrapText: wrapText || false
  };
  if (border) {
    const b = { style: 'thin', color: { rgb: COLORS.border } };
    s.border = { top: b, bottom: b, left: b, right: b };
  }
  return s;
}

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
    if (!rows.length) return res.status(404).json({ error: 'Nenhum dado encontrado' });

    const byProject = {};
    for (const r of rows) {
      if (!byProject[r.project_name]) byProject[r.project_name] = [];
      byProject[r.project_name].push(r);
    }

    const wb = XLSX.utils.book_new();

    for (const [projectName, metrics] of Object.entries(byProject)) {
      const weeks = metrics.map(m => m.week_label || `${m.month}/${m.year}`);
      const monthLabels = metrics.map(m => m.month_label ? `${m.month_label}/${m.year}` : `${m.month}/${m.year}`);
      const numWeeks = weeks.length;
      const totalCols = numWeeks + 2; // label + semanas + média

      const ws = {};
      ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: 13, c: totalCols - 1 } });

      // Merges
      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } }, // título
        { s: { r: 1, c: 0 }, e: { r: 1, c: totalCols - 1 } }, // subtítulo
      ];

      // ROW 0: Título
      cell(ws, 0, 0, 'Nuvant Performance — Indicadores de Desempenho', buildStyle({
        bgColor: COLORS.headerBg, fontColor: COLORS.headerText,
        bold: true, fontSize: 13, hAlign: 'center', border: true
      }));
      for (let c = 1; c < totalCols; c++) {
        cell(ws, 0, c, '', buildStyle({ bgColor: COLORS.headerBg, border: true }));
      }

      // ROW 1: Projeto
      cell(ws, 1, 0, `Projeto: ${projectName}`, buildStyle({
        bgColor: COLORS.subHeaderBg, fontColor: COLORS.subHeaderText,
        bold: true, fontSize: 11, hAlign: 'center', border: true
      }));
      for (let c = 1; c < totalCols; c++) {
        cell(ws, 1, c, '', buildStyle({ bgColor: COLORS.subHeaderBg, border: true }));
      }

      // ROW 2: vazia
      for (let c = 0; c < totalCols; c++) {
        cell(ws, 2, c, '', {});
      }

      // ROW 3: Cabeçalhos semanas
      cell(ws, 3, 0, 'Métrica', buildStyle({
        bgColor: COLORS.colHeaderBg, fontColor: COLORS.colHeaderText,
        bold: true, hAlign: 'center', border: true
      }));
      for (let i = 0; i < numWeeks; i++) {
        cell(ws, 3, i + 1, weeks[i], buildStyle({
          bgColor: COLORS.colHeaderBg, fontColor: COLORS.colHeaderText,
          bold: true, hAlign: 'center', border: true
        }));
      }
      cell(ws, 3, numWeeks + 1, 'Média', buildStyle({
        bgColor: COLORS.colHeaderBg, fontColor: COLORS.colHeaderText,
        bold: true, hAlign: 'center', border: true
      }));

      // ROW 4: Mês/Ano
      cell(ws, 4, 0, 'Mês/Ano', buildStyle({
        bgColor: COLORS.monthBg, fontColor: COLORS.monthText,
        bold: true, hAlign: 'center', border: true
      }));
      for (let i = 0; i < numWeeks; i++) {
        cell(ws, 4, i + 1, monthLabels[i], buildStyle({
          bgColor: COLORS.monthBg, fontColor: COLORS.monthText,
          hAlign: 'center', border: true
        }));
      }
      cell(ws, 4, numWeeks + 1, '', buildStyle({ bgColor: COLORS.monthBg, border: true }));

      // Métricas
      const metricRows = [
        { label: 'Envios',          key: 'sends',       rate: false },
        { label: 'Aberturas',       key: 'opens',       rate: false },
        { label: 'Cliques',         key: 'clicks',      rate: false },
        { label: 'Unsubs',          key: 'unsubs',      rate: false },
        { label: 'Bounces',         key: 'bounces',     rate: false },
        { label: 'Open Rate (%)',   key: 'open_rate',   rate: true  },
        { label: 'CTR (%)',         key: 'ctr',         rate: true  },
        { label: 'Unsub Rate (%)',  key: 'unsub_rate',  rate: true  },
        { label: 'Bounce Rate (%)', key: 'bounce_rate', rate: true  },
      ];

      const avg = (arr) => {
        const nonZero = arr.filter(v => v > 0);
        if (!nonZero.length) return 0;
        return parseFloat((nonZero.reduce((a, b) => a + b, 0) / nonZero.length).toFixed(2));
      };

      metricRows.forEach(({ label, key, rate }, idx) => {
        const rowIdx = 5 + idx;
        const isEven = idx % 2 === 0;
        const rowBg = rate ? COLORS.rateRowBg : (isEven ? COLORS.rowWhite : COLORS.rowAlt);
        const values = metrics.map(m => m[key] || 0);
        const media = avg(values);

        // Label
        cell(ws, rowIdx, 0, label, buildStyle({
          bgColor: COLORS.labelBg, bold: true, border: true
        }));

        // Valores
        for (let i = 0; i < numWeeks; i++) {
          const v = values[i];
          const display = rate ? `${v}%` : v;
          cell(ws, rowIdx, i + 1, display, buildStyle({
            bgColor: rowBg, hAlign: rate ? 'center' : 'right', border: true
          }));
        }

        // Média
        const mediaDisplay = rate ? `${media}%` : media;
        cell(ws, rowIdx, numWeeks + 1, mediaDisplay, buildStyle({
          bgColor: COLORS.avgBg, bold: true, hAlign: 'center', border: true
        }));
      });

      // Larguras fixas
      ws['!cols'] = [
        { wpx: 140 },
        ...weeks.map(() => ({ wpx: 110 })),
        { wpx: 90 }
      ];

      // Alturas
      ws['!rows'] = [
        { hpx: 30 }, // título
        { hpx: 22 }, // projeto
        { hpx: 8  }, // vazia
        { hpx: 22 }, // semanas
        { hpx: 20 }, // mês
        ...metricRows.map(() => ({ hpx: 20 }))
      ];

      XLSX.utils.book_append_sheet(wb, ws, projectName.slice(0, 31));
    }

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx', cellStyles: true });

    res.setHeader('Content-Disposition', 'attachment; filename="nuvant-indicadores.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
