import { useLocation, useNavigate } from 'react-router-dom';

export function ThemeToggle() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const isDark = pathname === '/dark' || pathname.startsWith('/dark/');

  function toggle() {
    if (isDark) {
      navigate(pathname === '/dark' ? '/' : pathname.slice('/dark'.length));
    } else {
      navigate(pathname === '/' ? '/dark' : '/dark' + pathname);
    }
  }

  return (
    <button className="theme-toggle" onClick={toggle} aria-label="Toggle theme">
      {isDark ? '☀️' : '🌙'}
    </button>
  );
}
