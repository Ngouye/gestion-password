import { useCallback, useEffect, useRef, useState } from 'react';

const ROUTES = { '#connexion': 'login', '#inscription': 'signup', '#mot-de-passe-oublie': 'forgot' };
const HASHES = { login: '#connexion', signup: '#inscription', forgot: '#mot-de-passe-oublie', landing: '#' };

const readRoute = () => ROUTES[window.location.hash] ?? 'landing';

// Routage minimal par ancre : les autres ancres (#faq, #securite…) restent sur la page d'accueil.
export function useHashRoute() {
  const [route, setRoute] = useState(readRoute);
  const firstRender = useRef(true);

  useEffect(() => {
    const onHashChange = () => setRoute(readRoute());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    window.scrollTo({ top: 0 });
  }, [route]);

  const navigate = useCallback((next) => {
    window.location.hash = HASHES[next];
  }, []);

  return [route, navigate];
}
