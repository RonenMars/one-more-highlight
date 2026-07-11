import { useHighlight as useCoreHighlight } from '../useHighlight.js';
import type { HighlightState as CoreHighlightState } from '../types.js';
import type {
  HighlightState,
  UseHighlightOptions,
  UseHighlightResult,
} from './types.js';

/**
 * Strip RN styling from a state, keeping only the fields the shared pipeline
 * reads (`name` + selector discriminators). The core `applyStates` never
 * touches `style`, so dropping it is safe and keeps the core hook's types
 * honest instead of casting across incompatible `style` shapes.
 */
function toCoreState(state: HighlightState): CoreHighlightState {
  const selector = { ...state } as Record<string, unknown>;
  delete selector['style'];
  return selector as CoreHighlightState;
}

/**
 * React Native `useHighlight`. Identical matching behavior to the web hook —
 * it delegates to the same pipeline — with RN-typed `states`.
 */
export function useHighlight(opts: UseHighlightOptions): UseHighlightResult {
  const { states, ...rest } = opts;
  return useCoreHighlight({
    ...rest,
    ...(states !== undefined && { states: states.map(toCoreState) }),
  });
}
