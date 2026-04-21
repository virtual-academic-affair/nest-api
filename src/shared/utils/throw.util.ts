type ErrorFactory = Error | (() => Error);

function resolveError(error: ErrorFactory): Error {
  return typeof error === 'function' ? (error as () => Error)() : error;
}

export function throwIf(condition: unknown, error: ErrorFactory): void {
  if (condition) {
    throw resolveError(error);
  }
}

export function throwUnless(condition: unknown, error: ErrorFactory): void {
  if (!condition) {
    throw resolveError(error);
  }
}

declare global {
  let throwIf: (condition: unknown, error: ErrorFactory) => void;
  let throwUnless: (condition: unknown, error: ErrorFactory) => void;
}

const globalWithThrow = globalThis as typeof globalThis & {
  throwIf?: (condition: unknown, error: ErrorFactory) => void;
  throwUnless?: (condition: unknown, error: ErrorFactory) => void;
};

globalWithThrow.throwIf = globalWithThrow.throwIf ?? throwIf;
globalWithThrow.throwUnless = globalWithThrow.throwUnless ?? throwUnless;
