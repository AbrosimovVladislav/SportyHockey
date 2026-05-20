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

export type VenueDto = {
  id: string;
  name: string;
  address: string | null;
  default_cost_per_player: number | null;
  cost_per_arena: number | null;
};

export type VenuesListResponse = {
  venues: VenueDto[];
};

export type EventVenue = {
  id: string;
  name: string;
  address: string | null;
};

export type EventDto = {
  id: string;
  type: EventType;
  title: string | null;
  starts_at: string;
  ends_at: string | null;
  venue: EventVenue | null;
  venue_text: string | null;
  cost_per_player: number | null;
  arena_cost: number | null;
  opponent_name: string | null;
  status: EventStatus;
  attendance: AttendanceCount;
};

export type EventVote = 'going' | 'maybe' | 'not_going';

export type PlayerPosition = 'forward' | 'defender' | 'goalie';

export type TeamSide = 'light' | 'dark';

export type LineIndex = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type ForwardRole = 'lw' | 'c' | 'rw';
export type DefenseRole = 'ld' | 'rd';
export type LineSlot =
  | `f${LineIndex}_${ForwardRole}`
  | `d${LineIndex}_${DefenseRole}`
  | 'g'
  | 'g1'
  | 'g2';

export type EventLineEntry = {
  team_side: TeamSide;
  slot: LineSlot;
  user_id: string;
};

export type EventAttendee = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  photo_url: string | null;
  role: MemberRole;
  vote: EventVote | null;
  jersey_number: number | null;
  position: PlayerPosition | null;
  showed_up: boolean | null;
  paid_amount: number | null;
  payment_claim: boolean;
  team_side: TeamSide | null;
};

export type EventPaymentSummary = {
  paid_count: number;
  partial_count: number;
  debt_count: number;
  collected: number;
  target: number;
};

export type EventDetailDto = EventDto & {
  team_id: string;
  description: string | null;
  created_by: string | null;
  team_size: number;
  attendees: EventAttendee[];
  payments: EventPaymentSummary;
  lines: EventLineEntry[];
  media_count: number;
  cancelled_reason: string | null;
};

export type MediaUploader = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  photo_url: string | null;
};

export type MediaItemDto = {
  id: string;
  url: string;
  width: number | null;
  height: number | null;
  mime_type: string | null;
  created_at: string;
  uploaded_by: MediaUploader | null;
};

export type EventMediaResponse = {
  items: MediaItemDto[];
};

export type DeleteMediaResponse = { ok: true };

export type SignMediaRequest = {
  files: { mime: string; size: number }[];
};

export type SignMediaUpload = {
  path: string;
  signed_url: string;
  token: string;
  mime: string;
};

export type SignMediaResponse = {
  uploads: SignMediaUpload[];
};

export type CommitMediaRequest = {
  items: { path: string; mime: string }[];
};

export type SetPaymentRequest = {
  user_id: string;
  amount: number | null;
};

export type SetAttendanceRequest = {
  user_id: string;
  showed_up: boolean;
};

export type SetLineupRequest = {
  user_id: string;
  team_side: TeamSide | null;
};

export type SetLineupResponse = { ok: true };

export type SetLineRequest = {
  user_id: string;
  team_side: TeamSide;
  slot: LineSlot | null;
};

export type SetLineResponse = { ok: true };

export type PaymentClaimResponse = { ok: true };

export type VoteRequest = {
  vote: 'going' | 'not_going' | null;
};

export type VoteResponse = { ok: true };

export type EventsListResponse = {
  team_size: number;
  events: EventDto[];
};

export type CreateEventRequest = {
  type: EventType;
  starts_at: string;
  duration_minutes: number;
  venue_id: string;
  title?: string;
  cost_per_player?: number;
  arena_cost?: number;
  opponent_name?: string;
};

export type UpdateEventRequest = {
  type?: EventType;
  starts_at?: string;
  duration_minutes?: number;
  venue_id?: string;
  title?: string | null;
  description?: string | null;
  cost_per_player?: number | null;
  arena_cost?: number | null;
  opponent_name?: string | null;
  status?: 'scheduled' | 'cancelled';
  cancelled_reason?: string | null;
};

export type UpdateEventResponse = { ok: true };

export type CreateEventResponse = { id: string };
