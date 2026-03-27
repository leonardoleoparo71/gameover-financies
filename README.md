# FinPlan — Finanças Pessoais & Planejamento Visual

Sistema web completo para controle financeiro pessoal, planejamento de metas e organização visual em árvore.

## Stack

- **Frontend**: Next.js 14 + TypeScript + CSS puro
- **Backend**: Node.js + Express + Prisma
- **Banco**: PostgreSQL (local via Docker, produção via Neon)
- **Auth**: JWT em cookies httpOnly + bcrypt

## Rodando Localmente

### Pré-requisitos
- Node.js 20+
- Docker Desktop

### 1. Suba o banco e os serviços

```bash
docker-compose up --build
```

### 2. Ou rode sem Docker

```bash
# Backend
cd apps/backend
npm install
npx prisma migrate dev
npm run dev

# Frontend (outro terminal)
cd apps/frontend
npm install
npm run dev
```

## Estrutura

```
finplan/
├── apps/
│   ├── backend/     # Express API (porta 3001)
│   └── frontend/    # Next.js App (porta 3000)
├── docker-compose.yml
└── README.md
```

## Variáveis de Ambiente

### Backend (`apps/backend/.env`)
```
DATABASE_URL=postgresql://finplan:finplan_secret@localhost:5432/finplan
JWT_SECRET=seu_secret_aqui
PORT=3001
FRONTEND_URL=http://localhost:3000
```

### Frontend (`apps/frontend/.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```
