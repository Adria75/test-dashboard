import express from 'express';
import cors from 'cors';
import 'dotenv/config';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const JIRA_URL = process.env.JIRA_URL || 'https://escio.atlassian.net';
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;

if (!JIRA_EMAIL || !JIRA_API_TOKEN) {
  console.error('⚠️  JIRA_EMAIL i JIRA_API_TOKEN són necessaris al .env');
  process.exit(1);
}

const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');

// GET /issues - Obtenir issues "En test"
app.get('/issues', async (req, res) => {
  try {
    // Filtrar per board 226 i columnes de test
    // Les columnes són: "PER TEST / CR FET", "EN TEST", "PER CORREGIR / TEST PARCIAL"
    const jql = 'project = ESCIO AND status IN ("PER TEST", "EN TEST", "PER CORREGIR") ORDER BY updated DESC';

    // Nou endpoint: /rest/api/3/search/jql
    const response = await fetch(
        `${JIRA_URL}/rest/api/3/search/jql`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            jql: jql,
            fields: ['key', 'summary', 'status', 'assignee']
          })
        }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Jira error response:', errorText);
      throw new Error(`Jira API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    // Transformar a format simple
    const issues = data.issues.map(issue => ({
      key: issue.key,
      summary: issue.fields.summary,
      status: issue.fields.status.name,
      assignee: issue.fields.assignee?.displayName || null
    }));

    console.log(`✅ Trobades ${issues.length} issues al board 226`);
    res.json(issues);
  } catch (error) {
    console.error('Error fetching issues:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /issues/:key/comment - Afegir comentari a una issue
app.post('/issues/:key/comment', async (req, res) => {
  try {
    const { key } = req.params;
    const { body } = req.body;

    if (!body) {
      return res.status(400).json({ error: 'Body is required' });
    }

    const response = await fetch(
        `${JIRA_URL}/rest/api/3/issue/${key}/comment`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            body: {
              type: 'doc',
              version: 1,
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: body
                    }
                  ]
                }
              ]
            }
          })
        }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Jira API error: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /issues/:key - Obtenir detalls d'una issue
app.get('/issues/:key', async (req, res) => {
  try {
    const { key } = req.params;

    const response = await fetch(
        `${JIRA_URL}/rest/api/3/issue/${key}`,
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Accept': 'application/json'
          }
        }
    );

    if (!response.ok) {
      throw new Error(`Jira API error: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching issue:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Jira Proxy running on http://localhost:${PORT}`);
  console.log(`📍 Jira URL: ${JIRA_URL}`);
  console.log(`👤 Jira Email: ${JIRA_EMAIL}`);
});