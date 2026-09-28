import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { Loader2, WifiOff } from 'lucide-react';
import { getSupabase } from './lib/supabaseLoader';
import { useToast } from './hooks/useToast';
import { useIdleLock } from './hooks/useIdleLock';
import { useVault } from './hooks/useVault';
import { useHashRoute } from './hooks/useHashRoute';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { mayHaveSession, oauthError, passwordRecoveryRequested } from './lib/authRedirect';
import Landing from './components/Landing';
import { Toast } from './components/ui';

// Chargés à la demande : la page d'accueil s'affiche sans attendre le code du coffre.
const loadAuthScreen = () => import('./components/AuthScreen');
const loadVault = () => import('./components/Vault');
const loadRecoveryKit = () => import('./components/RecoveryKit');
const AuthScreen = lazy(loadAuthScreen);
const Vault = lazy(loadVault);
const RecoveryKitScreen = lazy(loadRecoveryKit);

const AUTO_LOCK_MS = 5 * 60 * 1000;

function Splash() {
  return (
    <div className="splash">
      <Loader2 size={24} className="spin" />
    </div>
  );
}

export default function App() {
  // undefined : session en cours de chargement ; null : non connecté.
  const [session, setSession] = useState(mayHaveSession ? undefined : null);
  const online = useOnlineStatus();
  const [toast, notify] = useToast();
  const [route, navigate] = useHashRoute();
  // Retour du lien « mot de passe oublié » : la session est ouverte, le coffre reste à restaurer.
  const [recoveryLink, setRecoveryLink] = useState(passwordRecoveryRequested);
  // Clé de secours fraîchement créée, à montrer avant d'ouvrir le coffre.
  const [pendingKit, setPendingKit] = useState(null);
  const [recoveryAvailable, setRecoveryAvailable] = useState(true);
  const { key, entries, loading, unlock, lock, saveEntry, deleteEntry, encryptLegacy } = useVault(
    session?.user?.id,
    notify,
  );

  useEffect(() => {
    let cancelled = false;
    let subscription;
    getSupabase().then((supabase) => {
      if (cancelled) return;
      ({ data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
        setSession(newSession);
        if (event === 'PASSWORD_RECOVERY') setRecoveryLink(true);
        if (!newSession) {
          lock();
          setPendingKit(null);
          setRecoveryLink(false);
        }
      }));
    });
    return () => {
      cancelled = true;
      subscription?.unsubscribe();
    };
  }, [lock]);

  // Précharge les écrans suivants pendant que le navigateur est inactif.
  useEffect(() => {
    const prefetch = () => {
      loadAuthScreen();
      loadVault();
      loadRecoveryKit();
    };
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(prefetch, { timeout: 3000 });
      return () => window.cancelIdleCallback(id);
    }
    const timer = setTimeout(prefetch, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleIdle = useCallback(() => {
    lock();
    notify('Coffre verrouillé après 5 minutes d’inactivité.');
  }, [lock, notify]);

  useIdleLock(Boolean(key), AUTO_LOCK_MS, handleIdle);

  if (session === undefined) return <Splash />;

  const handleUnlocked = ({ key: newKey, recoveryKey, recoveryUnavailable }) => {
    setRecoveryLink(false);
    setRecoveryAvailable(!recoveryUnavailable);
    if (recoveryKey) setPendingKit({ key: newKey, recoveryKey });
    else unlock(newKey);
  };

  const handleKitSaved = () => {
    unlock(pendingKit.key);
    setPendingKit(null);
  };

  const handleSignOut = async () => {
    try {
      const supabase = await getSupabase();
      await supabase.auth.signOut();
    } finally {
      lock();
      navigate('landing');
    }
  };

  // Un seul emplacement de rendu : AuthScreen garde son état quand la session
  // arrive pendant la connexion, avant que la clé ne soit dérivée.
  let screen;
  if (session && pendingKit) {
    screen = (
      <RecoveryKitScreen
        email={session.user.email}
        recoveryKey={pendingKit.recoveryKey}
        onDone={handleKitSaved}
        notify={notify}
      />
    );
  } else if (session && key) {
    screen = (
      <Vault
        user={session.user}
        entries={entries}
        loading={loading}
        onSave={saveEntry}
        onDelete={deleteEntry}
        onEncryptLegacy={encryptLegacy}
        onLock={lock}
        onSignOut={handleSignOut}
        recoveryAvailable={recoveryAvailable}
        notify={notify}
      />
    );
  } else if (!session && route === 'landing') {
    screen = <Landing />;
  } else {
    screen = (
      <AuthScreen
        session={session}
        mode={route === 'landing' ? 'login' : route}
        onModeChange={navigate}
        onUnlock={handleUnlocked}
        initialError={oauthError}
        passwordRecovery={recoveryLink}
      />
    );
  }

  return (
    <>
      {!online && (
        <div className="offline-banner" role="status">
          <WifiOff size={14} /> Hors ligne : reconnectez-vous à Internet pour accéder à votre coffre.
        </div>
      )}
      <Suspense fallback={<Splash />}>{screen}</Suspense>
      <Toast toast={toast} />
    </>
  );
}
