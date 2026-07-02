/** Delay before showing loading skeletons to avoid flicker on fast responses. */
export const LOADING_DEBOUNCE_MS = 300;

/** Maximum wait before showing timeout UI with retry. */
export const LOADING_TIMEOUT_MS = 30_000;

export const LOADING_TIMEOUT_MESSAGE =
  'This is taking longer than expected. You can retry or wait a little longer.';
