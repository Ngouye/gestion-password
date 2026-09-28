import { useState } from 'react';
import { ArrowRight, Copy, Download, LifeBuoy, Printer } from 'lucide-react';
import { CLIPBOARD_CLEAR_SECONDS, copySecret } from '../lib/clipboard';
import { Brand } from './ui';

function downloadKit(email, recoveryKey) {
  const content = [
    'SecureVault — Clé de secours',
    '',
    `Compte : ${email}`,
    `Créée le : ${new Date().toLocaleString('fr-FR')}`,
    '',
    recoveryKey,
    '',
    'Cette clé permet de récupérer votre coffre si vous oubliez votre mot de passe maître.',
    'Conservez-la hors ligne (papier, clé USB, coffre physique) et ne la partagez avec personne.',
    '',
  ].join('\n');
  const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'securevault-cle-de-secours.txt';
  link.click();
  URL.revokeObjectURL(url);
}

export function RecoveryKitCard({ email, recoveryKey, onDone, notify, doneLabel = 'Accéder à mon coffre' }) {
  const [saved, setSaved] = useState(false);

  const handleCopy = async () => {
    try {
      await copySecret(recoveryKey);
      notify(`Clé de secours copiée, effacée dans ${CLIPBOARD_CLEAR_SECONDS} s.`);
    } catch {
      notify('Copie impossible.', 'error');
    }
  };

  return (
    <div className="recovery-kit">
      <header className="auth-header">
        <span className="auth-lock-icon"><LifeBuoy size={20} /></span>
        <h2>Votre clé de secours</h2>
        <p>
          Si vous oubliez votre mot de passe maître, cette clé est <strong>le seul moyen</strong> de récupérer
          votre coffre. Elle ne sera plus jamais affichée.
        </p>
      </header>

      <div className="recovery-key mono" aria-label="Clé de secours">
        {recoveryKey.split('-').map((group, i) => <span key={i}>{group}</span>)}
      </div>
      <p className="recovery-account">Compte : {email}</p>

      <div className="recovery-actions">
        <button type="button" className="btn btn-secondary" onClick={handleCopy}><Copy size={15} /> Copier</button>
        <button type="button" className="btn btn-secondary" onClick={() => downloadKit(email, recoveryKey)}>
          <Download size={15} /> Télécharger
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => window.print()}>
          <Printer size={15} /> Imprimer
        </button>
      </div>

      <label className="checkbox">
        <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} />
        <span>J’ai conservé ma clé de secours en lieu sûr, hors de ce navigateur.</span>
      </label>

      <button type="button" className="btn btn-primary btn-lg btn-block" disabled={!saved} onClick={onDone}>
        {doneLabel} <ArrowRight size={16} />
      </button>
    </div>
  );
}

export default function RecoveryKitScreen(props) {
  return (
    <div className="kit-screen">
      <div className="auth-card">
        <div className="kit-brand"><Brand /></div>
        <RecoveryKitCard {...props} />
      </div>
    </div>
  );
}
