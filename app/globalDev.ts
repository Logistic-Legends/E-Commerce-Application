// Set a runtime API host override early during module evaluation.
// This file should be imported before any modules that create API clients or services.
try {
  const desired = (process as any)?.env?.REACT_NATIVE_API_URL || 'http://10.124.173.231:5000/api';
  if (!((globalThis as any).__REACT_NATIVE_API_URL__)) {
    (globalThis as any).__REACT_NATIVE_API_URL__ = desired;
    // eslint-disable-next-line no-console
    console.log('[DEV] global runtime API override set to', (globalThis as any).__REACT_NATIVE_API_URL__);
  }
} catch (e) {
  // ignore in environments where process or console isn't available
}
