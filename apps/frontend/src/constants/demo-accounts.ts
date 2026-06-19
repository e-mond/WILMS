import { USER_ROLE, type UserRole } from '@/constants/roles';

export interface DemoAccount {
  id: string;
  email: string;
  password: string;
  role: UserRole;
  displayName: string;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    id: 'user-super-admin',
    email: 'admin@wilms.demo',
    password: 'DemoAdmin1!',
    role: USER_ROLE.SUPER_ADMIN,
    displayName: 'Ama Boateng',
  },
  {
    id: 'user-collector',
    email: 'collector@wilms.demo',
    password: 'DemoCollect1!',
    role: USER_ROLE.COLLECTOR,
    displayName: 'Field Collector',
  },
  {
    id: 'user-officer',
    email: 'officer@wilms.demo',
    password: 'DemoOfficer1!',
    role: USER_ROLE.REGISTRATION_OFFICER,
    displayName: 'Registration Officer',
  },
  {
    id: 'user-approver',
    email: 'approver@wilms.demo',
    password: 'DemoApprove1!',
    role: USER_ROLE.APPROVER,
    displayName: 'Loan Approver',
  },
  {
    id: 'user-auditor',
    email: 'auditor@wilms.demo',
    password: 'DemoAudit1!',
    role: USER_ROLE.AUDITOR,
    displayName: 'Compliance Auditor',
  },
];
