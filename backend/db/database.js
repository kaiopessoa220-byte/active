const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function init() {
  // Cria tabelas base
  await pool.query(`
    CREATE TABLE IF NOT EXISTS projects (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      color TEXT NOT NULL DEFAULT '#6366f1',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS metrics (
      id SERIAL PRIMARY KEY,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      month INTEGER,
      year INTEGER NOT NULL,
      week_start DATE,
      week_label TEXT,
      month_label TEXT,
      sends INTEGER DEFAULT 0,
      opens INTEGER DEFAULT 0,
      clicks INTEGER DEFAULT 0,
      unsubs INTEGER DEFAULT 0,
      bounces INTEGER DEFAULT 0,
      open_rate REAL DEFAULT 0,
      ctr REAL DEFAULT 0,
      unsub_rate REAL DEFAULT 0,
      bounce_rate REAL DEFAULT 0,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // Migrations para banco já existente
  await pool.query(`ALTER TABLE metrics ADD COLUMN IF NOT EXISTS week_start DATE;`);
  await pool.query(`ALTER TABLE metrics ADD COLUMN IF NOT EXISTS week_label TEXT;`);
  await pool.query(`ALTER TABLE metrics ADD COLUMN IF NOT EXISTS month_label TEXT;`);
  await pool.query(`ALTER TABLE metrics DROP CONSTRAINT IF EXISTS metrics_project_id_month_year_key;`);

  // Cria unique constraint por semana (só se não existir)
  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'metrics_project_week_unique'
      ) THEN
        ALTER TABLE metrics
          ADD CONSTRAINT metrics_project_week_unique
          UNIQUE (project_id, week_start);
      END IF;
    END $$;
  `);

  console.log('✅ Banco de dados inicializado');
}

init().catch(console.error);

module.exports = pool;
