import type { TestCard } from '../types';

const JIRA_PROXY_URL = import.meta.env.VITE_JIRA_PROXY_URL || 'http://localhost:3001';

export async function exportToJira(issueKey: string, cards: TestCard[]): Promise<void> {
  // Generar el comentari en el format que feu servir
  const comment = generateComment(cards);

  const response = await fetch(`${JIRA_PROXY_URL}/issues/${issueKey}/comment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ body: comment })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error exportant a Jira');
  }

  return response.json();
}

function generateComment(cards: TestCard[]): string {
  if (cards.length === 0) {
    return '✅ VALIDAT\n\nNo s\'han trobat incidències durant el test.';
  }

  let comment = '🧪 RESULTATS DEL TEST\n\n';

  // Agrupar per estat
  const byStatus = {
    errors: cards.filter(c => c.status === 'errors'),
    pendent: cards.filter(c => c.status === 'pendent'),
    tancat: cards.filter(c => c.status === 'tancat'),
    descartat: cards.filter(c => c.status === 'descartat')
  };

  // Errors actius
  if (byStatus.errors.length > 0) {
    comment += `🔴 ERRORS ACTIUS (${byStatus.errors.length})\n\n`;
    byStatus.errors.forEach(card => {
      comment += formatCard(card);
    });
  }

  // Pendent de validar
  if (byStatus.pendent.length > 0) {
    comment += `\n⏳ PENDENT DE VALIDAR (${byStatus.pendent.length})\n\n`;
    byStatus.pendent.forEach(card => {
      comment += formatCard(card);
    });
  }

  // Tancats
  if (byStatus.tancat.length > 0) {
    comment += `\n✅ TANCATS (${byStatus.tancat.length})\n\n`;
    byStatus.tancat.forEach(card => {
      comment += formatCard(card);
    });
  }

  // Descartats
  if (byStatus.descartat.length > 0) {
    comment += `\n❌ DESCARTATS (${byStatus.descartat.length})\n\n`;
    byStatus.descartat.forEach(card => {
      comment += formatCard(card);
    });
  }

  // Resum final
  const total = cards.length;
  const resolved = byStatus.tancat.length + byStatus.descartat.length;
  comment += `\n---\nResum: ${resolved}/${total} resolts`;

  return comment;
}

function formatCard(card: TestCard): string {
  const statusEmoji = {
    errors: '🔴',
    pendent: '⏳',
    tancat: '✅',
    descartat: '❌'
  };

  const typeLabel = card.type.toUpperCase();
  
  let formatted = `**Estat:** ${statusEmoji[card.status]} [ ${card.status.toUpperCase()} ]\n`;
  formatted += `**REF:** [ ${typeLabel} ] ${card.ref}\n`;
  formatted += `**Resum**: ${card.summary}\n`;
  
  if (card.detail) {
    formatted += `**Detall**: ${card.detail}\n`;
  }
  
  if (card.tester) {
    formatted += `**Tester**: ${card.tester}\n`;
  }
  
  formatted += '\n---\n\n';
  
  return formatted;
}
