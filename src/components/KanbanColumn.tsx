import { TestCard } from './TestCard';
import type { Column, TestCard as TestCardType } from '../types';

interface KanbanColumnProps {
  column: Column;
  cards: TestCardType[];
  onDrop: (e: React.DragEvent, columnId: string) => void;
  onEdit?: (card: TestCardType) => void;
  onDelete?: (cardId: number) => void;
}

export function KanbanColumn({ column, cards, onDrop, onEdit, onDelete }: KanbanColumnProps) {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    // Eliminar drag-over de totes les columnes
    document.querySelectorAll('.kanban-column').forEach(col => {
      col.classList.remove('drag-over');
    });

    // Afegir només a aquesta columna
    e.currentTarget.classList.add('drag-over');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Només eliminar si sortim de la columna (no dels fills)
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      e.currentTarget.classList.remove('drag-over');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    onDrop(e, column.id);
  };

  return (
      <div
          className={`kanban-column ${column.className}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
      >
        <div className="column-header">
          {column.label}
          <span className="column-count">{cards.length}</span>
        </div>
        {cards.length === 0 ? (
            <div className="empty-column">Sense elements</div>
        ) : (
            cards.map(card => (
                <TestCard
                    key={card.id}
                    card={card}
                    onDragStart={(e, card) => {
                      e.dataTransfer.effectAllowed = 'move';
                      e.dataTransfer.setData('cardId', card.id.toString());
                      e.currentTarget.classList.add('dragging');
                    }}
                    onDragEnd={() => {}}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
            ))
        )}
      </div>
  );
}
