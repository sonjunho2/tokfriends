export type AllowedOrigin = string | RegExp;

export function parseCorsOrigins(env?: string): AllowedOrigin[] {
  if (!env) return ['*'];
  return env
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((value) => {
      if (value.startsWith('/') && value.endsWith('/') && value.length > 2) {
        try {
          return new RegExp(value.slice(1, -1));
        } catch {
          return value;
        }
      }
      return value;
    });
}

export function isCorsOriginAllowed(
  origin: string,
  allowedOrigins: AllowedOrigin[],
): boolean {
  return allowedOrigins.some((allowed) => {
    if (allowed === '*') return true;
    if (allowed instanceof RegExp) return allowed.test(origin);
    return allowed === origin;
  });
}

export function hasWildcardCorsOrigin(
  allowedOrigins: AllowedOrigin[],
): boolean {
  return allowedOrigins.some(
    (candidate) => typeof candidate === 'string' && candidate === '*',
  );
}

export function assertProductionCorsOrigins(
  corsOriginEnv: string | undefined,
  isProduction: boolean,
  allowedOrigins: AllowedOrigin[],
): void {
  if (!isProduction) return;

  if (!corsOriginEnv) {
    throw new Error('CORS_ORIGIN is required in production');
  }

  if (hasWildcardCorsOrigin(allowedOrigins)) {
    throw new Error('CORS_ORIGIN wildcard is not allowed in production');
  }
}
