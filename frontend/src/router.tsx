import { useState, useEffect } from 'react';

type Route = '/' | '/admin' | '/admin/login';

export function useHashRoute(): Route {
  const [route, setRoute] = useState<Route>(() => {
    const hash = window.location.hash.replace('#', '') || '/';
    return (hash === '/admin' || hash === '/admin/login' || hash === '/') ? hash as Route : '/';
  });

  useEffect(() => {
    const handler = () => {
      const hash = window.location.hash.replace('#', '') || '/';
      if (hash === '/admin' || hash === '/admin/login' || hash === '/') {
        setRoute(hash as Route);
      } else {
        setRoute('/');
      }
    };
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  return route;
}

export function navigateTo(route: Route) {
  window.location.hash = route;
}
