import type { HighlightStateMany, HighlightStateOne, HighlightStateRange } from './types.js';

export const match = {
  one(index: number): Pick<HighlightStateOne, 'index'> {
    return { index };
  },
  range(start: number, end: number): Pick<HighlightStateRange, 'range'> {
    return { range: [start, end] };
  },
  many(indices: ReadonlyArray<number>): Pick<HighlightStateMany, 'indices'> {
    return { indices };
  },
} as const;
