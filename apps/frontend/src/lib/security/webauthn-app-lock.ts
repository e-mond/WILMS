export function isWebAuthnAvailable(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.PublicKeyCredential !== 'undefined' &&
    typeof navigator.credentials?.create === 'function' &&
    typeof navigator.credentials?.get === 'function'
  );
}

function toBuffer(value: string): ArrayBuffer {
  return new TextEncoder().encode(value).buffer;
}

function base64UrlToBuffer(value: string): ArrayBuffer {
  const pad = '='.repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + pad).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) {
    bytes[i] = raw.charCodeAt(i);
  }
  return bytes.buffer;
}

const CREDENTIAL_STORAGE_KEY = 'wilms-app-lock-webauthn-cred';

export async function registerAppLockCredential(userId: string): Promise<void> {
  if (!isWebAuthnAvailable()) {
    throw new Error('WebAuthn is not available on this device.');
  }

  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const credential = (await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: 'WILMS', id: window.location.hostname },
      user: {
        id: toBuffer(userId),
        name: userId,
        displayName: 'WILMS App Lock',
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },
        { type: 'public-key', alg: -257 },
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'preferred',
      },
      timeout: 60_000,
    },
  })) as PublicKeyCredential | null;

  if (!credential) {
    throw new Error('Biometric enrolment was cancelled.');
  }

  localStorage.setItem(CREDENTIAL_STORAGE_KEY, credential.id);
}

export async function assertAppLockCredential(): Promise<boolean> {
  if (!isWebAuthnAvailable()) {
    return false;
  }

  const credentialId = localStorage.getItem(CREDENTIAL_STORAGE_KEY);
  if (!credentialId) {
    return false;
  }

  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge,
      timeout: 60_000,
      userVerification: 'required',
      allowCredentials: [
        {
          type: 'public-key',
          id: base64UrlToBuffer(credentialId),
        },
      ],
    },
  });

  return Boolean(assertion);
}
