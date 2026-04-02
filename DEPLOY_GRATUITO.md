# 🚀 Deploy Gratuito — Supabase + Render + Vercel

**Custo total: R$ 0,00** 🎉

| Serviço | O que faz | Plano grátis |
|---------|-----------|--------------|
| **Supabase** | Banco PostgreSQL | 500MB grátis, permanente |
| **Render** | Backend Node.js | Grátis (dorme após 15min sem uso) |
| **Vercel** | Frontend React | Grátis permanente |

> ⚠️ **Sobre o "sono" do Render:** no plano grátis, o backend "dorme" se ficar 15min sem receber requests. Na próxima visita, ele acorda em ~20-30 segundos. Para uso interno isso é aceitável — se incomodar, o plano pago do Render é $7/mês.

---

## PARTE 1 — GitHub (obrigatório para os 3 serviços)

### 1.1 Crie uma conta no GitHub
→ https://github.com (se já tiver, pule)

### 1.2 Crie um repositório
1. Acesse https://github.com/new
2. **Repository name:** `activemetrics`
3. **Visibility:** Private ✅
4. Clique em **Create repository**

### 1.3 Suba o código
Abra o terminal dentro da pasta `activemetrics` e execute:

```bash
git init
git add .
git commit -m "primeiro commit"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/activemetrics.git
git push -u origin main
```
> Troque `SEU_USUARIO` pelo seu usuário do GitHub

---

## PARTE 2 — Supabase (Banco de Dados)

### 2.1 Crie sua conta
→ https://supabase.com → **Start for free** → entre com GitHub

### 2.2 Crie um novo projeto
1. Clique em **New project**
2. **Name:** `activemetrics`
3. **Database Password:** crie uma senha forte e **anote ela** 🔑
4. **Region:** South America (São Paulo) — mais próximo
5. Clique em **Create new project** e aguarde ~2 minutos

### 2.3 Crie as tabelas
1. No menu lateral, clique em **SQL Editor**
2. Clique em **New query**
3. Cole o SQL abaixo e clique em **Run** ▶️

```sql
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS metrics (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  sends INTEGER DEFAULT 0,
  opens INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  unsubs INTEGER DEFAULT 0,
  bounces INTEGER DEFAULT 0,
  open_rate REAL DEFAULT 0,
  ctr REAL DEFAULT 0,
  unsub_rate REAL DEFAULT 0,
  bounce_rate REAL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, month, year)
);
```

### 2.4 Pegue a connection string
1. Vá em **Project Settings** (ícone de engrenagem) → **Database**
2. Role até **Connection string** → selecione a aba **URI**
3. Copie a URL — ela será parecida com:
   ```
   postgresql://postgres:[SUA-SENHA]@db.xxxxxxxxxxxx.supabase.co:5432/postgres
   ```
4. **Guarde essa URL** — você vai usar no Render 🔑

---

## PARTE 3 — Render (Backend)

### 3.1 Crie sua conta
→ https://render.com → **Get Started for Free** → entre com GitHub

### 3.2 Crie o serviço do backend
1. Clique em **New +** → **Web Service**
2. Conecte o repositório `activemetrics`
3. Preencha:

| Campo | Valor |
|-------|-------|
| **Name** | `activemetrics-backend` |
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `node server.js` |
| **Instance Type** | `Free` |

4. Role até **Environment Variables** e adicione:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | *(cole a URL do Supabase copiada no passo 2.4)* |
| `FRONTEND_URL` | *(deixe em branco por enquanto — preenche depois)* |

5. Clique em **Create Web Service**
6. Aguarde o deploy (~3 minutos) — status vai ficar **Live** ✅
7. **Anote a URL gerada** — ex: `https://activemetrics-backend.onrender.com` 🔑

---

## PARTE 4 — Vercel (Frontend)

### 4.1 Crie sua conta
→ https://vercel.com → **Sign Up** → entre com GitHub

### 4.2 Importe o projeto
1. Clique em **Add New** → **Project**
2. Importe o repositório `activemetrics`
3. Em **Root Directory**, clique em **Edit** e coloque: `frontend`
4. Em **Environment Variables**, adicione:

| Key | Value |
|-----|-------|
| `REACT_APP_API_URL` | `https://activemetrics-backend.onrender.com` |

> Use a URL do Render do passo 3.7 (sem barra no final)

5. Clique em **Deploy** e aguarde ~2 minutos ✅
6. **Anote a URL gerada** — ex: `https://activemetrics.vercel.app` 🔑

---

## PARTE 5 — Finalizar conexão do CORS

Agora que o frontend tem uma URL, volte ao Render para atualizar:

1. Acesse https://render.com → seu serviço `activemetrics-backend`
2. Vá em **Environment** → edite `FRONTEND_URL`
3. Cole a URL do Vercel: `https://activemetrics.vercel.app`
4. Clique em **Save Changes** — o Render vai redeployar automaticamente ✅

---

## ✅ Checklist Final

- [ ] Código no GitHub
- [ ] Supabase: projeto criado + tabelas criadas + URL copiada
- [ ] Render: backend deployado + `DATABASE_URL` e `NODE_ENV` configurados
- [ ] Vercel: frontend deployado + `REACT_APP_API_URL` configurado
- [ ] Render: `FRONTEND_URL` atualizado com URL do Vercel
- [ ] Acessar a URL do Vercel e testar 🎉

---

## 🔁 Como atualizar o sistema depois

```bash
git add .
git commit -m "descrição da mudança"
git push
```

Vercel e Render detectam o push e fazem deploy automático. ✅

---

## ❓ Problemas comuns

**Backend não responde (primeira vez):**
O Render pode demorar até 30s para "acordar" no plano grátis. Aguarde e recarregue.

**Erro "Failed to fetch" no frontend:**
- Confira se `REACT_APP_API_URL` no Vercel está correto e sem barra no final
- Confira se o backend no Render está com status **Live**

**Erro de CORS:**
- Confirme que `FRONTEND_URL` no Render é exatamente a URL do Vercel (com `https://`)

**Erro de banco:**
- Confirme que a `DATABASE_URL` do Supabase foi colada corretamente no Render
- Verifique se as tabelas foram criadas no SQL Editor do Supabase

**Ver logs do backend:**
No Render → seu serviço → aba **Logs** — mostra erros em tempo real
