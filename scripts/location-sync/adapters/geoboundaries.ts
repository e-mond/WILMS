import type { LocationSnapshot, LocationSourceAdapter } from '../types.js';
import { gssAdapter } from './gss.js';

/**
 * geoBoundaries adapter.
 * ADM1/ADM2 polygons are not loaded in this sprint. The adapter remains
 * swappable and currently delegates name authority to the verified IMCCOD/STMA
 * snapshot so application code never imports geoBoundaries directly.
 */
export const geoboundariesAdapter: LocationSourceAdapter = {
  id: 'geoboundaries',
  load(): LocationSnapshot {
    const snapshot = gssAdapter.load();
    return { ...snapshot, source: 'geoboundaries-name-proxy' };
  },
};
