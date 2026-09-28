import { useEffect, useState } from 'react';
import { Eye, EyeOff, Globe, KeyRound, Loader2, RefreshCw, User, X } from 'lucide-react';
import { DEFAULT_OPTIONS, generatePassword } from '../lib/generator';
import { Field, StrengthMeter } from './ui';

export default function EntryModal({ initial, onClose, onSubmit }) {
  const [values, setValues] = useState({
    title: initial.title,
    username: initial.username,
    password: initial.password,
  });
  const [reveal, setReveal] = useState(false);
  const [busy, setBusy] = useState(false);
  const isEdit = Boolean(initial.id);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const bind = (field) => ({
    value: values[field],
    onChange: (e) => setValues((prev) => ({ ...prev, [field]: e.target.value })),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!values.title.trim() || !values.password) return;
    setBusy(true);
    await onSubmit({ ...values, title: values.title.trim(), username: values.username.trim() });
    setBusy(false);
  };

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="entry-modal-title">
        <header className="modal-header">
          <h2 id="entry-modal-title">{isEdit ? 'Modifier l’élément' : 'Nouvel élément'}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Fermer">
            <X size={18} />
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="modal-body form">
            <Field label="Service" icon={Globe}>
              <input type="text" placeholder="GitHub, Netflix…" required autoFocus {...bind('title')} />
            </Field>
            <Field label="Identifiant (optionnel)" icon={User}>
              <input type="text" placeholder="nom@exemple.com" autoComplete="off" {...bind('username')} />
            </Field>
            <Field
              label="Mot de passe"
              icon={KeyRound}
              trailing={(
                <>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => setValues((prev) => ({ ...prev, password: generatePassword(DEFAULT_OPTIONS) }))}
                    aria-label="Générer un mot de passe"
                    title="Générer"
                  >
                    <RefreshCw size={15} />
                  </button>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => setReveal((v) => !v)}
                    aria-label={reveal ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    {reveal ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </>
              )}
            >
              <input
                type={reveal ? 'text' : 'password'}
                className="mono"
                autoComplete="new-password"
                required
                {...bind('password')}
              />
            </Field>
            <StrengthMeter password={values.password} />
          </div>

          <footer className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? <Loader2 size={16} className="spin" /> : 'Enregistrer'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
