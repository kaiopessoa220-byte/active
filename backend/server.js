const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS: libera localhost (dev) + URL do Vercel (produção)
const allowedOrigins = [
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // permite chamadas sem origin (ex: curl, Postman)
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('CORS bloqueado: ' + origin));
  },
  credentials: true,
}));

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/api/projects', require('./routes/projects'));
app.use('/api/metrics',  require('./routes/metrics'));
app.use('/api/upload',   require('./routes/upload'));
app.use('/api/export',   require('./routes/export'));

app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
);

app.listen(PORT, () => {
  console.log(`\n🚀 ActiveMetrics API → http://localhost:${PORT}\n`);
});
