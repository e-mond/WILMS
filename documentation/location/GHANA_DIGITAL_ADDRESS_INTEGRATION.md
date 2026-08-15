# Ghana Digital Address integration

## Problem

“Use Current GPS” wrote WGS84 coordinates (for example `4.934275, -1.750484`) into the GPS address field.

## Approach

1. Browser geolocation still captures latitude, longitude, and accuracy.
2. `GET /locations/reverse-geocode` finds the nearest community in the location master (haversine / coordinate distance).
3. If that community stores a `XX-NNN-NNNN` code, that value is used.
4. Otherwise a deterministic fallback digital address is encoded from the region prefix and coordinates.
5. The registration form displays the digital address. Coordinates remain on the reverse-geocode payload and are not discarded.

Fallback codes are **not** official GhanaPost GPS products; they keep the field in Ghana Digital Address form when the master dataset has no stored code.
