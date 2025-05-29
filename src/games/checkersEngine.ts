// Utility to load checkers.js in a way compatible with both CommonJS and browser environments
// Modern browser-compatible dynamic import for checkers.js
let Checkers: any = undefined;

// Try dynamic import for ESM/CRA/webpack
export async function loadCheckersEngine(): Promise<any> {
  if (Checkers) return Checkers;
  try {
    const mod = await import('checkers.js');
    Checkers = mod.default || mod;
    return Checkers;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('checkers.js engine could not be loaded via dynamic import.', e);
    return undefined;
  }
}

// Legacy export for static usage (will be undefined in browser)
export const CheckersEngineCtor: any = Checkers;
export default Checkers;
