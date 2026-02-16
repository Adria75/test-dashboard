import { useState, useEffect } from 'react';
import type { CardType, CardStatus, TestCard } from '../types';

interface CreateCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateCard: (cardData: {
    ref: string;
    type: CardType;
    summary: string;
    detail: string;
    status: CardStatus;
  }) => void;
  onUpdateCard?: (cardId: number, cardData: {
    ref: string;
    type: CardType;
    summary: string;
    detail: string;
    status: CardStatus;
  }) => void;
  issueKey: string;
  currentUser: string;
  editCard?: TestCard | null;
}

export function CreateCardModal({
                                  isOpen,
                                  onClose,
                                  onCreateCard,
                                  onUpdateCard,
                                  issueKey,
                                  currentUser,
                                  editCard = null
                                }: CreateCardModalProps) {
  const [formData, setFormData] = useState<{
    ref: string;
    type: CardType;
    summary: string;
    detail: string;
    status: CardStatus;
  }>({
    ref: '',
    type: 'error',
    summary: '',
    detail: '',
    status: 'errors'
  });

  // Quan s'obre per editar, carregar les dades de la card
  useEffect(() => {
    if (editCard) {
      setFormData({
        ref: editCard.ref,
        type: editCard.type,
        summary: editCard.summary,
        detail: editCard.detail || '',
        status: editCard.status
      });
    } else {
      setFormData({
        ref: '',
        type: 'error',
        summary: '',
        detail: '',
        status: 'errors'
      });
    }
  }, [editCard, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editCard && onUpdateCard) {
      // Mode edició
      onUpdateCard(editCard.id, formData);
    } else {
      // Mode creació
      onCreateCard(formData);
    }

    setFormData({ ref: '', type: 'error', summary: '', detail: '', status: 'errors' });
    onClose();
  };

  const isEditMode = !!editCard;

  return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            {isEditMode ? 'Editar incidència de test' : 'Crear nova incidència de test'}
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>REF</label>
              <input
                  type="text"
                  placeholder="AC 1, AC 2.a, ALTRES..."
                  value={formData.ref}
                  onChange={(e) => setFormData({ ...formData, ref: e.target.value })}
                  required
              />
            </div>
            <div className="form-group">
              <label>Tipus</label>
              <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as CardType })}
              >
                <option value="error">ERROR</option>
                <option value="dubte">DUBTE</option>
                <option value="proposta">PROPOSTA</option>
                <option value="ux">UX</option>
              </select>
            </div>
            <div className="form-group">
              <label>Resum</label>
              <input
                  type="text"
                  placeholder="Descripció breu del problema..."
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  required
              />
            </div>
            <div className="form-group">
              <label>Detall</label>
              <textarea
                  placeholder="Explicació detallada del que has trobat..."
                  value={formData.detail}
                  onChange={(e) => setFormData({ ...formData, detail: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Estat</label>
              <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as CardStatus })}
              >
                <option value="pendent">Pendent de validar</option>
                <option value="errors">Errors</option>
                <option value="tancat">Tancat</option>
                <option value="descartat">Descartat</option>
              </select>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel·lar
              </button>
              <button type="submit" className="btn btn-primary">
                {isEditMode ? 'Guardar canvis' : 'Crear card'}
              </button>
            </div>
          </form>
        </div>
      </div>
  );
}
