import { useState } from 'react';
import { KanbanColumn } from './KanbanColumn';
import { CreateCardModal } from './CreateCardModal';
import type { JiraIssue as JiraIssueType, TestCard, Column, CardStatus, CardType } from '../types';

interface JiraIssueProps {
  issue: JiraIssueType;
  cards: TestCard[];
  onUpdateCard: (cardId: number, updates: Partial<TestCard>) => void;
  onCreateCard: (cardData: {
    ref: string;
    type: CardType;
    summary: string;
    detail: string;
    status: CardStatus;
  }) => void;
  onDeleteCard: (cardId: number) => void;
  filterTester: string;
  currentUser: string;
  onExport?: (issueKey: string) => void;
}

const COLUMNS: Column[] = [
  { id: 'pendent', label: '⏳ Pendent de validar', className: 'column-pendent' },
  { id: 'errors', label: '🔴 Errors', className: 'column-errors' },
  { id: 'tancat', label: '✅ Tancat', className: 'column-tancat' },
  { id: 'descartat', label: '❌ Descartat', className: 'column-descartat' }
];

export function JiraIssue({
                            issue,
                            cards,
                            onUpdateCard,
                            onCreateCard,
                            onDeleteCard,
                            filterTester,
                            currentUser
                          }: JiraIssueProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCard, setEditingCard] = useState<TestCard | null>(null);

  const handleEdit = (card: TestCard) => {
    setEditingCard(card);
    setShowCreateModal(true);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setEditingCard(null);
  };

  const handleUpdateCardData = (cardId: number, cardData: {
    ref: string;
    type: CardType;
    summary: string;
    detail: string;
    status: CardStatus;
  }) => {
    onUpdateCard(cardId, cardData);
    handleCloseModal();
  };

  const getCardsByStatus = (status: CardStatus) => {
    let filteredCards = cards.filter(card => card.status === status);

    // Aplicar filtre per tester si està actiu
    if (filterTester !== 'all') {
      filteredCards = filteredCards.filter(card => card.tester === filterTester);
    }

    return filteredCards;
  };

  const stats = {
    total: cards.length,
    tancat: getCardsByStatus('tancat').length + getCardsByStatus('descartat').length,
    errors: getCardsByStatus('errors').length,
    pendent: getCardsByStatus('pendent').length
  };

  const hasCards = cards.length > 0;

  const handleDrop = (e: React.DragEvent, targetStatus: string) => {
    const cardId = parseInt(e.dataTransfer.getData('cardId'));
    onUpdateCard(cardId, { status: targetStatus as CardStatus });
  };

  return (
      <div className="jira-issue">
        <div className="issue-header">
          <div>
            <span className="issue-key">{issue.key}</span>
            <h2 style={{ marginTop: '5px' }}>{issue.summary}</h2>
          </div>
          <div className="issue-stats">
            <span>✅ {stats.tancat}/{stats.total}</span>
            <span>🔴 {stats.errors} errors</span>
            <span>📋 {stats.pendent} pendents</span>
          </div>
        </div>

        <div className="issue-actions">
          <button
              className="btn-create-card"
              onClick={() => setShowCreateModal(true)}
          >
            <span className="btn-create-card-icon">+</span>
            Afegir incidència
          </button>
        </div>

        {!hasCards ? (
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <div className="empty-state-title">Encara no hi ha incidències de test</div>
              <p>Comença a testejar i crea cards per documentar els problemes que trobis</p>
            </div>
        ) : (
            <div className="kanban-board">
              {COLUMNS.map(column => (
                  <KanbanColumn
                      key={column.id}
                      column={column}
                      cards={getCardsByStatus(column.id)}
                      onDrop={handleDrop}
                      onEdit={handleEdit}
                      onDelete={onDeleteCard}
                  />
              ))}
            </div>
        )}

        <CreateCardModal
            isOpen={showCreateModal}
            onClose={handleCloseModal}
            onCreateCard={onCreateCard}
            onUpdateCard={handleUpdateCardData}
            issueKey={issue.key}
            currentUser={currentUser}
            editCard={editingCard}
        />
      </div>
  );
}
