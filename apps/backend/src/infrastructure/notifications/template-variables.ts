export interface TemplateVariables {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  loanNumber?: string;
  loanDisplayId?: string;
  amount?: string;
  collector?: string;
  collectorName?: string;
  dueDate?: string;
  paymentDate?: string;
  groupName?: string;
  [key: string]: string | undefined;
}

const VARIABLE_PATTERN = /\{\{\s*([\w.]+)\s*\}\}/g;

export function extractTemplateVariables(content: string): string[] {
  const found = new Set<string>();
  for (const match of content.matchAll(VARIABLE_PATTERN)) {
    if (match[1]) found.add(match[1]);
  }
  return [...found];
}

export function renderTemplate(content: string, variables: TemplateVariables): string {
  return content.replace(VARIABLE_PATTERN, (_match, key: string) => {
    const value = variables[key];
    return value ?? '';
  });
}

export function previewTemplate(input: {
  subject: string;
  bodyHtml: string;
  bodyText: string;
  sampleVariables?: TemplateVariables;
}): { subject: string; bodyHtml: string; bodyText: string; variables: string[] } {
  const sample: TemplateVariables = {
    firstName: 'Ama',
    lastName: 'Serwaa',
    fullName: 'Ama Serwaa',
    email: 'borrower@example.com',
    loanNumber: 'LOAN-2026-0001',
    loanDisplayId: 'LOAN-2026-0001',
    amount: 'GHS 500.00',
    collector: 'Kwame Mensah',
    collectorName: 'Kwame Mensah',
    dueDate: '2026-07-15',
    paymentDate: '2026-07-07',
    groupName: 'Accra Central Group',
    ...input.sampleVariables,
  };

  const variables = [
    ...extractTemplateVariables(input.subject),
    ...extractTemplateVariables(input.bodyHtml),
    ...extractTemplateVariables(input.bodyText),
  ];

  return {
    subject: renderTemplate(input.subject, sample),
    bodyHtml: renderTemplate(input.bodyHtml, sample),
    bodyText: renderTemplate(input.bodyText, sample),
    variables: [...new Set(variables)],
  };
}
