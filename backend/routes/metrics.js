const express = require('express');
const router = express.Router();
const db = require('../db/database');

function calcRate(n, d) {
  if (!d || d === 0) return 0;
  return parseFloat(((n / d) * 100).toFixed(2));
}

router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT m.*, p.name as project_name, p.color as project_color
      FROM metrics m
      JOIN projects p ON p.id = m.project_id
      ORDER BY p.name, COALESCE(m.week_start, make_date(m.year, COALESCE(m.month,1), 1)) ASC
    `);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:projectId', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT m.*, p.name as project_name, p.color as project_color
      FROM metrics m
      JOIN projects p ON p.id = m.project_id
      WHERE m.project_id = $1
      ORDER BY COALESCE(m.week_start, make_date(m.year, COALESCE(m.month,1), 1)) ASC
    `, [req.params.projectId]);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  const { project_id, month, year, week_start, week_label, month_label,
          sends, opens, clicks, unsubs, bounces } = req.body;

  if (!project_id || !year)
    return res.status(400).json({ error: 'project_id e year são obrigatórios' });

  const s = parseInt(sends)  || 0;
  const o = parseInt(opens)  || 0;
  const c = parseInt(clicks) || 0;
  const u = parseInt(unsubs) || 0;
  const b = parseInt(bounces)|| 0;

  try {
    if (week_start) {
      // Modo semanal — upsert por (project_id, week_start)
      const { rows } = await db.query(`
        INSERT INTO metrics
          (project_id, year, month, week_start, week_label, month_label,
           sends, opens, clicks, unsubs, bounces,
           open_rate, ctr, unsub_rate, bounce_rate, updated_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,NOW())
        ON CONFLICT (project_id, week_start) DO UPDATE SET
          sends=$7, opens=$8, clicks=$9, unsubs=$10, bounces=$11,
          open_rate=$12, ctr=$13, unsub_rate=$14, bounce_rate=$15, updated_at=NOW()
        RETURNING *
      `, [project_id, year, month || null, week_start, week_label || null, month_label || null,
          s, o, c, u, b,
          calcRate(o,s), calcRate(c,s), calcRate(u,s), calcRate(b,s)]);
      return res.json(rows[0]);
    }

    // Modo legado mensal — insert simples
    const { rows } = await db.query(`
      INSERT INTO metrics
        (project_id, month, year, sends, opens, clicks, unsubs, bounces,
         open_rate, ctr, unsub_rate, bounce_rate, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW())
      RETURNING *
    `, [project_id, month, year, s, o, c, u, b,
        calcRate(o,s), calcRate(c,s), calcRate(u,s), calcRate(b,s)]);
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM metrics WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
