const express = require('express');
const router = express.Router();
const XLSX = require('xlsx');
const db = require('../db/database');

const MONTHS_PT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

router.get('/', async (req, res) => {
  const { project_id } = req.query;
  try {
    let query = `
      SELECT m.*, p.name as project_name
      FROM metrics m JOIN projects p ON p.id = m.project_id
    `;
    const params = [];
    if (project_id) { query += ' WHERE m.project_id = $1'; params.push(project_id); }
    query += ' ORDER BY p.name, m.year ASC, m.month ASC';

    const { rows } = await db.query(query, params);

    const exportData = rows.map(r => ({
      'Projeto': r.project_name,
      'Mês': MONTHS_PT[r.month - 1],
      'Ano': r.year,
      'Envios': r.sends,
      'Aberturas': r.opens,
      'Cliques': r.clicks,
      'Unsubs': r.unsubs,
      'Bounces': r.bounces,
      'Open Rate (%)': r.open_rate,
      'CTR (%)': r.ctr,
      'Unsub Rate (%)': r.unsub_rate,
      'Bounce Rate (%)': r.bounce_rate,
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(exportData), 'Métricas');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename="activemetrics-export.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
