import { useState } from 'react';
import { Copy, Plus, RefreshCw, Wand2 } from 'lucide-react';
import { DEFAULT_OPTIONS, generatePassword } from '../lib/generator';
import { CLIPBOARD_CLEAR_SECONDS, copySecret } from '../lib/clipboard';
import { PasswordText, StrengthMeter, Switch } from './ui';

const MIN_LENGTH = 8;
const MAX_LENGTH = 64;

export default function Generator({ onSave, notify }) {
  const [options, setOptions] = useState(DEFAULT_OPTIONS);
  const [password, setPassword] = useState(() => generatePassword(DEFAULT_OPTIONS));

  const update = (patch) => {
    const next = { ...options, ...patch };
    setOptions(next);
    setPassword(generatePassword(next));
  };

  const handleCopy = async () => {
    try {
      await copySecret(password);
      notify(`Mot de passe copié, effacé dans ${CLIPBOARD_CLEAR_SECONDS} s.`);
    } catch {
      notify('Copie impossible.', 'error');
    }
  };

  const fill = ((options.length - MIN_LENGTH) / (MAX_LENGTH - MIN_LENGTH)) * 100;

  return (
    <aside className="panel generator">
      <div className="panel-header">
        <h2 className="panel-title panel-title-sm"><Wand2 size={16} /> Générateur</h2>
      </div>

      <div className="panel-body">
        <div className="gen-output mono" aria-live="polite">
          <PasswordText value={password} />
        </div>
        <StrengthMeter password={password} />

        <div className="gen-buttons">
          <button type="button" className="btn btn-secondary" onClick={() => setPassword(generatePassword(options))}>
            <RefreshCw size={15} /> Régénérer
          </button>
          <button type="button" className="btn btn-secondary" onClick={handleCopy}>
            <Copy size={15} /> Copier
          </button>
        </div>

        <div className="gen-options">
          <div className="range-row">
            <label htmlFor="gen-length">Longueur</label>
            <output htmlFor="gen-length">{options.length}</output>
          </div>
          <input
            id="gen-length"
            type="range"
            min={MIN_LENGTH}
            max={MAX_LENGTH}
            value={options.length}
            style={{ '--fill': `${fill}%` }}
            onChange={(e) => update({ length: Number(e.target.value) })}
          />
          <Switch label="Majuscules" hint="A–Z" checked={options.upper} onChange={(upper) => update({ upper })} />
          <Switch label="Chiffres" hint="0–9" checked={options.digits} onChange={(digits) => update({ digits })} />
          <Switch label="Symboles" hint="!@#$%" checked={options.symbols} onChange={(symbols) => update({ symbols })} />
        </div>

        <button type="button" className="btn btn-primary btn-block" onClick={() => onSave(password)}>
          <Plus size={16} /> Enregistrer dans le coffre
        </button>
      </div>
    </aside>
  );
}
