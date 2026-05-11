import React from 'react';

const STACKBLITZ_URL =
  'https://stackblitz.com/fork/github/RonenMars/one-more-highlight/tree/main/examples/stackblitz?title=one-more-highlight+playground&startScript=dev';

export function StackBlitzButton() {
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
        background: '#1374EF',
        color: '#fff',
        fontWeight: 600,
        fontSize: '0.85rem',
        textDecoration: 'none',
        marginBottom: '1rem',
      }}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <path d="M7.5 0L0 8h5.5L4 14l10-8H8.5L10 0z" fill="currentColor" />
      </svg>
      Open in StackBlitz
    </a>
  );
}
