import { registerSW } from 'virtual:pwa-register';

let activateUpdate: (() => Promise<void>) | null = null;

export function setupPwaUpdateNotice() {
  activateUpdate = registerSW({
    immediate: false,
    onNeedRefresh() {
      window.dispatchEvent(new Event('mora:app-update'));
    },
  });
}

/** User-triggered update, never an automatic reload during a transaction. */
export function applyPwaUpdate() {
  return activateUpdate?.() ?? Promise.resolve();
}
