import { useLocation } from 'react-router-dom';
import { useEffect, type ReactNode } from 'react';

export function ThemeWrapper({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const isDark = pathname === '/dark' || pathname.startsWith('/dark/');
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.setAttribute('data-theme', 'dark');
      document.body.setAttribute('data-theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
      document.body.removeAttribute('data-theme');
    }
  }, [isDark]);
  return <>{children}</>;
}
