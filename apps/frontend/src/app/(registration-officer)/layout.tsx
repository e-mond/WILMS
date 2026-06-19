import type { ReactNode } from 'react';
import { RegistrationOfficerLayoutClient } from './RegistrationOfficerLayoutClient';

export default function RegistrationOfficerShellLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return <RegistrationOfficerLayoutClient>{children}</RegistrationOfficerLayoutClient>;
}
