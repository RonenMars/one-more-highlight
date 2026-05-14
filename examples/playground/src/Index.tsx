import React from 'react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle.js';

interface IndexProps {
  demos: ReadonlyArray<{ path: string; title: string }>;
  dark?: boolean;
}

export function Index({ demos, dark = false }: IndexProps) {
  const prefix = dark ? '/dark' : '';
  const otherPrefix = dark ? '' : '/dark';
  const otherLabel = dark ? 'View light theme' : 'View dark theme';
  return (
    <div className="page">
      <div className="demo-header">
        <h2>one-more-highlight playground</h2>
        <ThemeToggle />
      </div>
      <ul className="index-list">
        {demos.map(({ path, title }) => (
          <li key={path}>
            <Link to={`${prefix}/${path}`}>{title}</Link>
          </li>
        ))}
      </ul>
      <p className="index-meta">
        <Link to={`${otherPrefix}/`}>{otherLabel}</Link>
      </p>
    </div>
  );
}
