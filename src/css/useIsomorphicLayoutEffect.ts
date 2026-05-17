import { useEffect, useLayoutEffect } from 'react';

// `useLayoutEffect` warns when called during SSR. Alias to `useEffect`
// (a no-op during string rendering) on the server, then back to
// `useLayoutEffect` once on the client.
export const useIsomorphicLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect;
