import { Component } from 'react';
import { RefreshCw, ShieldAlert } from 'lucide-react';

// Dernier filet : une erreur imprévue affiche un écran de reprise au lieu d'une page blanche.
// Le rechargement verrouille le coffre (la clé ne vit qu'en mémoire).
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    console.error('SecureVault : erreur inattendue', error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="kit-screen">
        <div className="auth-card crash-card">
          <span className="auth-lock-icon"><ShieldAlert size={20} /></span>
          <h2>Un problème est survenu</h2>
          <p>
            L’application a rencontré une erreur inattendue. Par sécurité, votre coffre sera verrouillé au
            rechargement ; vos données ne sont pas affectées.
          </p>
          <button type="button" className="btn btn-primary btn-lg btn-block" onClick={() => window.location.reload()}>
            <RefreshCw size={16} /> Recharger l’application
          </button>
        </div>
      </div>
    );
  }
}
