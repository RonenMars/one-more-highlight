import { useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';

export function ThemeWrapper({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const isDark = pathname === '/dark' || pathname.startsWith('/dark/');
  return (
    <div data-theme={isDark ? 'dark' : undefined} style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      {children}
    </div>
  );
}
