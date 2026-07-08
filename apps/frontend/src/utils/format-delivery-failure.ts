export interface DeliveryFailurePresentation {
  summary: string;
  details: string;
  technicalDetails: string;
}

function parseFailurePayload(raw: string | null | undefined): Record<string, unknown> | null {
  if (!raw?.trim()) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function matchFailurePattern(raw: string): DeliveryFailurePresentation | null {
  const normalized = raw.toLowerCase();

  if (normalized.includes('authentication') || normalized.includes('auth')) {
    return {
      summary: 'SMTP authentication failed',
      details: 'The mail server rejected the sender credentials.',
      technicalDetails: raw,
    };
  }

  if (normalized.includes('mailbox') || normalized.includes('recipient')) {
    return {
      summary: 'Recipient mailbox unavailable',
      details: 'The destination address could not receive this message.',
      technicalDetails: raw,
    };
  }

  if (normalized.includes('timeout') || normalized.includes('timed out')) {
    return {
      summary: 'Network timeout',
      details: 'The provider did not respond in time. Retry when connectivity improves.',
      technicalDetails: raw,
    };
  }

  if (normalized.includes('rate limit') || normalized.includes('too many')) {
    return {
      summary: 'Rate limit exceeded',
      details: 'The provider temporarily blocked additional messages.',
      technicalDetails: raw,
    };
  }

  if (normalized.includes('invalid phone') || normalized.includes('phone number')) {
    return {
      summary: 'Invalid phone number',
      details: 'The recipient number is not a valid mobile format.',
      technicalDetails: raw,
    };
  }

  if (normalized.includes('rejected') || normalized.includes('spam')) {
    return {
      summary: 'Email rejected',
      details: 'The recipient server refused the message.',
      technicalDetails: raw,
    };
  }

  if (normalized.includes('attachment') || normalized.includes('too large')) {
    return {
      summary: 'Attachment too large',
      details: 'The message exceeded provider size limits.',
      technicalDetails: raw,
    };
  }

  if (normalized.includes('not configured') || normalized.includes('provider')) {
    return {
      summary: 'Temporary provider outage',
      details: 'Messaging is not configured or the provider is unavailable.',
      technicalDetails: raw,
    };
  }

  return null;
}

export function formatDeliveryFailure(raw: string | null | undefined): DeliveryFailurePresentation {
  if (!raw?.trim()) {
    return {
      summary: 'Delivery failed',
      details: 'No additional failure details were recorded.',
      technicalDetails: '',
    };
  }

  const payload = parseFailurePayload(raw);
  if (payload) {
    const message =
      (typeof payload.message === 'string' && payload.message) ||
      (typeof payload.error === 'string' && payload.error) ||
      raw;
    const matched = matchFailurePattern(message);
    if (matched) {
      return matched;
    }

    return {
      summary: 'Delivery failed',
      details: message,
      technicalDetails: raw,
    };
  }

  const matched = matchFailurePattern(raw);
  if (matched) {
    return matched;
  }

  return {
    summary: 'Delivery failed',
    details: raw,
    technicalDetails: raw,
  };
}
