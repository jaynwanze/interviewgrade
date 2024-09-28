import { Table } from '@/types';

export type TeamInvitationRowProps = {
  email: string;
  status: Table<'organization_join_invitations'>['status'];
  created_at: string;
  id: string;
  index: number;
};

export type TeamInvitationsTableProps = {
  invitations: Array<TeamInvitationRowProps>;
  organizationId: string;
};
