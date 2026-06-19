import type { UserRole } from '@wilms/shared-rbac';

export interface DemoUser {
  id: string;
  email: string;
  password: string;
  role: UserRole;
  displayName: string;
}

export const DEMO_USERS: DemoUser[] = [
  {
    id: 'user-super-admin',
    email: 'admin@wilms.demo',
    password: 'DemoAdmin1!',
    role: 'SUPER_ADMIN',
    displayName: 'Ama Boateng',
  },
  {
    id: 'user-collector',
    email: 'collector@wilms.demo',
    password: 'DemoCollect1!',
    role: 'COLLECTOR',
    displayName: 'Field Collector',
  },
  {
    id: 'user-officer',
    email: 'officer@wilms.demo',
    password: 'DemoOfficer1!',
    role: 'REGISTRATION_OFFICER',
    displayName: 'Registration Officer',
  },
  {
    id: 'user-approver',
    email: 'approver@wilms.demo',
    password: 'DemoApprove1!',
    role: 'APPROVER',
    displayName: 'Loan Approver',
  },
  {
    id: 'user-auditor',
    email: 'auditor@wilms.demo',
    password: 'DemoAudit1!',
    role: 'AUDITOR',
    displayName: 'Compliance Auditor',
  },
];
