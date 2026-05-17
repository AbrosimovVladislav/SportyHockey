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

export type EventType = 'training' | 'game';
export type EventStatus = 'scheduled' | 'cancelled' | 'completed';

export type AttendanceCount = {
  going: number;
  maybe: number;
  not_going: number;
};

export type EventDto = {
  id: string;
  type: EventType;
  title: string | null;
  starts_at: string;
  ends_at: string | null;
  venue_text: string | null;
  cost_per_player: number | null;
  status: EventStatus;
  attendance: AttendanceCount;
};

export type EventDetailDto = EventDto & {
  team_id: string;
  description: string | null;
  created_by: string | null;
};

export type EventsListResponse = {
  events: EventDto[];
};

export type CreateEventRequest = {
  type: EventType;
  starts_at: string;
  title?: string;
  ends_at?: string | null;
  venue_text?: string;
  cost_per_player?: number;
  description?: string;
};

export type UpdateEventRequest = {
  type?: EventType;
  starts_at?: string;
  title?: string;
  ends_at?: string | null;
  venue_text?: string;
  cost_per_player?: number;
  description?: string;
  status?: 'scheduled' | 'cancelled';
};

export type CreateEventResponse = { id: string };
