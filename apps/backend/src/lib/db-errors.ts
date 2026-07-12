export function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === '23505'
  );
}

export function isForeignKeyViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === '23503'
  );
}

export function isUndefinedTableError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === '42P01'
  );
}

export function mapDatabaseError(error: unknown): Error | null {
  if (isUniqueViolation(error)) {
    const detail =
      typeof error === 'object' && error !== null && 'detail' in error
        ? String((error as { detail?: string }).detail ?? '')
        : '';

    if (detail.includes('email')) {
      return new Error('VALIDATION:A user with this email already exists.');
    }

    return new Error('VALIDATION:A record with these details already exists.');
  }

  if (isForeignKeyViolation(error)) {
    return new Error('VALIDATION:Related record is missing or invalid.');
  }

  return null;
}
