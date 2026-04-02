# 📊 ActiveMetrics

Sistema de consolidação e análise de métricas mensais de campanhas do ActiveCampaign.

---

## 🚀 Como Rodar Localmente

### Pré-requisitos
- Node.js 18+ instalado ([nodejs.org](https://nodejs.org))
- npm (já vem com o Node.js)

---

### Instalação

**1. Clone ou extraia o projeto:**
```bash
cd activemetrics
```

**2. Instale todas as dependências (frontend + backend):**
```bash
npm run setup
```

**3. Inicie o sistema completo:**
```bash
npm start
```

Isso abrirá automaticamente:
- 🖥️ **Frontend:** http://localhost:3000
- ⚙️ **Backend API:** http://localhost:3001

---

### Rodar separadamente (opcional)

**Backend apenas:**
```bash
npm run dev:backend
```

**Frontend apenas:**
```bash
npm run dev:frontend
```

---

## 📁 Estrutura do Projeto

```
activemetrics/
├── package.json              # Scripts raiz (concurrently)
├── README.md
│
├── backend/
│   ├── server.js             # Entry point Express
│   ├── package.json
│   ├── data/                 # Banco SQLite (criado automaticamente)
│   │   └── activemetrics.db
│   ├── uploads/              # Arquivos temporários de upload
│   ├── db/
│   │   └── database.js       # Schema e conexão SQLite
│   └── routes/
│       ├── projects.js       # CRUD de projetos
│       ├── metrics.js        # CRUD de métricas (upsert)
│       ├── upload.js         # Parse + processamento de planilhas
│       └── export.js         # Exportação .xlsx consolidado
│
└── frontend/
    ├── package.json
    ├── public/
    │   └── index.html
    └── src/
        ├── App.js            # Layout principal + roteamento
        ├── index.js          # React entry point
        ├── index.css         # Design system completo
        ├── components/
        │   ├── Sidebar.js    # Navegação lateral
        │   └── ProjectModal.js # Modal criar/editar projeto
        ├── pages/
        │   ├── DashboardPage.js  # Dashboard com gráficos
        │   ├── UploadPage.js     # Wizard de importação
        │   └── ProjectsPage.js   # Gerenciamento de projetos
        ├── hooks/
        │   └── useProjects.js    # Context global de projetos
        └── utils/
            ├── api.js        # Chamadas à API
            └── format.js     # Utilitários de formatação
```

---

## 🧩 Funcionalidades

### ✅ Upload e Importação
- Suporte a `.csv`, `.xlsx` e `.xls`
- Detecção automática de colunas (envios, aberturas, cliques, unsubs, bounces)
- Mapeamento manual via dropdown se necessário
- Wizard em 4 etapas com preview dos dados

### ✅ Projetos
- Criar, editar e excluir projetos
- Cor personalizada por projeto (usada nos gráficos e dashboard)

### ✅ Processamento
- Soma de todos os registros da planilha
- Cálculo automático de taxas (open rate, CTR, unsub rate, bounce rate)
- Upsert: atualiza sem duplicar se já existir registro para o mesmo mês/ano/projeto

### ✅ Dashboard
- Cards com totais e médias
- Gráfico de linha: evolução mensal de volume
- Gráfico de barras: comparação de taxas por período
- Tabela detalhada com todos os períodos
- Filtro por projeto
- Exportação para .xlsx

---

## 🛠️ Tecnologias

| Camada | Stack |
|--------|-------|
| Frontend | React 18 + CSS customizado |
| Gráficos | Recharts |
| Backend | Node.js + Express |
| Banco | SQLite (better-sqlite3) |
| Planilhas | SheetJS (xlsx) |
| Dev | concurrently + nodemon |

---

## 📤 Formato de Exportação

A planilha exportada contém:

| Projeto | Mês | Ano | Envios | Aberturas | Cliques | Unsubs | Bounces | Open Rate (%) | CTR (%) | Unsub Rate (%) | Bounce Rate (%) |

---

## 💡 Dicas

- O banco SQLite é criado automaticamente em `backend/data/activemetrics.db`
- Para resetar todos os dados: delete o arquivo `.db` e reinicie o backend
- Para usar PostgreSQL em produção: substitua `better-sqlite3` por `pg` e ajuste as queries (sintaxe é praticamente idêntica para este caso de uso)
- O frontend usa o proxy do `create-react-app` para redirecionar `/api/*` → `localhost:3001`
