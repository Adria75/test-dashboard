# Jira Proxy

Petit servidor Node.js que fa de proxy entre el dashboard i l'API de Jira per evitar problemes de CORS.

## Setup

```bash
cd jira-proxy
npm install

# Configurar credencials
cp .env.example .env
# Editar .env amb les teves credencials de Jira
```

## Obtenir API Token de Jira

1. Ve a https://id.atlassian.com/manage-profile/security/api-tokens
2. Clica **"Create API token"**
3. Dona-li un nom (ex: "Test Dashboard")
4. Copia el token i posa'l a `.env`

## Executar

```bash
npm start
```

El proxy correrà a `http://localhost:3001`

## Endpoints

- `GET /issues` - Obtenir issues amb status "En test"
- `GET /issues/:key` - Obtenir detalls d'una issue
- `POST /issues/:key/comment` - Afegir comentari a una issue

## Ús amb el dashboard

El frontend (React) cridarà a `http://localhost:3001` en comptes de directe a Jira.

**Important:** Has de tenir el proxy corrent mentre fas servir el dashboard!

```bash
# Terminal 1 (proxy)
cd jira-proxy
npm start

# Terminal 2 (dashboard)
cd ..
npm run dev
```
