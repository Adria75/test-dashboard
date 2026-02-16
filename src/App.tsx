import { useState, useEffect } from 'react';
import { JiraIssue } from './components/JiraIssue';
import { useAllCards } from './hooks/useAllCards';
import { useJiraIssues } from './hooks/useJiraIssues';
import { exportToJira } from './lib/jiraExport';
import type { JiraIssue as JiraIssueType, CardType, CardStatus, TestCard } from './types';
import './App.css';

function App() {
  const { issues, loading: loadingIssues, error: errorIssues } = useJiraIssues();
  const issueKeys = issues.map(i => i.key);
  const { cardsByIssue, createCard, updateCard, deleteCard } = useAllCards(issueKeys);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterTester, setFilterTester] = useState('all');
  const [darkMode, setDarkMode] = useState(false);
  const [currentUser, setCurrentUser] = useState('');
  const [exporting, setExporting] = useState<string | null>(null);

  useEffect(() => {
    // Aplicar/eliminar classe dark-mode al body
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  useEffect(() => {
    // Obtenir usuari actual del localStorage o demanar-lo
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setCurrentUser(savedUser);
    } else {
      const user = prompt('Quin és el teu nom?', 'Adrià');
      if (user) {
        setCurrentUser(user);
        localStorage.setItem('currentUser', user);
      }
    }
  }, []);

  const handleExport = async (issueKey: string) => {
    if (!confirm(`Exportar resultats de ${issueKey} a Jira?`)) {
      return;
    }

    try {
      setExporting(issueKey);
      await exportToJira(issueKey, cardsByIssue[issueKey] || []);
      alert(`✅ Resultats exportats a ${issueKey}`);
    } catch (error) {
      console.error('Error exportant:', error);
      alert(`❌ Error exportant: ${(error as Error).message}`);
    } finally {
      setExporting(null);
    }
  };

  const handleUpdateCard = async (cardId: number, updates: Partial<TestCard>) => {
    try {
      await updateCard(cardId, updates);
    } catch (error) {
      console.error('Error actualitzant card:', error);
      alert('Error actualitzant la card: ' + (error as Error).message);
    }
  };

  const handleCreateCard = async (issueKey: string, cardData: {
    ref: string;
    type: CardType;
    summary: string;
    detail: string;
    status: CardStatus;
    images?: string[];
  }) => {
    try {
      console.log('Creant card amb dades:', cardData);
      await createCard({
        jira_issue_key: issueKey,
        ref: cardData.ref,
        type: cardData.type,
        summary: cardData.summary,
        detail: cardData.detail || null,
        status: cardData.status,
        tester: currentUser,
        images: cardData.images || []
      });
      console.log('Card creada amb èxit');
    } catch (error) {
      console.error('Error creant card:', error);
      alert('Error creant la card: ' + (error as Error).message);
    }
  };

  const handleDeleteCard = async (cardId: number) => {
    try {
      await deleteCard(cardId);
      console.log('Card eliminada amb èxit');
    } catch (error) {
      console.error('Error eliminant card:', error);
      alert('Error eliminant la card: ' + (error as Error).message);
    }
  };

  if (!currentUser) {
    return <div>Carregant...</div>;
  }

  if (loadingIssues) {
    return (
        <div className="container">
          <div className="header">
            <h1>🧪 Dashboard de Testing</h1>
            <p>Carregant issues de Jira...</p>
          </div>
        </div>
    );
  }

  if (errorIssues) {
    return (
        <div className="container">
          <div className="header">
            <h1>🧪 Dashboard de Testing</h1>
            <p style={{ color: '#bf2600' }}>
              ❌ Error connectant amb Jira: {errorIssues}
              <br />
              <small>Assegura't que el proxy de Jira està corrent (npm start a jira-proxy/)</small>
            </p>
          </div>
        </div>
    );
  }

  const filteredIssues = issues.filter(issue => {
    const matchesSearch =
        issue.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.summary.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Obtenir testers únics
  const testers = ['Adrià', 'Yasiel', 'Eric', 'Marc', 'Anna'];

  return (
      <div className="container">
        <button
            className="dark-mode-toggle"
            onClick={() => setDarkMode(!darkMode)}
        >
          {darkMode ? '☀️ Mode clar' : '🌙 Mode fosc'}
        </button>

        <div className="header">
          <h1>🧪 Dashboard de Testing</h1>
          <p>Gestió de tests per issues en estat "En test" · Usuari: <strong>{currentUser}</strong></p>
          <div className="filters">
            <input
                type="text"
                placeholder="🔍 Cercar per clau o títol..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ flex: 1 }}
            />
            <select
                value={filterTester}
                onChange={(e) => setFilterTester(e.target.value)}
            >
              <option value="all">Tots els testers</option>
              {testers.map(tester => (
                  <option key={tester} value={tester}>{tester}</option>
              ))}
            </select>
          </div>
        </div>

        {filteredIssues.length === 0 ? (
            <div className="no-issues">
              <h3>No hi ha issues en test</h3>
              <p>Les issues apareixeran aquí quan estiguin en estat "En test"</p>
            </div>
        ) : (
            filteredIssues.map(issue => (
                <JiraIssue
                    key={issue.key}
                    issue={issue}
                    cards={cardsByIssue[issue.key] || []}
                    onUpdateCard={handleUpdateCard}
                    onCreateCard={(cardData) => handleCreateCard(issue.key, cardData)}
                    onDeleteCard={handleDeleteCard}
                    filterTester={filterTester}
                    currentUser={currentUser}
                    onExport={handleExport}
                />
            ))
        )}
      </div>
  );
}

export default App;