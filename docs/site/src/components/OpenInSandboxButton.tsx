import React from 'react';

const STACKBLITZ_URL =
  'https://stackblitz.com/github/RonenMars/one-more-highlight/tree/main/examples/playground';

export function OpenInSandboxButton() {
  return (
    <a
      href={STACKBLITZ_URL}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        padding: '0.4rem 0.9rem',
        borderRadius: '6px',
        background: '#1374ef',
        color: '#fff',
        fontWeight: 600,
        fontSize: '0.85rem',
        textDecoration: 'none',
        marginBottom: '1rem',
      }}
    >
      <svg width="14" height="14" viewBox="0 0 28 28" fill="currentColor" aria-hidden="true">
        <path d="M12.747 16.273h-7.46L18.925 1.5l-3.671 10.227h7.46L9.075 26.5z" />
      </svg>
      Open in StackBlitz
    </a>
  );
}
