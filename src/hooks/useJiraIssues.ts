import { useState, useEffect } from 'react';
import type { JiraIssue } from '../types';

const JIRA_PROXY_URL = import.meta.env.VITE_JIRA_PROXY_URL || 'http://localhost:3001';

export function useJiraIssues() {
  const [issues, setIssues] = useState<JiraIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadIssues();

    // Refrescar cada 30 segons (silent per no desmuntar components)
    const interval = setInterval(() => loadIssues(true), 30000);

    return () => clearInterval(interval);
  }, []);

  async function loadIssues(silent = false) {
    try {
      if (!silent) setLoading(true);
      const response = await fetch(`${JIRA_PROXY_URL}/issues`);

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      setIssues(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error carregant issues');
      console.error('Error loading Jira issues:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  }

  return {
    issues,
    loading,
    error,
    refresh: loadIssues
  };
}
