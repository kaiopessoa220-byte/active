const express = require('express');
const router = express.Router();
const ExcelJS = require('exceljs');
const db = require('../db/database');

const LOGO_B64 = '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';

const C = {
  headerBg:    '1F3864',
  headerText:  'FFFFFFFF',
  subBg:       '2E75B6',
  subText:     'FFFFFFFF',
  colBg:       '1F3864',
  colText:     'FFFFFFFF',
  monthBg:     '2E75B6',
  monthText:   'FFFFFFFF',
  rowAlt:      'D6E4F0FF',
  rowWhite:    'FFFFFFFF',
  rateBg:      'EBF3FBFF',
  avgBg:       'BDD7EEFF',
  labelBg:     'D6E4F0FF',
  border:      '2E75B6',
};

function applyBorder(cell) {
  const thin = { style: 'thin', color: { argb: 'FF2E75B6' } };
  cell.border = { top: thin, left: thin, bottom: thin, right: thin };
}

function styleCell(cell, { bgArgb, fontArgb, bold, sz, hAlign, vAlign } = {}) {
  if (bgArgb) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } };
  cell.font = { name: 'Arial', size: sz || 10, bold: !!bold, color: { argb: fontArgb || 'FF000000' } };
  cell.alignment = { horizontal: hAlign || 'left', vertical: vAlign || 'middle', wrapText: false };
  applyBorder(cell);
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

    const wb = new ExcelJS.Workbook();
    wb.creator = 'Nuvant Performance';

    for (const [projectName, metrics] of Object.entries(byProject)) {
      const weeks = metrics.map(m => m.week_label || `${m.month}/${m.year}`);
      const monthLabels = metrics.map(m => m.month_label ? `${m.month_label}/${m.year}` : `${m.month}/${m.year}`);
      const numWeeks = weeks.length;
      const totalCols = numWeeks + 2;

      const ws = wb.addWorksheet(projectName.slice(0, 31));

      // Larguras fixas
      ws.getColumn(1).width = 20;
      for (let i = 2; i <= numWeeks + 1; i++) ws.getColumn(i).width = 16;
      ws.getColumn(numWeeks + 2).width = 13;

      // Logo
      const logoId = wb.addImage({ base64: LOGO_B64, extension: 'png' });
      ws.addImage(logoId, {
        tl: { col: 0, row: 0 },
        br: { col: 1, row: 2 },
        editAs: 'oneCell'
      });

      // ROW 1: header com logo + título
      ws.getRow(1).height = 35;
      const titleCell = ws.getCell(1, 2);
      ws.mergeCells(1, 2, 1, totalCols);
      titleCell.value = 'INDICADORES DE DESEMPENHO';
      styleCell(titleCell, { bgArgb: 'FF1F3864', fontArgb: 'FFFFFFFF', bold: true, sz: 14, hAlign: 'center' });
      // Preenche célula do logo
      const logoCell = ws.getCell(1, 1);
      styleCell(logoCell, { bgArgb: 'FF1F3864' });

      // Info lateral (Setor / Área / Responsável) — colunas finais linha 1
      // Simplificado: apenas fundo no header
      ws.getRow(2).height = 18;
      const subCell = ws.getCell(2, 2);
      ws.mergeCells(2, 2, 2, totalCols);
      subCell.value = `Projeto: ${projectName}   |   Área: Automação   |   Setor: Marketing`;
      styleCell(subCell, { bgArgb: 'FF2E75B6', fontArgb: 'FFFFFFFF', bold: false, sz: 10, hAlign: 'center' });
      styleCell(ws.getCell(2, 1), { bgArgb: 'FF2E75B6' });

      // ROW 3: vazia
      ws.getRow(3).height = 6;

      // ROW 4: cabeçalhos semanas
      ws.getRow(4).height = 22;
      styleCell(ws.getCell(4, 1), { bgArgb: 'FF1F3864', fontArgb: 'FFFFFFFF', bold: true, sz: 10, hAlign: 'center' });
      ws.getCell(4, 1).value = 'Resultados';
      for (let i = 0; i < numWeeks; i++) {
        const c = ws.getCell(4, i + 2);
        c.value = weeks[i];
        styleCell(c, { bgArgb: 'FF1F3864', fontArgb: 'FFFFFFFF', bold: true, sz: 10, hAlign: 'center' });
      }
      const avgHeader = ws.getCell(4, numWeeks + 2);
      avgHeader.value = 'Média/Trimestre';
      styleCell(avgHeader, { bgArgb: 'FF1F3864', fontArgb: 'FFFFFFFF', bold: true, sz: 10, hAlign: 'center' });

      // ROW 5: mês/ano
      ws.getRow(5).height = 18;
      styleCell(ws.getCell(5, 1), { bgArgb: 'FF2E75B6', fontArgb: 'FFFFFFFF', bold: true, sz: 10, hAlign: 'center' });
      for (let i = 0; i < numWeeks; i++) {
        const c = ws.getCell(5, i + 2);
        c.value = monthLabels[i];
        styleCell(c, { bgArgb: 'FF2E75B6', fontArgb: 'FFFFFFFF', sz: 10, hAlign: 'center' });
      }
      styleCell(ws.getCell(5, numWeeks + 2), { bgArgb: 'FF2E75B6', fontArgb: 'FFFFFFFF', sz: 10 });

      const metricRows = [
        { label: 'Nº de e-mails enviados', key: 'sends',       rate: false },
        { label: 'Nº de e-mails abertos',  key: 'opens',       rate: false },
        { label: 'Cliques',                key: 'clicks',      rate: false },
        { label: 'Unsubs',                 key: 'unsubs',      rate: false },
        { label: 'Bounces',                key: 'bounces',     rate: false },
        { label: 'Open Rate (%)',          key: 'open_rate',   rate: true  },
        { label: 'CTR (%)',                key: 'ctr',         rate: true  },
        { label: 'Unsub Rate (%)',         key: 'unsub_rate',  rate: true  },
        { label: 'Bounce Rate (%)',        key: 'bounce_rate', rate: true  },
      ];

      const avg = (arr) => {
        const nonZero = arr.filter(v => v > 0);
        if (!nonZero.length) return 0;
        return parseFloat((nonZero.reduce((a, b) => a + b, 0) / nonZero.length).toFixed(2));
      };

      metricRows.forEach(({ label, key, rate }, idx) => {
        const rowIdx = 6 + idx;
        ws.getRow(rowIdx).height = 18;
        const isEven = idx % 2 === 0;
        const rowBg = rate ? 'FFEBF3FB' : (isEven ? 'FFFFFFFF' : 'FFD6E4F0');
        const values = metrics.map(m => m[key] || 0);
        const media = avg(values);

        // Label
        const labelCell = ws.getCell(rowIdx, 1);
        labelCell.value = label;
        styleCell(labelCell, { bgArgb: 'FFD6E4F0', bold: true, sz: 10 });

        // Valores por semana
        for (let i = 0; i < numWeeks; i++) {
          const c = ws.getCell(rowIdx, i + 2);
          c.value = rate ? `${values[i]}%` : values[i];
          styleCell(c, { bgArgb: rowBg, hAlign: rate ? 'center' : 'right', sz: 10 });
        }

        // Média
        const avgCell = ws.getCell(rowIdx, numWeeks + 2);
        avgCell.value = rate ? `${media}%` : media;
        styleCell(avgCell, { bgArgb: 'FFBDD7EE', bold: true, hAlign: 'center', sz: 10 });
      });

      // Coloração condicional nas taxas (verde/vermelho como original)
      // Open Rate — linha 11 (rowIdx 11)
      const openRateRow = 11;
      for (let i = 2; i <= numWeeks + 1; i++) {
        const c = ws.getCell(openRateRow, i);
        const val = parseFloat(c.value);
        if (!isNaN(val)) {
          const bgArgb = val >= 20 ? 'FF92D050' : 'FFFF0000'; // verde se >= 20%, vermelho se abaixo
          const fontArgb = val >= 20 ? 'FF000000' : 'FFFFFFFF';
          styleCell(c, { bgArgb, fontArgb, hAlign: 'center', sz: 10 });
        }
      }
    }

    const buffer = await wb.xlsx.writeBuffer();

    res.setHeader('Content-Disposition', 'attachment; filename="nuvant-indicadores.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
