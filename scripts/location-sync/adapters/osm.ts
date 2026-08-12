import type { LocationSnapshot, LocationSourceAdapter } from '../types.js';
import { gssAdapter } from './gss.js';

/**
 * OpenStreetMap administrative-relation adapter.
 * OSM locality names are not imported until a reviewed extract is attached.
 */
export const osmAdapter: LocationSourceAdapter = {
  id: 'osm',
  load(): LocationSnapshot {
    const snapshot = gssAdapter.load();
    return { ...snapshot, source: 'osm-name-proxy' };
  },
};
