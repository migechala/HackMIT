import { useEffect } from 'react';

/** Sets a per-route page theme on <html> so the body background matches the page (see index.css). */
export function useTheme(theme: 'threshold' | 'threshold-dark' | 'dash') {
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    return () => { delete document.documentElement.dataset.theme; };
  }, [theme]);
}
