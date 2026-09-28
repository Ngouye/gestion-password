import { AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { passwordStrength } from '../lib/generator';

export function Brand({ tagline = true }) {
  return (
    <span className="brand">
      <span className="brand-mark"><ShieldCheck size={18} strokeWidth={2.25} /></span>
      <span className="brand-text">
        <span className="brand-name">SecureVault</span>
        {tagline && <span className="brand-tagline">Coffre-fort</span>}
      </span>
    </span>
  );
}

export function Field({ label, icon: Icon, trailing, children }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <span className="field-control">
        {Icon && <Icon size={16} className="field-icon" aria-hidden="true" />}
        {children}
        {trailing && <span className="field-trailing">{trailing}</span>}
      </span>
    </label>
  );
}

export function StrengthMeter({ password }) {
  const { score, bits, label } = passwordStrength(password);
  return (
    <div className="strength" data-score={score}>
      <div className="strength-bars" aria-hidden="true">
        {[1, 2, 3, 4].map((level) => <span key={level} className={level <= score ? 'on' : ''} />)}
      </div>
      <span className="strength-label">
        {password ? label : 'Force'}
        {password && <span className="strength-bits">{bits} bits</span>}
      </span>
    </div>
  );
}

export function Switch({ label, hint, checked, onChange }) {
  return (
    <label className="switch-row">
      <span className="switch-text">
        <span>{label}</span>
        {hint && <span className="switch-hint">{hint}</span>}
      </span>
      <input
        type="checkbox"
        role="switch"
        className="switch"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}

export function Toast({ toast }) {
  if (!toast) return null;
  const Icon = toast.type === 'error' ? AlertCircle : CheckCircle2;
  return (
    <div key={toast.id} className={`toast toast-${toast.type}`} role="status" aria-live="polite">
      <Icon size={16} />
      <span>{toast.message}</span>
    </div>
  );
}

function charClass(char) {
  if (/\d/.test(char)) return 'ch-digit';
  if (/[^a-zA-Z]/.test(char)) return 'ch-symbol';
  return undefined;
}

// Met en valeur chiffres et symboles pour faciliter la lecture d'un mot de passe.
export function PasswordText({ value }) {
  return [...value].map((char, i) => <span key={i} className={charClass(char)}>{char}</span>);
}
