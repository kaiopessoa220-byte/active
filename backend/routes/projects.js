const express = require('express');
const router = express.Router();
const db = require('../db/database');

router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM projects ORDER BY name');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  const { name, color } = req.body;
  if (!name) return res.status(400).json({ error: 'Nome é obrigatório' });
  try {
    const { rows } = await db.query(
      'INSERT INTO projects (name, color) VALUES ($1, $2) RETURNING *',
      [name.trim(), color || '#6366f1']
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'Projeto já existe' });
    res.status(500).json({ error: e.message });
  }
});

router.put('/:id', async (req, res) => {
  const { name, color } = req.body;
  try {
    const { rows } = await db.query(
      'UPDATE projects SET name=$1, color=$2 WHERE id=$3 RETURNING *',
      [name, color, req.params.id]
    );
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM projects WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
