import React, { useState, useEffect, useCallback } from 'react';
import { 
  KeyRound, Copy, RefreshCw, Plus, Trash2, 
  Eye, EyeOff, ShieldCheck, CheckCircle2, LogOut, Loader2, Sparkles, Fingerprint,
  Mail, Lock, User, Globe
} from 'lucide-react';
import { supabase } from './supabaseClient';
import './index.css';

function App() {
  const [session, setSession] = useState(null);
  
  // Auth Form State
  const [email, setEmail] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [authError, setAuthError] = useState('');

  // Generator State
  const [password, setPassword] = useState('');
  const [length, setLength] = useState(16);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);

  // Saved Passwords State
  const [savedPasswords, setSavedPasswords] = useState([]);
  const [loadingPasswords, setLoadingPasswords] = useState(false);

  // UI State
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [newEntry, setNewEntry] = useState({ title: '', username: '', password: '' });
  const [visiblePasswords, setVisiblePasswords] = useState(new Set());

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchPasswords = useCallback(async () => {
    if (!session?.user?.id) return;
    setLoadingPasswords(true);
    const { data, error } = await supabase
      .from('passwords')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching passwords:', error);
    } else {
      setSavedPasswords(data || []);
    }
    setLoadingPasswords(false);
  }, [session]);

  useEffect(() => {
    if (session) {
      fetchPasswords();
    }
  }, [session, fetchPasswords]);

  const generatePassword = useCallback(() => {
    let charset = 'abcdefghijklmnopqrstuvwxyz';
    if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeNumbers) charset += '0123456789';
    if (includeSymbols) charset += '!@#$%^&*()_+~`|}{[]:;?><,./-=';

    let newPassword = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      newPassword += charset[randomIndex];
    }
    setPassword(newPassword);
    setNewEntry(prev => ({ ...prev, password: newPassword }));
  }, [length, includeUppercase, includeNumbers, includeSymbols]);

  useEffect(() => {
    generatePassword();
  }, [generatePassword]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !passwordInput) {
      setAuthError('Veuillez entrer une adresse e-mail et un mot de passe.');
      return;
    }
    setLoadingAuth(true);
    setAuthError('');
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: passwordInput,
    });
    if (error) setAuthError(error.message);
    setLoadingAuth(false);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!email || !passwordInput) {
      setAuthError('Veuillez entrer une adresse e-mail et un mot de passe pour créer un compte.');
      return;
    }
    setLoadingAuth(true);
    setAuthError('');
    const { error } = await supabase.auth.signUp({
      email,
      password: passwordInput,
    });
    if (error) {
      setAuthError(error.message);
    } else {
      setToast('Inscription réussie ! Veuillez vous connecter.');
      setTimeout(() => setToast(null), 3000);
    }
    setLoadingAuth(false);
  };

  const copyToClipboard = async (text, message = 'Copié !') => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setToast(message);
      setTimeout(() => setToast(null), 2500);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (!newEntry.title || !newEntry.password || !session?.user?.id) return;
    
    const { data, error } = await supabase
      .from('passwords')
      .insert([
        { 
          title: newEntry.title, 
          username: newEntry.username, 
          password: newEntry.password,
          user_id: session.user.id
        }
      ])
      .select();

    if (error) {
      console.error('Error saving password', error);
      setToast('Erreur lors de la sauvegarde.');
    } else if (data) {
      setSavedPasswords([data[0], ...savedPasswords]);
      setShowModal(false);
      setNewEntry({ title: '', username: '', password: password });
      setToast('Mot de passe sécurisé !');
    }
    
    setTimeout(() => setToast(null), 2500);
  };

  const deletePassword = async (id) => {
    const { error } = await supabase
      .from('passwords')
      .delete()
      .eq('id', id);

    if (!error) {
      setSavedPasswords(savedPasswords.filter(p => p.id !== id));
      setToast('Mot de passe supprimé.');
      setTimeout(() => setToast(null), 2500);
    }
  };

  const togglePasswordVisibility = (id) => {
    const newVisible = new Set(visiblePasswords);
    if (newVisible.has(id)) {
      newVisible.delete(id);
    } else {
      newVisible.add(id);
    }
    setVisiblePasswords(newVisible);
  };

  if (!session) {
    return (
      <div className="auth-container">
        <div className="ambient-light"></div>
        <div className="glass auth-card animate-fade-in">
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <Fingerprint size={48} style={{ margin: '0 auto 1.5rem', color: 'var(--fg)' }} />
            <h2 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>SecureVault</h2>
            <p style={{ color: 'var(--muted)', fontSize: '1rem' }}>Votre coffre-fort numérique personnel.</p>
          </div>

          {authError && (
            <div style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center', border: '1px solid var(--danger)' }}>
              {authError}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="input-group">
              <label>Adresse E-mail</label>
              <div className="input-with-icon">
                <Mail size={18} />
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  placeholder="vous@exemple.com"
                />
              </div>
            </div>
            <div className="input-group">
              <label>Mot de passe maître</label>
              <div className="input-with-icon">
                <Lock size={18} />
                <input 
                  type="password" 
                  value={passwordInput} 
                  onChange={(e) => setPasswordInput(e.target.value)} 
                  required 
                  placeholder="••••••••"
                />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2.5rem' }}>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loadingAuth}>
                {loadingAuth ? <Loader2 className="animate-spin" size={18} /> : 'Accéder au coffre'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleSignUp} disabled={loadingAuth} style={{ width: '100%' }}>
                Créer un compte
              </button>
            </div>
          </form>
        </div>
        
        {toast && (
          <div className="toast">
            <CheckCircle2 size={18} color="var(--success)" /> {toast}
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="ambient-light"></div>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Fingerprint size={32} color="var(--primary)" />
          <div>
            <h1 style={{ fontSize: '1.8rem', lineHeight: 1 }} className="text-gradient">SecureVault</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.4rem' }}>{session.user.email}</p>
          </div>
        </div>
        <button className="btn btn-secondary" onClick={() => supabase.auth.signOut()} title="Se déconnecter">
          <LogOut size={20} /> <span style={{ marginLeft: '0.5rem' }}>Déconnexion</span>
        </button>
      </header>

      <div className="container">
        {/* Generator Panel */}
        <aside className="glass generator-panel animate-fade-in">
          <h2><Sparkles size={22} color="var(--accent-2)" /> Générateur Intelligent</h2>
          
          <div className="generated-password">
            {password || '••••••••'}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
            <button className="btn btn-secondary" onClick={generatePassword} style={{ flex: 2 }}>
              <RefreshCw size={16} /> Générer
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={() => copyToClipboard(password)}
              style={{ flex: 1 }}
              title="Copier le mot de passe"
            >
              <Copy size={16} />
            </button>
          </div>

          <div className="slider-group">
            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Longueur</label>
            <span style={{ fontWeight: '600' }}>{length}</span>
          </div>
          <input 
            type="range" 
            min="8" 
            max="64" 
            value={length} 
            onChange={(e) => setLength(Number(e.target.value))}
          />

          <label className="checkbox-group">
            <input 
              type="checkbox" 
              checked={includeUppercase} 
              onChange={(e) => setIncludeUppercase(e.target.checked)} 
            />
            <span>Majuscules (A-Z)</span>
          </label>

          <label className="checkbox-group">
            <input 
              type="checkbox" 
              checked={includeNumbers} 
              onChange={(e) => setIncludeNumbers(e.target.checked)} 
            />
            <span>Chiffres (0-9)</span>
          </label>

          <label className="checkbox-group">
            <input 
              type="checkbox" 
              checked={includeSymbols} 
              onChange={(e) => setIncludeSymbols(e.target.checked)} 
            />
            <span>Symboles (!@#$)</span>
          </label>

          <button 
            className="btn btn-primary" 
            style={{ marginTop: '2rem', width: '100%' }}
            onClick={() => setShowModal(true)}
          >
            <Plus size={18} /> Sauvegarder dans le coffre
          </button>
        </aside>

        {/* Password List Panel */}
        <main className="main-panel">
          {loadingPasswords ? (
            <div className="glass empty-state animate-fade-in" style={{ padding: '6rem 2rem' }}>
               <Loader2 className="animate-spin" size={32} style={{ color: 'var(--text-muted)' }} />
            </div>
          ) : savedPasswords.length === 0 ? (
            <div className="glass empty-state animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <ShieldCheck size={48} />
              <h3>Coffre-fort vide</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Vos mots de passe apparaîtront ici.</p>
            </div>
          ) : (
            savedPasswords.map((item, index) => (
              <div 
                key={item.id} 
                className="password-card animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="card-info">
                  <h3>{item.title}</h3>
                  {item.username && (
                    <p style={{ marginBottom: '0.5rem' }}>{item.username}</p>
                  )}
                  <p>
                    <span className="pwd-mask" style={{ 
                      letterSpacing: visiblePasswords.has(item.id) ? '1px' : '3px',
                      color: visiblePasswords.has(item.id) ? 'var(--fg)' : 'var(--muted)'
                    }}>
                      {visiblePasswords.has(item.id) ? item.password : '••••••••••••'}
                    </span>
                  </p>
                </div>
                
                <div className="card-actions">
                  <button 
                    className="btn-icon" 
                    onClick={() => togglePasswordVisibility(item.id)}
                    title={visiblePasswords.has(item.id) ? "Masquer" : "Afficher"}
                  >
                    {visiblePasswords.has(item.id) ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button 
                    className="btn-icon" 
                    onClick={() => copyToClipboard(item.password)}
                    title="Copier"
                  >
                    <Copy size={16} />
                  </button>
                  <button 
                    className="btn-icon btn-danger" 
                    onClick={() => deletePassword(item.id)}
                    title="Supprimer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </main>
      </div>

      {/* Save Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content animate-fade-in" onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: '2rem', fontSize: '1.5rem', textAlign: 'center', color: 'var(--primary)' }}>Nouveau mot de passe</h2>
            <form onSubmit={handleSavePassword}>
              <div className="input-group">
                <label>Service (ex: Github, Netflix)</label>
                <div className="input-with-icon">
                  <Globe size={18} />
                  <input 
                    type="text" 
                    value={newEntry.title} 
                    onChange={e => setNewEntry({...newEntry, title: e.target.value})}
                    required
                    autoFocus
                  />
                </div>
              </div>
              <div className="input-group">
                <label>Identifiant (optionnel)</label>
                <div className="input-with-icon">
                  <User size={18} />
                  <input 
                    type="text" 
                    value={newEntry.username} 
                    onChange={e => setNewEntry({...newEntry, username: e.target.value})}
                  />
                </div>
              </div>
              <div className="input-group">
                <label>Mot de passe</label>
                <div className="input-with-icon">
                  <Lock size={18} />
                  <input 
                    type="text" 
                    value={newEntry.password} 
                    onChange={e => setNewEntry({...newEntry, password: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Sauvegarder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="toast">
          <CheckCircle2 size={18} color="var(--success)" /> {toast}
        </div>
      )}
    </>
  );
}

export default App;
