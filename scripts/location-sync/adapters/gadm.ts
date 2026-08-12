import type { LocationSnapshot, LocationSourceAdapter } from '../types.js';
import { gssAdapter } from './gss.js';

/** GADM adapter placeholder. Name authority currently matches the verified IMCCOD snapshot. */
export const gadmAdapter: LocationSourceAdapter = {
  id: 'gadm',
  load(): LocationSnapshot {
    const snapshot = gssAdapter.load();
    return { ...snapshot, source: 'gadm-name-proxy' };
  },
};
