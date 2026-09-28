import { useState } from 'react';
import {
  AlertCircle, AlertTriangle, ArrowLeft, ArrowRight, Eye, EyeOff, KeyRound, LifeBuoy, Loader2, Lock, Mail, MailCheck,
  MonitorSmartphone, ShieldCheck, User, UserPlus, Wand2,
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { normalizeRecoveryKey } from '../lib/crypto';
import { describeAuthError } from '../lib/authErrors';
import {
  createVault, hasPasswordLogin, needsVaultSetup, openVault, providerName, recoverVault, resetVault,
} from '../lib/keyring';
import { Brand, Field, StrengthMeter } from './ui';
import OAuthButtons from './OAuthButtons';

const MIN_MASTER_LENGTH = 10;
const RECOVERY_KEY_LENGTH = 32;

const STEPS = [
  { icon: UserPlus, title: 'Créez votre coffre', text: 'Par e-mail (Google, GitHub et Facebook bientôt).' },
  { icon: Wand2, title: 'Ajoutez vos accès', text: 'Ou générez des mots de passe uniques en un clic.' },
  { icon: MonitorSmartphone, title: 'Accédez partout', text: 'Votre coffre chiffré vous suit sur tous vos appareils.' },
];

const SUBMIT_LABELS = {
  login: 'Accéder à mon coffre',
  signup: 'Créer mon coffre',
  forgot: 'Envoyer le lien de réinitialisation',
  unlock: 'Déverrouiller',
  setup: 'Créer mon coffre',
  recover: 'Restaurer mon coffre',
};

const redirectUrl = (query = '') => `${window.location.origin}${window.location.pathname}${query}`;

function namesFrom(user) {
  const meta = user?.user_metadata ?? {};
  if (meta.first_name || meta.last_name) return { firstName: meta.first_name ?? '', lastName: meta.last_name ?? '' };
  const [firstName = '', ...rest] = (meta.full_name ?? meta.name ?? '').trim().split(/\s+/);
  return { firstName, lastName: rest.join(' ') };
}

function validate(current, form, lostKit) {
  const creating = current === 'signup' || current === 'setup';
  const choosingPassword = creating || current === 'recover';

  if (creating && (!form.firstName.trim() || !form.lastName.trim())) return 'Indiquez votre prénom et votre nom.';
  if (current === 'recover' && !lostKit && normalizeRecoveryKey(form.recoveryKey).length !== RECOVERY_KEY_LENGTH) {
    return 'La clé de secours comporte 32 caractères (8 groupes de 4).';
  }
  if (choosingPassword) {
    if (form.password.length < MIN_MASTER_LENGTH) {
      return `Le mot de passe maître doit contenir au moins ${MIN_MASTER_LENGTH} caractères.`;
    }
    if (form.password !== form.confirm) return 'Les deux mots de passe ne correspondent pas.';
  }
  if (creating && !form.acknowledged) return 'Cochez la case pour confirmer avoir compris comment récupérer votre coffre.';
  if (current === 'recover' && lostKit && !form.acknowledged) {
    return 'Confirmez avoir compris que vos éléments actuels resteront illisibles.';
  }
  return '';
}

function Header({ icon: Icon, title, children }) {
  return (
    <header className="auth-header">
      {Icon && <span className="auth-lock-icon"><Icon size={20} /></span>}
      <h2>{title}</h2>
      <p>{children}</p>
    </header>
  );
}

export default function AuthScreen({ session, mode, onModeChange, onUnlock, initialError, passwordRecovery }) {
  // Figé au montage : pendant une connexion par e-mail, la session arrive avant la clé
  // et l'écran ne doit pas basculer en mode « déverrouillage ».
  const [unlocking, setUnlocking] = useState(Boolean(session));
  const [recovering, setRecovering] = useState(false);
  const [lostKit, setLostKit] = useState(false);
  const [form, setForm] = useState(() => ({
    ...namesFrom(session?.user),
    email: '',
    password: '',
    confirm: '',
    recoveryKey: '',
    acknowledged: false,
  }));
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(session ? '' : (initialError ?? ''));
  const [info, setInfo] = useState('');

  const user = session?.user;
  let current = mode;
  if (user && (passwordRecovery || recovering)) current = 'recover';
  else if (unlocking && user) current = needsVaultSetup(user) ? 'setup' : 'unlock';

  const creating = current === 'signup' || current === 'setup';
  const choosingPassword = creating || current === 'recover';
  const passwordLogin = hasPasswordLogin(user);
  // Session ouverte mais coffre verrouillé (pas une connexion en cours dans cet écran).
  const signedIn = unlocking && Boolean(user);

  const update = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const clearFeedback = () => {
    setError('');
    setInfo('');
  };

  const resetSecrets = () => setForm((prev) => ({
    ...prev, password: '', confirm: '', recoveryKey: '', acknowledged: false,
  }));

  const switchMode = (next) => {
    onModeChange(next);
    resetSecrets();
    clearFeedback();
  };

  const toggleRecovering = (value) => {
    setRecovering(value);
    setLostKit(false);
    resetSecrets();
    clearFeedback();
  };

  const toggleLostKit = () => {
    setLostKit((v) => !v);
    setForm((prev) => ({ ...prev, recoveryKey: '', acknowledged: false }));
    clearFeedback();
  };

  const handleSwitchAccount = async () => {
    await supabase.auth.signOut();
    setUnlocking(false);
    setRecovering(false);
    setForm((prev) => ({ ...prev, firstName: '', lastName: '' }));
    switchMode('login');
  };

  const authenticate = async (profile) => {
    const email = form.email.trim();
    const { password } = form;

    switch (current) {
      case 'unlock':
        return openVault(user, password);
      case 'setup':
        return createVault(user, password, profile);
      case 'recover':
        return lostKit ? resetVault(user, password) : recoverVault(user, form.recoveryKey, password);
      case 'forgot': {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: redirectUrl('?reinitialisation=1'),
        });
        if (resetError) throw resetError;
        return null;
      }
      case 'signup': {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: profile, emailRedirectTo: redirectUrl() },
        });
        if (signUpError) throw signUpError;
        return data.session ? createVault(data.user, password, profile) : null;
      }
      default: {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        return openVault(data.user, password, { loginVerified: true });
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setInfo('');
    const problem = validate(current, form, lostKit);
    setError(problem);
    if (problem) return;

    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    const profile = { first_name: firstName, last_name: lastName, full_name: `${firstName} ${lastName}` };

    setBusy(true);
    try {
      const result = await authenticate(profile);
      resetSecrets();
      if (result) {
        onUnlock(result);
      } else if (current === 'forgot') {
        setInfo('Si un compte existe pour cette adresse, un lien de réinitialisation vient de vous être envoyé.');
      } else {
        onModeChange('login');
        setInfo('Compte créé. Confirmez votre adresse via le lien reçu par e-mail, puis connectez-vous.');
      }
    } catch (err) {
      setError(describeAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const toggleVisibility = (
    <button
      type="button"
      className="icon-btn"
      onClick={() => setShowPassword((v) => !v)}
      aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
    >
      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  );

  let header;
  switch (current) {
    case 'unlock':
      header = (
        <Header icon={Lock} title="Coffre verrouillé">
          Saisissez votre mot de passe maître pour <strong>{user.email}</strong>.
        </Header>
      );
      break;
    case 'setup':
      header = (
        <Header icon={ShieldCheck} title="Définissez votre mot de passe maître">
          Connecté avec {providerName(user)} en tant que <strong>{user.email}</strong>. Ce mot de passe chiffre votre
          coffre : il est distinct de votre compte {providerName(user)} et ne quitte jamais votre navigateur.
        </Header>
      );
      break;
    case 'recover':
      header = lostKit ? (
        <Header icon={AlertTriangle} title="Repartir d’un coffre vide">
          Sans mot de passe maître ni clé de secours, vos éléments actuels ne peuvent plus être déchiffrés.
          Vous pouvez toutefois choisir un nouveau mot de passe et recommencer avec un coffre vide.
        </Header>
      ) : (
        <Header icon={LifeBuoy} title="Récupérer votre coffre">
          Saisissez la clé de secours remise à la création de votre coffre, puis choisissez un nouveau mot de passe
          maître{passwordLogin ? ' (il remplacera aussi votre mot de passe de connexion)' : ''}.
        </Header>
      );
      break;
    case 'forgot':
      header = (
        <Header icon={Mail} title="Mot de passe oublié">
          Recevez un lien par e-mail pour choisir un nouveau mot de passe. Vous aurez besoin de votre clé de secours
          pour retrouver vos éléments. Compte Google, GitHub ou Facebook ? Connectez-vous normalement, puis
          choisissez « Mot de passe maître oublié ».
        </Header>
      );
      break;
    default:
      header = (
        <>
          <Header title={current === 'signup' ? 'Créer votre coffre' : 'Bon retour parmi nous'}>
            {current === 'signup'
              ? 'Quelques informations, et un mot de passe maître pour tout protéger.'
              : 'Connectez-vous pour accéder à votre coffre.'}
          </Header>
          <div className="segmented" role="tablist" aria-label="Mode d'authentification">
            <button type="button" role="tab" aria-selected={current === 'login'} onClick={() => switchMode('login')}>
              Connexion
            </button>
            <button type="button" role="tab" aria-selected={current === 'signup'} onClick={() => switchMode('signup')}>
              Inscription
            </button>
          </div>
          <OAuthButtons onError={setError} />
          <div className="divider"><span>ou avec votre e-mail</span></div>
        </>
      );
  }

  const submitLabel = current === 'recover' && lostKit ? 'Repartir avec un coffre vide' : SUBMIT_LABELS[current];

  return (
    <div className="auth">
      <aside className="auth-hero">
        <a href="#" className="brand-link" aria-label="SecureVault, accueil"><Brand /></a>

        <div className="auth-hero-body">
          <span className="pill"><Lock size={12} strokeWidth={2.5} /> Chiffré de bout en bout</span>
          <h1>
            Un seul mot de passe.
            <span className="text-accent">Tous vos accès protégés.</span>
          </h1>
          <ol className="auth-steps">
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <li key={title}>
                <span className="step-number">{i + 1}</span>
                <span className="auth-step-text">
                  <strong>{title}</strong>
                  <span>{text}</span>
                </span>
                <Icon size={20} className="auth-step-icon" />
              </li>
            ))}
          </ol>
        </div>

        <div className="auth-stat">
          <span className="float-label"><LifeBuoy size={13} /> Clé de secours</span>
          <strong className="float-number">160 <small>bits</small></strong>
          <span className="float-sub">pour retrouver votre coffre en cas d’oubli</span>
        </div>
      </aside>

      <main className="auth-panel">
        {!signedIn && <a href="#" className="back-link"><ArrowLeft size={15} /> Retour à l’accueil</a>}

        <div className="auth-card">
          <div className="auth-mobile-brand"><Brand /></div>
          {header}

          {error && <div className="alert alert-error"><AlertCircle size={16} /><span>{error}</span></div>}
          {info && <div className="alert alert-info"><MailCheck size={16} /><span>{info}</span></div>}

          <form className="form" onSubmit={handleSubmit} noValidate>
            {creating && (
              <div className="form-row">
                <Field label="Prénom" icon={User}>
                  <input type="text" value={form.firstName} onChange={update('firstName')} autoComplete="given-name" />
                </Field>
                <Field label="Nom">
                  <input type="text" value={form.lastName} onChange={update('lastName')} autoComplete="family-name" />
                </Field>
              </div>
            )}

            {(current === 'login' || current === 'signup' || current === 'forgot') && (
              <Field label="Adresse e-mail" icon={Mail}>
                <input
                  type="email"
                  value={form.email}
                  onChange={update('email')}
                  placeholder="vous@exemple.com"
                  autoComplete="email"
                  autoFocus={current === 'forgot'}
                />
              </Field>
            )}

            {current === 'recover' && !lostKit && (
              <Field label="Clé de secours" icon={LifeBuoy}>
                <input
                  type="text"
                  className="mono recovery-input"
                  value={form.recoveryKey}
                  onChange={update('recoveryKey')}
                  placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"
                  autoComplete="off"
                  spellCheck={false}
                  autoFocus
                />
              </Field>
            )}

            {current !== 'forgot' && (
              <Field
                label={current === 'recover' ? 'Nouveau mot de passe maître' : 'Mot de passe maître'}
                icon={KeyRound}
                trailing={toggleVisibility}
              >
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={update('password')}
                  placeholder="••••••••••"
                  autoComplete={choosingPassword ? 'new-password' : 'current-password'}
                  autoFocus={current === 'unlock'}
                />
              </Field>
            )}

            {current === 'login' && (
              <button type="button" className="text-link field-link" onClick={() => switchMode('forgot')}>
                Mot de passe oublié ?
              </button>
            )}

            {choosingPassword && (
              <>
                <StrengthMeter password={form.password} />
                <Field label="Confirmer le mot de passe maître" icon={KeyRound}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.confirm}
                    onChange={update('confirm')}
                    placeholder="••••••••••"
                    autoComplete="new-password"
                  />
                </Field>
              </>
            )}

            {creating && (
              <label className="checkbox">
                <input type="checkbox" checked={form.acknowledged} onChange={update('acknowledged')} />
                <span>
                  J’ai compris qu’une <strong>clé de secours</strong> me sera remise à conserver : sans elle ni mon mot
                  de passe maître, mes données chiffrées seraient définitivement perdues.
                </span>
              </label>
            )}

            {current === 'recover' && lostKit && (
              <label className="checkbox checkbox-danger">
                <input type="checkbox" checked={form.acknowledged} onChange={update('acknowledged')} />
                <span>
                  Je comprends que mes éléments actuels <strong>resteront illisibles</strong> et que je repartirai
                  d’un coffre vide.
                </span>
              </label>
            )}

            <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={busy}>
              {busy ? <Loader2 size={18} className="spin" /> : <>{submitLabel}<ArrowRight size={16} /></>}
            </button>
          </form>

          <div className="auth-links">
            {current === 'forgot' && (
              <button type="button" className="text-link" onClick={() => switchMode('login')}>
                <ArrowLeft size={14} /> Retour à la connexion
              </button>
            )}
            {current === 'unlock' && (
              <button type="button" className="text-link" onClick={() => toggleRecovering(true)}>
                Mot de passe maître oublié ?
              </button>
            )}
            {current === 'recover' && (
              <>
                <button type="button" className="text-link" onClick={toggleLostKit}>
                  {lostKit ? 'J’ai retrouvé ma clé de secours' : 'J’ai aussi perdu ma clé de secours'}
                </button>
                {!passwordRecovery && (
                  <button type="button" className="text-link" onClick={() => toggleRecovering(false)}>
                    Annuler
                  </button>
                )}
              </>
            )}
            {signedIn && (
              <button type="button" className="text-link muted" onClick={handleSwitchAccount}>
                Se connecter avec un autre compte
              </button>
            )}
          </div>

          {!signedIn && current !== 'forgot' && (
            <p className="auth-secure-note"><Lock size={12} /> Connexion sécurisée · Données chiffrées localement</p>
          )}
        </div>
      </main>
    </div>
  );
}
