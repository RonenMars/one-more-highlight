import React from 'react';

const CODESANDBOX_URL =
  'https://codesandbox.io/p/sandbox/github/RonenMars/one-more-highlight/tree/main/examples/playground';

export function OpenInSandboxButton() {
  return (
    <a
      href={CODESANDBOX_URL}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        padding: '0.4rem 0.9rem',
        borderRadius: '6px',
        background: '#151515',
        color: '#fff',
        fontWeight: 600,
        fontSize: '0.85rem',
        textDecoration: 'none',
        marginBottom: '1rem',
      }}
    >
      <svg width="14" height="14" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <path d="M1 1h10v10H1z" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path d="M4 4h4v4H4z" fill="currentColor" />
      </svg>
      Open in CodeSandbox
    </a>
  );
}
