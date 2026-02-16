# 🧪 Escio Test Dashboard - VERSIÓ FINAL

Dashboard de gestió de tests per issues de Jira amb col·laboració en temps real.

## ✨ Funcionalitats

- ✅ **Kanban visual** per gestionar incidències de test
- 🔄 **Auto-refresh** cada 5 segons - col·laboració en temps real
- 🔗 **Integració Jira** - obté issues automàticament
- 🌙 **Mode fosc/clar**
- 📱 **Responsive**
- 🎯 **Drag & Drop** per moure cards entre columnes
- 🔍 **Filtres** per issue i tester
- 📤 **Exportar** resultats a Jira (comentaris automàtics)

---

## 📋 Prerequisites

- Node.js 18+
- npm
- Compte de Supabase (gratuït)
- Accés a Jira (API token)

---

## ⚙️ Setup Complet

### PART 1: Supabase (Base de dades)

#### 1. Crear projecte

1. Crea un compte a [supabase.com](https://supabase.com)
2. Crea un nou projecte: `escio-test-dashboard`
3. Anota les credencials (les necessitaràs després)

#### 2. Crear taula

A l'**SQL Editor** de Supabase, executa:

```sql
CREATE TABLE test_cards (
    id BIGSERIAL PRIMARY KEY,
    jira_issue_key TEXT NOT NULL,
    ref TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('error', 'dubte', 'proposta', 'ux')),
    summary TEXT NOT NULL,
    detail TEXT,
    status TEXT NOT NULL CHECK (status IN ('pendent', 'errors', 'tancat', 'descartat')),
    tester TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índex per rendiment
CREATE INDEX idx_test_cards_issue ON test_cards(jira_issue_key);

-- Desactivar RLS (Row Level Security)
ALTER TABLE test_cards DISABLE ROW LEVEL SECURITY;
```

#### 3. Obtenir credencials

Ve a **Project Settings** > **API** i copia:
- `Project URL` → `VITE_SUPABASE_URL`
- `anon public` key → `VITE_SUPABASE_ANON_KEY`

---

### PART 2: Jira Proxy

#### 1. Obtenir API Token

1. Ve a https://id.atlassian.com/manage-profile/security/api-tokens
2. Clica **"Create API token"**
3. Dona-li un nom: "Test Dashboard"
4. Copia el token (el necessitaràs després)

#### 2. Configurar el proxy

```bash
cd jira-proxy
npm install

# Crear .env amb les teves credencials
cp .env.example .env
```

Edita `jira-proxy/.env`:
```bash
JIRA_URL=https://escio.atlassian.net
JIRA_EMAIL=teu-email@escio.cat
JIRA_API_TOKEN=ATATT3xFfGF0...  # El token complet
```

---

### PART 3: Dashboard (Frontend)

```bash
# A l'arrel del projecte
npm install

# Crear .env.local amb totes les credencials
cp .env.example .env.local
```

Edita `.env.local`:
```bash
# Supabase (de la PART 1)
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...

# Jira Proxy (sempre localhost)
VITE_JIRA_PROXY_URL=http://localhost:3001
```

---

## 🚀 Executar

**Necessites 2 terminals:**

**Terminal 1 - Jira Proxy:**
```bash
cd jira-proxy
npm start
```

Hauria de mostrar:
```
🚀 Jira Proxy running on http://localhost:3001
📍 Jira URL: https://escio.atlassian.net
👤 Jira Email: teu-email@escio.cat
```

**Terminal 2 - Dashboard:**
```bash
# A l'arrel del projecte
npm run dev
```

Obre [http://localhost:5173](http://localhost:5173)

---

## 📖 Com funciona

### Flux de treball

1. **Issues apareixen automàticament** - Consulta Jira cada 30s per issues amb status "En test"
2. **Crear incidències** - Botó "+ Afegir incidència" per documentar errors/dubtes
3. **Moure cards** - Drag & drop entre columnes:
   - **⏳ Pendent de validar**: Espera re-validació després de corregir
   - **🔴 Errors**: Problemes actius
   - **✅ Tancat**: Validat i OK
   - **❌ Descartat**: No aplica / fora d'abast
4. **Col·laboració**: Altres testers veuen els canvis (auto-refresh cada 5s)
5. **Exportar** (pendent): Botó per publicar resultats com a comentari a Jira

---

## 🏗️ Estructura del projecte

```
escio-test-dashboard-FINAL/
├── src/
│   ├── App.tsx              # Component principal
│   ├── App.css              # Estils
│   ├── main.tsx             # Entry point
│   ├── components/
│   │   ├── JiraIssue.tsx    # Container d'issue + kanban
│   │   ├── KanbanColumn.tsx # Columna drag & drop
│   │   ├── TestCard.tsx     # Card individual
│   │   └── CreateCardModal.tsx # Modal creació
│   ├── hooks/
│   │   ├── useCards.ts      # CRUD cards (Supabase)
│   │   └── useJiraIssues.ts # Obtenir issues (Jira)
│   ├── lib/
│   │   ├── supabase.ts      # Client Supabase
│   │   └── jiraExport.ts    # Exportar a Jira
│   └── types/
│       ├── index.ts         # Tipus
│       └── database.ts      # Tipus Supabase
├── jira-proxy/
│   ├── server.js            # Proxy Node.js
│   ├── package.json
│   ├── .env.example
│   └── README.md
├── package.json
├── vite.config.ts
├── tsconfig.json
├── index.html
└── .env.example
```

---

## 🐛 Troubleshooting

### "Error connectant amb Jira"
- ✅ Verifica que el proxy està corrent (`cd jira-proxy && npm start`)
- ✅ Comprova credencials al `jira-proxy/.env`
- ✅ Verifica que l'API token és vàlid

### "No apareixen issues"
- ✅ Tens issues amb status "En test" a Jira?
- ✅ El proxy mostra "✅ Trobades X issues"?
- ✅ Mira la consola del navegador (F12)

### "Les cards no es guarden"
- ✅ Verifica credencials de Supabase al `.env.local`
- ✅ Comprova que la taula `test_cards` existeix
- ✅ RLS està desactivat? (ALTER TABLE test_cards DISABLE ROW LEVEL SECURITY)

### "CORS errors"
- ✅ Estàs usant el proxy (`http://localhost:3001`)?
- ✅ NO cridar directe a Jira des del frontend

---

## 🔮 Properes millores

- [ ] Botó visible "Exportar a Jira"
- [ ] Preview del comentari abans d'exportar
- [ ] Editar cards existents
- [ ] Eliminar cards
- [ ] Històric de canvis
- [ ] Notificacions

---

## 👥 Equip

Desenvolupat per l'equip d'Escio
Testing: Adrià, Yasiel, Eric, Marc, Anna

---

## 📝 Notes importants

- **Privacitat**: Les credencials no es pugen a Git
- **Local**: Tot corre en localhost (segur)
- **Col·laboració**: Supabase és la BD compartida
- **Jira**: Només lectura d'issues + escriptura de comentaris

---

## 🆘 Suport

Si tens problemes:
1. Revisa aquest README
2. Comprova la consola del navegador (F12)
3. Mira els logs del proxy (terminal 1)
4. Verifica les credencials (.env files)

**Pro tip:** Mantén els dos terminals visibles per veure els logs en temps real!
