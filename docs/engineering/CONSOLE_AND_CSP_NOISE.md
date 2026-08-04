# Browser Console Noise & CSP Plugin Warnings (v1.4.3)

## Console messages that are NOT WILMS defects

The following browser console messages are produced by **browser extensions** (Edge/Chrome), not by the WILMS application:

- `A listener indicated an asynchronous response by returning true, but the message channel closed before a response was received`
- `Attempting to use a disconnected port object`

**Guidance for developers and operators**

- Do not treat these as application regressions in QA or certification.
- Prefer testing in a clean profile / Incognito without extensions when diagnosing real WILMS errors.
- Application logging (request IDs, API envelopes, structured backend logs) remains the source of truth for WILMS defects.

## CSP: `object-src 'none'` + `data:image/svg+xml`

**Observed warning pattern**

`Loading plugin data from data:image/svg+xml... violates CSP object-src 'none'`

**Investigation (v1.4.3)**

| Candidate | Finding |
|-----------|---------|
| Internal `<object>` / `<embed>` | None found in app source for SVG plugin payloads |
| `PhoneCaptureSessionPanel` | Uses a `data:image/svg+xml` **placeholder string** for simulated capture upload — not rendered via `<object>`/`<embed>` |
| PDF viewer / browser extensions | Most common source of `object-src` plugin warnings under a strict CSP |

**Verdict:** Non-blocking. Documented as external/plugin noise unless a future change introduces an internal `<object>`/`<embed>` with `data:` URLs (which must not be added).

WILMS CSP continues to enforce `object-src 'none'` intentionally.
