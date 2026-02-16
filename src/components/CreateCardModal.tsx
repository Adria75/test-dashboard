import { useState, useEffect } from 'react';
import type { CardType, CardStatus, TestCard } from '../types';
import { uploadImage } from '../lib/uploadImage';

interface CreateCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateCard: (cardData: {
    ref: string;
    type: CardType;
    summary: string;
    detail: string;
    status: CardStatus;
    dev_reply?: string | null;
    images?: string[];
  }) => void;
  onUpdateCard?: (cardId: number, cardData: {
    ref: string;
    type: CardType;
    summary: string;
    detail: string;
    status: CardStatus;
    dev_reply?: string | null;
    images?: string[];
  }) => void;
  onDeleteImage?: (url: string) => Promise<void>;
  issueKey: string;
  currentUser: string;
  editCard?: TestCard | null;
}

export function CreateCardModal({
                                  isOpen,
                                  onClose,
                                  onCreateCard,
                                  onUpdateCard,
                                  onDeleteImage,
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
    dev_reply: string;
    images: string[];
  }>({
    ref: '',
    type: 'error',
    summary: '',
    detail: '',
    status: 'errors',
    dev_reply: '',
    images: []
  });

  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (editCard) {
      setFormData({
        ref: editCard.ref,
        type: editCard.type,
        summary: editCard.summary,
        detail: editCard.detail || '',
        status: editCard.status,
        dev_reply: editCard.dev_reply || '',
        images: editCard.images || []
      });
    } else {
      setFormData({
        ref: '',
        type: 'error',
        summary: '',
        detail: '',
        status: 'errors',
        dev_reply: '',
        images: []
      });
    }
  }, [editCard, isOpen]);

  if (!isOpen) return null;

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    const imageFiles: File[] = [];

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) imageFiles.push(file);
      }
    }

    if (imageFiles.length === 0) return;

    e.preventDefault();
    setUploading(true);

    try {
      const urls: string[] = [];
      for (const file of imageFiles) {
        const url = await uploadImage(file);
        urls.push(url);
      }
      setFormData(prev => ({ ...prev, images: [...prev.images, ...urls] }));
    } catch (err) {
      console.error('Error uploading image:', err);
      alert('Error pujant la imatge: ' + (err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async (url: string) => {
    if (onDeleteImage) {
      await onDeleteImage(url);
    }
    setFormData(prev => ({ ...prev, images: prev.images.filter(u => u !== url) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const submitData = {
      ref: formData.ref,
      type: formData.type,
      summary: formData.summary,
      detail: formData.detail,
      status: formData.status,
      dev_reply: formData.dev_reply || null,
      images: formData.images
    };

    if (editCard && onUpdateCard) {
      onUpdateCard(editCard.id, submitData);
    } else {
      onCreateCard(submitData);
    }

    setFormData({ ref: '', type: 'error', summary: '', detail: '', status: 'errors', dev_reply: '', images: [] });
    onClose();
  };

  const isEditMode = !!editCard;
  const showDevReply = isEditMode && formData.status === 'errors';

  return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()} onPaste={handlePaste}>
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

            {showDevReply && (
                <div className="form-group">
                  <label>Resposta del desenvolupador</label>
                  <textarea
                      placeholder="Resposta o comentari del desenvolupador..."
                      value={formData.dev_reply}
                      onChange={(e) => setFormData({ ...formData, dev_reply: e.target.value })}
                  />
                </div>
            )}

            <div className="form-group">
              <label>Imatges (Ctrl+V per enganxar captures)</label>
              <div className="image-paste-area">
                {uploading && <div className="image-uploading">Pujant imatge...</div>}
                {formData.images.length > 0 ? (
                    <div className="image-thumbnails">
                      {formData.images.map((url, i) => (
                          <div key={i} className="image-thumbnail">
                            <img src={url} alt={`Captura ${i + 1}`} />
                            <button
                                type="button"
                                className="image-remove-btn"
                                onClick={() => handleRemoveImage(url)}
                                title="Eliminar imatge"
                            >
                              &times;
                            </button>
                          </div>
                      ))}
                    </div>
                ) : (
                    !uploading && <div className="image-paste-hint">Ctrl+V per enganxar una captura de pantalla</div>
                )}
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel·lar
              </button>
              <button type="submit" className="btn btn-primary" disabled={uploading}>
                {isEditMode ? 'Guardar canvis' : 'Crear card'}
              </button>
            </div>
          </form>
        </div>
      </div>
  );
}
