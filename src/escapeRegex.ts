import escapeStringRegexp from 'escape-string-regexp';

type RegExpWithEscape = RegExpConstructor & { escape?: (s: string) => string };

const native = (RegExp as RegExpWithEscape).escape;

export const escapeRegex: (s: string) => string =
  typeof native === 'function' ? (s) => native(s) : escapeStringRegexp;
