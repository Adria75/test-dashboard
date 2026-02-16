import type { TestCard as TestCardType } from '../types';

interface TestCardProps {
  card: TestCardType;
  onDragStart: (e: React.DragEvent, card: TestCardType) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onEdit?: (card: TestCardType) => void;
  onDelete?: (cardId: number) => void;
}

export function TestCard({ card, onDragStart, onDragEnd, onEdit, onDelete }: TestCardProps) {
  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('dragging');
    // Netejar totes les classes drag-over que puguin quedar
    document.querySelectorAll('.drag-over').forEach(el => {
      el.classList.remove('drag-over');
    });
    onDragEnd(e);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ca-ES', { day: '2-digit', month: '2-digit' });
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) onEdit(card);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete && confirm(`Eliminar aquesta card?\n\n${card.summary}`)) {
      onDelete(card.id);
    }
  };

  return (
      <div
          className="test-card"
          draggable
          onDragStart={(e) => onDragStart(e, card)}
          onDragEnd={handleDragEnd}
      >
        <div className="card-header-actions">
          <div className="card-ref">{card.ref}</div>
          <div className="card-actions">
            {onEdit && (
                <button className="card-action-btn" onClick={handleEdit} title="Editar">
                  ✏️
                </button>
            )}
            {onDelete && (
                <button className="card-action-btn card-action-delete" onClick={handleDelete} title="Eliminar">
                  🗑️
                </button>
            )}
          </div>
        </div>
        {card.type && (
            <span className={`card-type ${card.type}`}>
          {card.type.toUpperCase()}
        </span>
        )}
        <div className="card-summary">{card.summary}</div>
        {card.detail && (
            <div className="card-detail">
              {card.detail}
            </div>
        )}
        <div className="card-footer">
          <div className="card-tester">
            {card.tester ? `👤 ${card.tester}` : '⚪ Sense assignar'}
          </div>
          <div className="card-date">{formatDate(card.created_at)}</div>
        </div>
      </div>
  );
}
