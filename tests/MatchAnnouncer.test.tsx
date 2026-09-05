import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MatchAnnouncer } from '../src/a11y/MatchAnnouncer.js';

describe('<MatchAnnouncer>', () => {
  it('renders a role="status" live region', () => {
    render(<MatchAnnouncer matchCount={0} activeIndex={null} />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
  });

  it('announces "No results" when there are no matches', async () => {
    render(<MatchAnnouncer matchCount={0} activeIndex={null} debounceMs={0} />);
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('No results'));
  });

  it('announces count and position for the active match', async () => {
    render(
      <MatchAnnouncer
        matchCount={17}
        activeIndex={2}
        activeMatchText="React"
        debounceMs={0}
      />,
    );
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('Result 3 of 17. React'),
    );
  });

  it('announces just the count when no match is active', async () => {
    render(<MatchAnnouncer matchCount={5} activeIndex={null} debounceMs={0} />);
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('5 results'));
  });
});
