import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from './supabaseClient';
import { useToast } from './hooks/useToast';
import { useIdleLock } from './hooks/useIdleLock';
import { useVault } from './hooks/useVault';
import { useHashRoute } from './hooks/useHashRoute';
import { oauthError, passwordRecoveryRequested } from './lib/authRedirect';
import AuthScreen from './components/AuthScreen';
import Landing from './components/Landing';
import RecoveryKitScreen from './components/RecoveryKit';
import Vault from './components/Vault';
import { Toast } from './components/ui';

const AUTO_LOCK_MS = 5 * 60 * 1000;

export default function App() {
  // undefined : session en cours de chargement ; null : non connecté.
  const [session, setSession] = useState(undefined);
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      if (event === 'PASSWORD_RECOVERY') setRecoveryLink(true);
      if (!newSession) {
        lock();
        setPendingKit(null);
        setRecoveryLink(false);
      }
    });
    return () => subscription.unsubscribe();
  }, [lock]);

  const handleIdle = useCallback(() => {
    lock();
    notify('Coffre verrouillé après 5 minutes d’inactivité.');
  }, [lock, notify]);

  useIdleLock(Boolean(key), AUTO_LOCK_MS, handleIdle);

  if (session === undefined) {
    return (
      <div className="splash">
        <Loader2 size={24} className="spin" />
      </div>
    );
  }

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
    await supabase.auth.signOut();
    navigate('landing');
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
      {screen}
      <Toast toast={toast} />
    </>
  );
}
