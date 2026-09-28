import { useEffect, useState } from 'react';
import { AlertCircle, Eye, EyeOff, KeyRound, Loader2, X } from 'lucide-react';
import { regenerateRecoveryKey } from '../lib/keyring';
import { describeAuthError } from '../lib/authErrors';
import { Field } from './ui';
import { RecoveryKitCard } from './RecoveryKit';

export default function RecoveryKeyModal({ user, onClose, notify }) {
  const [password, setPassword] = useState('');
  const [reveal, setReveal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [recoveryKey, setRecoveryKey] = useState(null);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && !recoveryKey) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, recoveryKey]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      setRecoveryKey(await regenerateRecoveryKey(user, password));
      setPassword('');
    } catch (err) {
      setError(describeAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleDone = () => {
    notify('Nouvelle clé de secours enregistrée. L’ancienne ne fonctionne plus.');
    onClose();
  };

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && !recoveryKey && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="recovery-modal-title">
        {recoveryKey ? (
          <div className="modal-body">
            <RecoveryKitCard
              email={user.email}
              recoveryKey={recoveryKey}
              onDone={handleDone}
              notify={notify}
              doneLabel="Terminer"
            />
          </div>
        ) : (
          <>
            <header className="modal-header">
              <h2 id="recovery-modal-title">Nouvelle clé de secours</h2>
              <button type="button" className="icon-btn" onClick={onClose} aria-label="Fermer"><X size={18} /></button>
            </header>
            <form onSubmit={handleSubmit}>
              <div className="modal-body form">
                <p className="hint">
                  Générez une nouvelle clé si vous avez perdu la précédente ou pensez qu’elle a été vue.
                  L’ancienne clé cessera immédiatement de fonctionner.
                </p>
                {error && <div className="alert alert-error"><AlertCircle size={16} /><span>{error}</span></div>}
                <Field
                  label="Mot de passe maître"
                  icon={KeyRound}
                  trailing={(
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => setReveal((v) => !v)}
                      aria-label={reveal ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    >
                      {reveal ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  )}
                >
                  <input
                    type={reveal ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    autoFocus
                    required
                  />
                </Field>
              </div>
              <footer className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={onClose}>Annuler</button>
                <button type="submit" className="btn btn-primary" disabled={busy || !password}>
                  {busy ? <Loader2 size={16} className="spin" /> : 'Générer'}
                </button>
              </footer>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
