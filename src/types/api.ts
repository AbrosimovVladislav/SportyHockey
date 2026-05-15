export type MemberRole = 'organizer' | 'player';

export type MeUser = {
  id: string;
  telegram_id: number;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  photo_url: string | null;
};

export type MeMembership = {
  team_id: string;
  team_name: string;
  role: MemberRole;
};

export type MeResponse = {
  user: MeUser;
  memberships: MeMembership[];
  invite_link: string | null;
};

export type CreateTeamRequest = {
  name: string;
};

export type CreateTeamResponse = {
  team: { id: string; name: string };
  membership: { role: 'organizer' };
};

export type TeamMember = {
  user_id: string;
  telegram_id: number;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  photo_url: string | null;
  role: MemberRole;
};

export type TeamMembersResponse = {
  team: { id: string; name: string };
  members: TeamMember[];
};
