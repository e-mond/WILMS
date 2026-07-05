export function normalizeSearchQuery(query: string): string {
  return query.trim().toLowerCase();
}

export function normalizePhoneForSearch(phone: string): string {
  return phone.replace(/\D/g, '');
}

export function matchesSearchField(value: string | undefined | null, query: string): boolean {
  if (!value) {
    return false;
  }

  const normalizedQuery = normalizeSearchQuery(query);

  if (!normalizedQuery) {
    return true;
  }

  const valueLower = value.toLowerCase();

  if (valueLower.includes(normalizedQuery)) {
    return true;
  }

  const phoneQuery = normalizePhoneForSearch(normalizedQuery);

  if (phoneQuery.length >= 3 && normalizePhoneForSearch(value).includes(phoneQuery)) {
    return true;
  }

  return false;
}

export function matchesAnySearchField(
  query: string,
  fields: Array<string | undefined | null>,
): boolean {
  const normalizedQuery = normalizeSearchQuery(query);

  if (!normalizedQuery) {
    return true;
  }

  return fields.some((field) => matchesSearchField(field, normalizedQuery));
}

export function splitSearchHighlight(text: string, query: string): Array<{ text: string; match: boolean }> {
  const normalizedQuery = normalizeSearchQuery(query);

  if (!normalizedQuery) {
    return [{ text, match: false }];
  }

  const lowerText = text.toLowerCase();
  const index = lowerText.indexOf(normalizedQuery);

  if (index === -1) {
    return [{ text, match: false }];
  }

  const parts: Array<{ text: string; match: boolean }> = [];

  if (index > 0) {
    parts.push({ text: text.slice(0, index), match: false });
  }

  parts.push({ text: text.slice(index, index + normalizedQuery.length), match: true });

  const remainder = text.slice(index + normalizedQuery.length);

  if (remainder) {
    parts.push(...splitSearchHighlight(remainder, query));
  }

  return parts;
}
