const express = require('express');
const router = express.Router();
const multer = require('multer');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const db = require('../db/database');

const upload = multer({
  dest: path.join(__dirname, '..', 'uploads'),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.csv', '.xlsx', '.xls'].includes(ext)) cb(null, true);
    else cb(new Error('Apenas .csv, .xlsx ou .xls são aceitos'));
  }
});

const COLUMN_MAPPINGS = {
  sends:  ['sent', 'envios', 'sends', 'enviados', 'total sent', 'total envios', 'número de envios', 'numero de envios'],
  opens:  ['opens', 'aberturas', 'opened', 'aberto', 'total opens', 'total aberturas', 'número de aberturas', 'numero de aberturas'],
  clicks: ['clicks', 'cliques', 'clicked', 'clicado', 'total clicks', 'total cliques', 'número de cliques', 'numero de cliques'],
  unsubs: ['unsub', 'descadastro', 'unsubscribe', 'descadastros', 'unsubscribed', 'opt-out', 'optout', 'cancelamento', 'número de cancelamento', 'numero de cancelamento'],
  bounces:['bounce', 'bounces', 'bounced', 'rejeicao', 'rejeição', 'número de bounces', 'numero de bounces'],
  date:   ['última data de envio', 'ultima data de envio', 'last send date', 'send date', 'data de envio', 'date sent']
};

function detectColumn(headers, type) {
  const keywords = COLUMN_MAPPINGS[type];
  for (const h of headers) {
    const normalized = h.toLowerCase().trim();
    if (keywords.some(k => normalized.includes(k))) return h;
  }
  return null;
}

// Retorna o domingo que inicia a semana de uma data
function getWeekStart(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  const day = d.getUTCDay(); // 0 = domingo
  d.setUTCDate(d.getUTCDate() - day);
  return d;
}

// Formata intervalo: "29/12 - 04/01"
function formatWeekRange(weekStart) {
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);
  const fmt = d => `${String(d.getUTCDate()).padStart(2,'0')}/${String(d.getUTCMonth()+1).padStart(2,'0')}`;
  return `${fmt(weekStart)} - ${fmt(weekEnd)}`;
}

const MONTHS_PT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

router.post('/parse', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });

  try {
    const wb = XLSX.readFile(req.file.path);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(ws, { defval: '' });

    fs.unlinkSync(req.file.path);

    if (!data.length) return res.status(400).json({ error: 'Planilha vazia' });

    const headers = Object.keys(data[0]);
    const preview = data.slice(0, 5);

    const suggested = {};
    for (const type of Object.keys(COLUMN_MAPPINGS)) {
      suggested[type] = detectColumn(headers, type);
    }

    res.json({ headers, preview, suggested, total_rows: data.length, raw_data: data });
  } catch (e) {
    if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: e.message });
  }
});

router.post('/process', (req, res) => {
  const { raw_data, mapping } = req.body;
  if (!raw_data || !mapping) return res.status(400).json({ error: 'Dados inválidos' });

  const toNum = (val) => {
    if (val === '' || val === null || val === undefined) return 0;
    const n = parseFloat(String(val).replace(/[^0-9.-]/g, ''));
    return isNaN(n) ? 0 : n;
  };

  // Detecta coluna de nome para filtrar linha de totais do ActiveCampaign
  const nameCol = Object.keys(raw_data[0] || {}).find(k =>
    ['nome', 'name', 'campanha', 'campaign', 'assunto', 'subject'].some(kw =>
      k.toLowerCase().includes(kw)
    )
  );

  const calcRate = (n, d) => d > 0 ? parseFloat(((n / d) * 100).toFixed(2)) : 0;

  // Se tem coluna de data → agrupa por semana
  if (mapping.date) {
    const weekMap = {};

    for (const row of raw_data) {
      if (nameCol && (row[nameCol] === '' || row[nameCol] === null || row[nameCol] === undefined)) continue;

      const rawDate = row[mapping.date];
      if (!rawDate) continue;
      const weekStart = getWeekStart(rawDate);
      if (!weekStart) continue;

      const key = weekStart.toISOString().split('T')[0]; // YYYY-MM-DD
      if (!weekMap[key]) {
        weekMap[key] = {
          week_start: key,
          week_label: formatWeekRange(weekStart),
          month: MONTHS_PT[weekStart.getUTCMonth()],
          year: weekStart.getUTCFullYear(),
          sends: 0, opens: 0, clicks: 0, unsubs: 0, bounces: 0
        };
      }

      weekMap[key].sends   += toNum(row[mapping.sends]);
      weekMap[key].opens   += toNum(row[mapping.opens]);
      weekMap[key].clicks  += toNum(row[mapping.clicks]);
      weekMap[key].unsubs  += toNum(row[mapping.unsubs]);
      weekMap[key].bounces += toNum(row[mapping.bounces]);
    }

    const weeks = Object.values(weekMap).map(w => ({
      ...w,
      sends:   Math.round(w.sends),
      opens:   Math.round(w.opens),
      clicks:  Math.round(w.clicks),
      unsubs:  Math.round(w.unsubs),
      bounces: Math.round(w.bounces),
      open_rate:   calcRate(w.opens,  w.sends),
      ctr:         calcRate(w.clicks, w.sends),
      unsub_rate:  calcRate(w.unsubs, w.sends),
      bounce_rate: calcRate(w.bounces,w.sends),
    }));

    // Totais para exibir no preview
    const totals = weeks.reduce((acc, w) => ({
      sends:   acc.sends   + w.sends,
      opens:   acc.opens   + w.opens,
      clicks:  acc.clicks  + w.clicks,
      unsubs:  acc.unsubs  + w.unsubs,
      bounces: acc.bounces + w.bounces,
    }), { sends:0, opens:0, clicks:0, unsubs:0, bounces:0 });

    return res.json({
      mode: 'weekly',
      weeks,
      rows_processed: raw_data.filter(r => nameCol ? (r[nameCol] !== '' && r[nameCol] !== null && r[nameCol] !== undefined) : true).length,
      ...totals,
      open_rate:   calcRate(totals.opens,  totals.sends),
      ctr:         calcRate(totals.clicks, totals.sends),
      unsub_rate:  calcRate(totals.unsubs, totals.sends),
      bounce_rate: calcRate(totals.bounces,totals.sends),
    });
  }

  // Sem coluna de data → comportamento original (agrega tudo)
  let sends = 0, opens = 0, clicks = 0, unsubs = 0, bounces = 0, rows_processed = 0;

  for (const row of raw_data) {
    if (nameCol && (row[nameCol] === '' || row[nameCol] === null || row[nameCol] === undefined)) continue;
    if (mapping.sends)   sends   += toNum(row[mapping.sends]);
    if (mapping.opens)   opens   += toNum(row[mapping.opens]);
    if (mapping.clicks)  clicks  += toNum(row[mapping.clicks]);
    if (mapping.unsubs)  unsubs  += toNum(row[mapping.unsubs]);
    if (mapping.bounces) bounces += toNum(row[mapping.bounces]);
    rows_processed++;
  }

  res.json({
    mode: 'monthly',
    sends: Math.round(sends), opens: Math.round(opens),
    clicks: Math.round(clicks), unsubs: Math.round(unsubs), bounces: Math.round(bounces),
    open_rate: calcRate(opens,sends), ctr: calcRate(clicks,sends),
    unsub_rate: calcRate(unsubs,sends), bounce_rate: calcRate(bounces,sends),
    rows_processed
  });
});

module.exports = router;
