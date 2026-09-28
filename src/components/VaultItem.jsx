import { memo, useEffect, useRef, useState } from 'react';
import { Copy, Eye, EyeOff, Pencil, Trash2, UserRound } from 'lucide-react';
import { CLIPBOARD_CLEAR_SECONDS, copySecret } from '../lib/clipboard';

const CONFIRM_DELAY_MS = 3000;

function hueFor(text) {
  let hash = 0;
  for (const char of text) hash = (hash * 31 + char.charCodeAt(0)) % 360;
  return hash;
}

function VaultItem({ entry, onEdit, onDelete, notify }) {
  const [revealed, setRevealed] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const confirmTimer = useRef(null);

  useEffect(() => () => clearTimeout(confirmTimer.current), []);

  const copy = async (value, label) => {
    try {
      await copySecret(value);
      notify(`${label} copié, effacé dans ${CLIPBOARD_CLEAR_SECONDS} s.`);
    } catch {
      notify('Copie impossible.', 'error');
    }
  };

  // Premier clic : demande de confirmation ; second clic dans les 3 s : suppression.
  const handleDelete = () => {
    if (!confirming) {
      setConfirming(true);
      confirmTimer.current = setTimeout(() => setConfirming(false), CONFIRM_DELAY_MS);
      return;
    }
    clearTimeout(confirmTimer.current);
    onDelete(entry.id);
  };

  const readable = !entry.unreadable;

  return (
    <li className="item">
      <span className="item-avatar" style={{ '--hue': hueFor(entry.title) }} aria-hidden="true">
        {entry.title.charAt(0).toUpperCase()}
      </span>

      <div className="item-main">
        <div className="item-title">
          <span className="truncate">{entry.title}</span>
          {entry.legacy && <span className="badge badge-warning">Non chiffré</span>}
          {entry.unreadable && <span className="badge badge-danger">Illisible</span>}
        </div>
        <div className="item-meta truncate">
          {entry.username || <span className="text-subtle">Aucun identifiant</span>}
        </div>
      </div>

      <div className={`item-secret mono ${revealed ? 'is-revealed' : ''}`}>
        {revealed ? entry.password : '••••••••••••'}
      </div>

      <div className="item-actions">
        {readable && entry.username && (
          <button type="button" className="icon-btn" onClick={() => copy(entry.username, 'Identifiant')} aria-label="Copier l’identifiant" title="Copier l’identifiant">
            <UserRound size={16} />
          </button>
        )}
        {readable && (
          <>
            <button type="button" className="icon-btn" onClick={() => copy(entry.password, 'Mot de passe')} aria-label="Copier le mot de passe" title="Copier le mot de passe">
              <Copy size={16} />
            </button>
            <button type="button" className="icon-btn" onClick={() => setRevealed((v) => !v)} aria-label={revealed ? 'Masquer' : 'Afficher'} title={revealed ? 'Masquer' : 'Afficher'}>
              {revealed ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
            <button type="button" className="icon-btn" onClick={() => onEdit(entry)} aria-label="Modifier" title="Modifier">
              <Pencil size={16} />
            </button>
          </>
        )}
        <button
          type="button"
          className={`icon-btn icon-btn-danger ${confirming ? 'is-confirming' : ''}`}
          onClick={handleDelete}
          aria-label={confirming ? 'Confirmer la suppression' : 'Supprimer'}
          title={confirming ? 'Cliquer à nouveau pour supprimer' : 'Supprimer'}
        >
          <Trash2 size={16} />
          {confirming && <span>Confirmer</span>}
        </button>
      </div>
    </li>
  );
}

// Une frappe dans la recherche ne re-rend que les lignes dont les données changent.
export default memo(VaultItem);
