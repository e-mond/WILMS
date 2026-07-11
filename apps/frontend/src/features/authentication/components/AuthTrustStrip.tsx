'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface AuthTrustStripProps {
  className?: string;
  message?: string;
}

export function AuthTrustStrip({
  className,
  message = 'Secure connection. Your data is encrypted in transit.',
}: AuthTrustStripProps) {
  const [isSecure, setIsSecure] = useState(true);

  useEffect(() => {
    setIsSecure(window.isSecureContext);
  }, []);

  return (
    <p
      className={cn(
        'flex items-center justify-center gap-wilms-2 border-t border-border pt-wilms-4 text-small text-text-muted',
        className,
      )}
    >
      <ShieldCheck className="h-4 w-4 shrink-0 text-executive-gold" aria-hidden="true" />
      <span>
        {isSecure
          ? message
          : 'Use a secure connection (HTTPS) to protect your account recovery.'}
      </span>
    </p>
  );
}
