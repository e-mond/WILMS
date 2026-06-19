import {
  GROUP_MEMBER_LOAN_STATUS,
  GROUP_MEMBER_ROLE,
  type GroupMember,
} from '@/types/group';

export const MOCK_GROUP_MEMBERS: Record<string, GroupMember[]> = {
  'GRP-0041': [
    {
      borrowerId: 'borrower-001',
      fullName: 'Adwoa Nhyira',
      role: GROUP_MEMBER_ROLE.LEADER,
      loanStatus: GROUP_MEMBER_LOAN_STATUS.ACTIVE,
      paymentConsistencyPercent: 92,
    },
    {
      borrowerId: 'borrower-004',
      fullName: 'Esi Ofori',
      role: GROUP_MEMBER_ROLE.MEMBER,
      loanStatus: GROUP_MEMBER_LOAN_STATUS.ACTIVE,
      paymentConsistencyPercent: 88,
    },
    {
      borrowerId: 'borrower-005',
      fullName: 'Grace Ampofo',
      role: GROUP_MEMBER_ROLE.MEMBER,
      loanStatus: GROUP_MEMBER_LOAN_STATUS.DEFAULTED,
      paymentConsistencyPercent: 41,
    },
  ],
  'GRP-0038': [
    {
      borrowerId: 'borrower-002',
      fullName: 'Akua Boateng',
      role: GROUP_MEMBER_ROLE.LEADER,
      loanStatus: GROUP_MEMBER_LOAN_STATUS.ACTIVE,
      paymentConsistencyPercent: 97,
    },
    {
      borrowerId: 'borrower-006',
      fullName: 'Yaa Serwaa',
      role: GROUP_MEMBER_ROLE.MEMBER,
      loanStatus: GROUP_MEMBER_LOAN_STATUS.ACTIVE,
      paymentConsistencyPercent: 94,
    },
  ],
  'GRP-0029': [
    {
      borrowerId: 'borrower-003',
      fullName: 'Abena Korkor',
      role: GROUP_MEMBER_ROLE.LEADER,
      loanStatus: GROUP_MEMBER_LOAN_STATUS.COMPLETED,
      paymentConsistencyPercent: 100,
    },
  ],
};
