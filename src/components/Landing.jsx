import {
  ArrowRight, Check, ChevronDown, ClipboardCheck, Copy, Database, Fingerprint, Gauge, KeyRound, Lock,
  MonitorSmartphone, Plus, Search, ShieldCheck, Sparkles, Timer, UserPlus, Wand2, X,
} from 'lucide-react';
import { Brand, PasswordText } from './ui';

const NAV_LINKS = [
  { href: '#fonctionnalites', label: 'Fonctionnalités' },
  { href: '#etapes', label: 'Comment ça marche' },
  { href: '#securite', label: 'Sécurité' },
  { href: '#faq', label: 'FAQ' },
];

const TRUST = [
  { icon: Lock, title: 'AES-256-GCM', text: 'Chiffrement moderne et authentifié' },
  { icon: KeyRound, title: 'Clé jamais stockée', text: 'Dérivée à chaque déverrouillage' },
  { icon: Sparkles, title: 'Aléa cryptographique', text: 'Générateur sans biais statistique' },
  { icon: Timer, title: 'Verrouillage auto', text: 'Après 5 min d’inactivité' },
];

const STEPS = [
  {
    icon: UserPlus,
    title: 'Créez votre coffre',
    text: 'Choisissez un mot de passe maître robuste : c’est l’unique clé de votre coffre.',
  },
  {
    icon: Wand2,
    title: 'Ajoutez vos accès',
    text: 'Enregistrez vos identifiants ou générez des mots de passe uniques en un clic.',
  },
  {
    icon: MonitorSmartphone,
    title: 'Accédez partout',
    text: 'Déverrouillez votre coffre depuis n’importe quel navigateur, toujours synchronisé.',
  },
];

const FLOW = [
  { icon: Fingerprint, title: 'Mot de passe maître', text: 'saisi dans votre navigateur' },
  { icon: Gauge, title: 'PBKDF2-SHA256', text: '600 000 itérations' },
  { icon: KeyRound, title: 'Clé AES-256', text: 'en mémoire uniquement' },
  { icon: Lock, title: 'Chiffrement GCM', text: 'avant tout envoi' },
  { icon: Database, title: 'Stockage', text: 'blocs chiffrés illisibles' },
];

const SERVER_STORES = [
  'Votre adresse e-mail',
  'Le hash de votre mot de passe maître',
  'Des blocs chiffrés, illisibles sans votre clé',
];

const SERVER_NEVER = [
  'Votre clé de chiffrement',
  'Vos mots de passe en clair',
  'Les noms de vos services et identifiants',
];

const FAQ = [
  {
    q: 'Que se passe-t-il si j’oublie mon mot de passe maître ?',
    a: 'Utilisez votre clé de secours, remise à la création du coffre : elle permet de choisir un nouveau mot de passe maître sans rien perdre. Pour un compte e-mail, demandez d’abord un lien de réinitialisation depuis l’écran de connexion. Sans mot de passe maître ni clé de secours, personne, pas même nous, ne peut déchiffrer vos données.',
  },
  {
    q: 'Le serveur peut-il lire mes mots de passe ?',
    a: 'Non. Chaque élément est chiffré dans votre navigateur avant l’envoi ; le serveur ne reçoit que des blocs chiffrés. Avec un compte e-mail, votre mot de passe maître transite via TLS pour vous authentifier et seul son hash est conservé ; avec Google, GitHub ou Facebook (bientôt disponibles), il ne quittera jamais votre navigateur.',
  },
  {
    q: 'Puis-je me connecter avec Google, GitHub ou Facebook ?',
    a: 'Pas encore : cette fonctionnalité arrive bientôt. Pour l’instant, créez votre compte avec votre adresse e-mail. Une fois disponible, le fournisseur confirmera votre identité et vous définirez un mot de passe maître distinct : votre compte Google, GitHub ou Facebook ne donnera jamais accès à vos mots de passe.',
  },
  {
    q: 'Mes données sont-elles synchronisées entre mes appareils ?',
    a: 'Oui. Votre coffre chiffré est stocké dans le cloud : connectez-vous depuis n’importe quel navigateur pour le retrouver, à jour.',
  },
  {
    q: 'Le générateur est-il vraiment aléatoire ?',
    a: 'Il utilise crypto.getRandomValues, la source d’aléa cryptographique de votre système, avec un tirage par rejet pour éviter tout biais. Chaque famille de caractères choisie est garantie.',
  },
  {
    q: 'Et si je laisse mon ordinateur sans surveillance ?',
    a: 'Le coffre se verrouille automatiquement après 5 minutes d’inactivité, et tout mot de passe copié est effacé du presse-papiers au bout de 30 secondes.',
  },
];

const MOCK_ITEMS = [
  { title: 'GitHub', user: 'dev@exemple.fr', hue: 250 },
  { title: 'Netflix', user: 'famille@exemple.fr', hue: 0 },
  { title: 'Banque', user: 'n° client 4821', hue: 150 },
  { title: 'Figma', user: 'design@exemple.fr', hue: 30 },
];

function SectionHeading({ eyebrow, title, highlight, children }) {
  return (
    <header className="section-heading">
      <span className="eyebrow">{eyebrow}</span>
      <h2>
        {title}
        <span className="text-accent">{highlight}</span>
      </h2>
      {children && <p>{children}</p>}
    </header>
  );
}

function StrengthBars({ score = 4 }) {
  return (
    <span className="strength-bars mock-bars" data-score={score} aria-hidden="true">
      {[1, 2, 3, 4].map((level) => <span key={level} className={level <= score ? 'on' : ''} />)}
    </span>
  );
}

function DeviceMockup() {
  return (
    <div className="device" aria-hidden="true">
      <div className="device-frame">
        <div className="device-screen">
          <div className="mock-topbar">
            <Brand tagline={false} />
            <div className="mock-nav">
              <span className="is-active">Coffre</span>
              <span>Générateur</span>
              <span>Sécurité</span>
            </div>
            <span className="mock-btn"><Plus size={10} /> Nouvel élément</span>
          </div>
          <div className="mock-body">
            <div className="mock-card mock-list">
              <div className="mock-search"><Search size={10} /> Rechercher…</div>
              {MOCK_ITEMS.map((item) => (
                <div key={item.title} className="mock-item">
                  <span className="mock-avatar" style={{ '--hue': item.hue }}>{item.title.charAt(0)}</span>
                  <span className="mock-item-text">
                    <strong>{item.title}</strong>
                    <span>{item.user}</span>
                  </span>
                  <span className="mock-secret">••••••••</span>
                  <Copy size={10} className="mock-icon" />
                </div>
              ))}
            </div>
            <div className="mock-card mock-gen">
              <span className="mock-label"><Wand2 size={10} /> Générateur</span>
              <span className="mock-output mono"><PasswordText value="k7#Qm9!vR2@xL4$p" /></span>
              <span className="mock-strength"><StrengthBars /> <em>Excellent</em></span>
              {['Majuscules', 'Chiffres', 'Symboles'].map((label) => (
                <span key={label} className="mock-toggle">{label}<i /></span>
              ))}
              <span className="mock-btn mock-btn-block">Enregistrer</span>
            </div>
          </div>
        </div>
      </div>
      <div className="device-neck" />
      <div className="device-foot" />
      <div className="podium"><span /><span /></div>

      <div className="float-card float-top">
        <span className="float-label"><KeyRound size={13} /> Clé dérivée localement</span>
        <strong className="float-number">600 000</strong>
        <span className="float-sub">itérations PBKDF2</span>
      </div>
      <div className="float-card float-bottom">
        <span className="float-check"><Check size={14} strokeWidth={3} /></span>
        <span>
          <strong>Coffre verrouillé</strong>
          <span className="float-sub">après 5 min d’inactivité</span>
        </span>
      </div>
    </div>
  );
}

export default function Landing() {
  return (
    <div className="landing">
      <div className="announce">
        <span className="announce-strong">Vos mots de passe méritent mieux qu’un post-it.</span>
        <span className="announce-meta"><ShieldCheck size={14} /> Chiffré localement · Synchronisé · Verrouillage automatique</span>
      </div>

      <nav className="site-nav">
        <div className="container site-nav-inner">
          <a href="#" className="brand-link" aria-label="SecureVault, accueil"><Brand /></a>
          <div className="site-links">
            {NAV_LINKS.map((link) => <a key={link.href} href={link.href}>{link.label}</a>)}
          </div>
          <div className="site-nav-actions">
            <a href="#connexion" className="btn btn-ghost hide-sm">Se connecter</a>
            <a href="#inscription" className="btn btn-primary">Créer mon coffre</a>
          </div>
        </div>
      </nav>

      <header className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="pill"><Lock size={12} strokeWidth={2.5} /> AES-256</span>
            <h1>
              Vos mots de passe.
              <span className="text-accent">Enfin en sécurité.</span>
            </h1>
            <p className="hero-lead">
              SecureVault chiffre chaque identifiant directement dans votre navigateur.
              Le serveur ne stocke que des données illisibles.
            </p>
            <ul className="hero-checks">
              <li><Check size={14} strokeWidth={3} /> Chiffrement local</li>
              <li><Check size={14} strokeWidth={3} /> Générateur sécurisé</li>
              <li><Check size={14} strokeWidth={3} /> Verrouillage auto</li>
            </ul>
            <div className="hero-ctas">
              <a href="#inscription" className="btn btn-primary btn-xl">
                Créer mon coffre <ArrowRight size={18} />
              </a>
              <a href="#connexion" className="btn btn-outline btn-xl">J’ai déjà un compte</a>
            </div>
            <p className="hero-note"><Lock size={13} /> Inscription par e-mail · Google, GitHub et Facebook bientôt</p>
          </div>
          <DeviceMockup />
        </div>
      </header>

      <section className="container trust-strip" aria-label="Garanties de sécurité">
        {TRUST.map(({ icon: Icon, title, text }) => (
          <div key={title} className="trust-item">
            <span className="icon-tile"><Icon size={20} /></span>
            <span>
              <strong>{title}</strong>
              <span>{text}</span>
            </span>
          </div>
        ))}
      </section>

      <section id="etapes" className="section">
        <div className="container">
          <SectionHeading eyebrow="Comment ça marche" title="Sécuriser vos accès " highlight="en 3 étapes simples">
            Pas de configuration compliquée. Pas de jargon. Juste un coffre prêt à l’emploi.
          </SectionHeading>
          <ol className="steps">
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="step-card">
                <div className="step-top">
                  <span className="step-number">{i + 1}</span>
                  <Icon size={26} className="step-icon" />
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="fonctionnalites" className="section section-tinted">
        <div className="container">
          <SectionHeading eyebrow="Fonctionnalités" title="Tout ce qu’il faut. " highlight="Rien de superflu.">
            Les outils essentiels d’un gestionnaire de mots de passe, pensés pour aller vite.
          </SectionHeading>

          <div className="bento">
            <article className="bento-card bento-wide">
              <h3><Wand2 size={18} /> Générateur intelligent</h3>
              <p>De 8 à 64 caractères, majuscules, chiffres et symboles, avec estimation de la force en temps réel.</p>
              <div className="bento-generator">
                <span className="mock-output mono"><PasswordText value="Tz8!pK#2mW@q9vLr$4xN" /></span>
                <span className="bento-strength"><StrengthBars /> <strong>Excellent</strong> · 131 bits</span>
              </div>
            </article>

            <article className="bento-card">
              <h3><Timer size={18} /> Verrouillage auto</h3>
              <strong className="big-number">5 <small>min</small></strong>
              <p>Sans activité, le coffre se referme et la clé est effacée de la mémoire.</p>
            </article>

            <article className="bento-card">
              <h3><ClipboardCheck size={18} /> Presse-papiers</h3>
              <strong className="big-number">30 <small>s</small></strong>
              <p>Un mot de passe copié est automatiquement effacé du presse-papiers.</p>
            </article>

            <article className="bento-card">
              <h3><Lock size={18} /> Chiffrement complet</h3>
              <ul className="check-list">
                <li><Check size={14} strokeWidth={3} /> Service, identifiant et mot de passe</li>
                <li><Check size={14} strokeWidth={3} /> Vecteur unique à chaque écriture</li>
                <li><Check size={14} strokeWidth={3} /> Détection de toute altération</li>
              </ul>
            </article>

            <article className="bento-card">
              <h3><Gauge size={18} /> Bilan de sécurité</h3>
              <p>Repérez d’un coup d’œil les mots de passe faibles ou réutilisés dans votre coffre.</p>
              <div className="bento-stats">
                <span><strong>0</strong> faible</span>
                <span><strong>0</strong> réutilisé</span>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section id="securite" className="section">
        <div className="container">
          <SectionHeading eyebrow="Sécurité" title="Chiffré chez vous. " highlight="Illisible ailleurs.">
            Le chiffrement a lieu dans votre navigateur, avant que la moindre donnée ne parte sur le réseau.
          </SectionHeading>

          <ol className="flow">
            {FLOW.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flow-step">
                <span className="icon-tile"><Icon size={20} /></span>
                <strong>{title}</strong>
                <span>{text}</span>
              </li>
            ))}
          </ol>

          <div className="server-compare">
            <div className="compare-card">
              <h3>Ce que le serveur stocke</h3>
              <ul>
                {SERVER_STORES.map((item) => (
                  <li key={item}><span className="mark mark-ok"><Check size={12} strokeWidth={3} /></span>{item}</li>
                ))}
              </ul>
            </div>
            <div className="compare-card compare-never">
              <h3>Ce qu’il ne voit jamais</h3>
              <ul>
                {SERVER_NEVER.map((item) => (
                  <li key={item}><span className="mark mark-no"><X size={12} strokeWidth={3} /></span>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="section section-tinted">
        <div className="container container-narrow">
          <SectionHeading eyebrow="FAQ" title="Vos questions, " highlight="nos réponses" />
          <div className="faq">
            {FAQ.map(({ q, a }) => (
              <details key={q} className="faq-item">
                <summary>
                  {q}
                  <ChevronDown size={18} className="faq-chevron" />
                </summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="cta-card">
            <div className="cta-brand">
              <span className="cta-logo"><ShieldCheck size={34} /></span>
              <div>
                <h2>Prêt à protéger <span className="text-accent">vos accès ?</span></h2>
                <p>Votre coffre-fort numérique, opérationnel en moins d’une minute.</p>
              </div>
            </div>
            <div className="cta-actions">
              <a href="#inscription" className="btn btn-primary btn-xl">
                <Sparkles size={18} /> Créer mon coffre
              </a>
              <a href="#connexion" className="cta-link">J’ai déjà un compte <ArrowRight size={14} /></a>
            </div>
            <div className="cta-footer">
              <span><ShieldCheck size={14} /> Chiffré localement</span>
              <span>Synchronisé</span>
              <span>Verrouillage automatique</span>
            </div>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="container site-footer-inner">
          <Brand tagline={false} />
          <nav className="footer-links" aria-label="Pied de page">
            {NAV_LINKS.map((link) => <a key={link.href} href={link.href}>{link.label}</a>)}
          </nav>
          <p>© 2026 SecureVault. Chiffré dans votre navigateur.</p>
        </div>
      </footer>
    </div>
  );
}
