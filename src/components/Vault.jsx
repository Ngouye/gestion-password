import { useMemo, useState } from 'react';
import {
  KeyRound, LifeBuoy, Loader2, Lock, LogOut, Plus, Repeat, Search, ShieldAlert, ShieldCheck, TriangleAlert, X,
} from 'lucide-react';
import { passwordStrength } from '../lib/generator';
import { Brand } from './ui';
import EntryModal from './EntryModal';
import Generator from './Generator';
import VaultItem from './VaultItem';
import RecoveryKeyModal from './RecoveryKeyModal';

const EMPTY_ENTRY = { title: '', username: '', password: '' };

export default function Vault({
  user, entries, loading, onSave, onDelete, onEncryptLegacy, onLock, onSignOut, recoveryAvailable, notify,
}) {
  const [editor, setEditor] = useState(null);
  const [showRecovery, setShowRecovery] = useState(false);
  const meta = user.user_metadata ?? {};
  const displayName = meta.full_name || meta.name || user.email;
  const [query, setQuery] = useState('');
  const [migrating, setMigrating] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) => e.title.toLowerCase().includes(q) || e.username.toLowerCase().includes(q));
  }, [entries, query]);

  const stats = useMemo(() => {
    const readable = entries.filter((e) => !e.unreadable);
    const occurrences = new Map();
    readable.forEach((e) => occurrences.set(e.password, (occurrences.get(e.password) ?? 0) + 1));
    return {
      weak: readable.filter((e) => passwordStrength(e.password).score <= 2).length,
      reused: readable.filter((e) => occurrences.get(e.password) > 1).length,
      legacy: entries.filter((e) => e.legacy).length,
    };
  }, [entries]);
  const legacyCount = stats.legacy;

  const statCards = [
    { icon: KeyRound, label: 'Éléments', value: entries.length, tone: 'accent', hint: 'dans votre coffre' },
    { icon: TriangleAlert, label: 'Faibles', value: stats.weak, tone: stats.weak ? 'warning' : 'success', hint: 'force moyenne ou faible' },
    { icon: Repeat, label: 'Réutilisés', value: stats.reused, tone: stats.reused ? 'warning' : 'success', hint: 'mots de passe identiques' },
    { icon: ShieldCheck, label: 'Chiffrés', value: entries.length - stats.legacy, tone: stats.legacy ? 'warning' : 'success', hint: `sur ${entries.length}` },
  ];

  const handleMigrate = async () => {
    setMigrating(true);
    await onEncryptLegacy();
    setMigrating(false);
  };

  const handleSubmit = async (values) => {
    if (await onSave(values, editor.id)) setEditor(null);
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <Brand />
          <div className="topbar-actions">
            <span className="user-chip" title={user.email}>
              {meta.avatar_url
                ? <img className="avatar" src={meta.avatar_url} alt="" referrerPolicy="no-referrer" />
                : <span className="avatar">{displayName.charAt(0).toUpperCase()}</span>}
              <span className="user-email truncate">{displayName}</span>
            </span>
            {recoveryAvailable && (
              <button type="button" className="btn btn-ghost" onClick={() => setShowRecovery(true)} title="Générer une nouvelle clé de secours">
                <LifeBuoy size={16} /><span className="hide-sm">Clé de secours</span>
              </button>
            )}
            <button type="button" className="btn btn-ghost" onClick={onLock} title="Verrouiller le coffre">
              <Lock size={16} /><span className="hide-sm">Verrouiller</span>
            </button>
            <button type="button" className="btn btn-ghost btn-icon-only" onClick={onSignOut} aria-label="Se déconnecter" title="Se déconnecter">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <main className="layout">
        <section className="stats" aria-label="Bilan de sécurité">
          {statCards.map(({ icon: Icon, label, value, tone, hint }) => (
            <div key={label} className={`stat-card tone-${tone}`}>
              <span className="stat-label"><Icon size={15} /> {label}</span>
              <strong className="stat-value">{loading ? '–' : value}</strong>
              <span className="stat-hint">{hint}</span>
            </div>
          ))}
        </section>

        <section className="panel vault">
          <div className="panel-header">
            <div>
              <h1 className="panel-title">Coffre</h1>
              <p className="panel-subtitle">
                {entries.length} élément{entries.length > 1 ? 's' : ''} · chiffré{entries.length > 1 ? 's' : ''} de bout en bout
              </p>
            </div>
            <button type="button" className="btn btn-primary" onClick={() => setEditor(EMPTY_ENTRY)}>
              <Plus size={16} /><span className="hide-sm">Nouvel élément</span>
            </button>
          </div>

          <div className="vault-toolbar">
            <div className="search">
              <Search size={16} className="search-icon" aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher un élément…"
                aria-label="Rechercher"
              />
              {query && (
                <button type="button" className="icon-btn" onClick={() => setQuery('')} aria-label="Effacer la recherche">
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {!recoveryAvailable && (
            <div className="alert alert-warning vault-alert">
              <LifeBuoy size={16} />
              <span>
                Récupération en cas d’oubli désactivée : exécutez <code>supabase/policies.sql</code> dans Supabase,
                puis reconnectez-vous pour obtenir votre clé de secours.
              </span>
            </div>
          )}

          {legacyCount > 0 && (
            <div className="alert alert-warning vault-alert">
              <ShieldAlert size={16} />
              <span>
                {legacyCount} élément{legacyCount > 1 ? 's' : ''} enregistré{legacyCount > 1 ? 's' : ''} avant
                le chiffrement {legacyCount > 1 ? 'sont stockés' : 'est stocké'} en clair.
              </span>
              <button type="button" className="btn btn-sm btn-warning" onClick={handleMigrate} disabled={migrating}>
                {migrating ? <Loader2 size={14} className="spin" /> : 'Chiffrer maintenant'}
              </button>
            </div>
          )}

          {loading ? (
            <ul className="item-list" aria-busy="true">
              {[0, 1, 2, 3].map((i) => (
                <li key={i} className="item item-skeleton">
                  <span className="skeleton skeleton-avatar" />
                  <span className="skeleton-lines">
                    <span className="skeleton" style={{ width: '40%' }} />
                    <span className="skeleton" style={{ width: '25%' }} />
                  </span>
                </li>
              ))}
            </ul>
          ) : entries.length === 0 ? (
            <div className="empty">
              <span className="empty-icon"><KeyRound size={22} /></span>
              <h3>Votre coffre est vide</h3>
              <p>Ajoutez votre premier identifiant ou utilisez le générateur pour en créer un robuste.</p>
              <button type="button" className="btn btn-primary" onClick={() => setEditor(EMPTY_ENTRY)}>
                <Plus size={16} /> Ajouter un élément
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty">
              <span className="empty-icon"><Search size={22} /></span>
              <h3>Aucun résultat</h3>
              <p>Aucun élément ne correspond à « {query} ».</p>
            </div>
          ) : (
            <ul className="item-list">
              {filtered.map((entry) => (
                <VaultItem key={entry.id} entry={entry} onEdit={setEditor} onDelete={onDelete} notify={notify} />
              ))}
            </ul>
          )}
        </section>

        <Generator onSave={(password) => setEditor({ ...EMPTY_ENTRY, password })} notify={notify} />
      </main>

      {showRecovery && <RecoveryKeyModal user={user} onClose={() => setShowRecovery(false)} notify={notify} />}
      {editor && <EntryModal initial={editor} onClose={() => setEditor(null)} onSubmit={handleSubmit} />}
    </div>
  );
}
