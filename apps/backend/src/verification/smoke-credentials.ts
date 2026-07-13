/**
 * Resolve smoke-test credentials. Production hosts require explicit env vars —
 * demo accounts are disabled on live deployments.
 */
export function resolveSmokeCredentials(appUrl: string): { email: string; password: string } {
  const email = process.env.WILMS_SMOKE_EMAIL?.trim();
  const password = process.env.WILMS_SMOKE_PASSWORD?.trim();
  const isProductionHost =
    /wilms\.vercel\.app/i.test(appUrl) ||
    /railway\.app/i.test(appUrl) ||
    process.env.WILMS_REQUIRE_PROD_CREDENTIALS === '1';

  if (isProductionHost) {
    if (!email || !password) {
      throw new Error(
        'WILMS_SMOKE_EMAIL and WILMS_SMOKE_PASSWORD are required for production smoke tests (demo accounts are disabled on live)',
      );
    }
    return { email, password };
  }

  return {
    email: email ?? 'admin@wilms.demo',
    password: password ?? 'DemoAdmin1!',
  };
}

export interface RoleSmokeCredential {
  label: string;
  emailEnv: string;
  passwordEnv: string;
  fallbackEmail: string;
  fallbackPassword: string;
}

export function resolveRoleSmokeCredential(
  appUrl: string,
  role: RoleSmokeCredential,
): { email: string; password: string } {
  const email = process.env[role.emailEnv]?.trim();
  const password = process.env[role.passwordEnv]?.trim();
  const isProductionHost =
    /wilms\.vercel\.app/i.test(appUrl) ||
    /railway\.app/i.test(appUrl) ||
    process.env.WILMS_REQUIRE_PROD_CREDENTIALS === '1';

  if (isProductionHost) {
    if (!email || !password) {
      throw new Error(
        `${role.emailEnv} and ${role.passwordEnv} are required for production RBAC smoke (demo accounts disabled on live)`,
      );
    }
    return { email, password };
  }

  return {
    email: email ?? role.fallbackEmail,
    password: password ?? role.fallbackPassword,
  };
}
