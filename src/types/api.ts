export type MemberRole = 'organizer' | 'player';

export type MeUser = {
  id: string;
  telegram_id: number;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  photo_url: string | null;
  avatar_url: string | null;
  birth_date: string | null;
  bio: string | null;
  shoots: PlayerShoots | null;
  // Личные контакты пользователя (общие, не по команде). Живут в users.
  // Три типа: Telegram (поле username выше), телефон (contact_phone),
  // WhatsApp (contact_whatsapp). E-mail в продукте не используется.
  contact_phone: string | null;
  contact_whatsapp: string | null;
  // Прошёл ли пользователь онбординг (заполнил/подтвердил свой профиль).
  onboarded: boolean;
};

export type MeMembership = {
  team_id: string;
  team_name: string;
  team_logo_url: string | null;
  role: MemberRole;
};

// Активная (pending) заявка пользователя на вступление — для экрана ожидания.
export type PendingJoinRequest = {
  team_id: string;
  team_name: string;
};

export type MeResponse = {
  user: MeUser;
  memberships: MeMembership[];
  invite_link: string | null;
  pending_join_request: PendingJoinRequest | null;
};

// PATCH /api/me — игрок редактирует собственные поля в users (v0.4).
// avatar_path добавляется в итерации 44 для подключения signed-upload аватара.
export type UpdateMeRequest = {
  first_name?: string | null;
  last_name?: string | null;
  birth_date?: string | null;
  shoots?: PlayerShoots | null;
  bio?: string | null;
  username?: string | null;
  contact_phone?: string | null;
  contact_whatsapp?: string | null;
  avatar_path?: string | null;
};
// Возвращаем полный MeResponse, чтобы фронт мог сразу применить изменения
// (новый avatar_url, пересчитанные membershipss и т.п.).
export type UpdateMeResponse = MeResponse;

// PATCH /api/me/membership — игрок редактирует свои командные поля в
// активной команде (v0.4, итерация 44): номер, амплуа, слот, капитанство, tier.
export type UpdateMyMembershipRequest = {
  jersey_number?: number | null;
  position?: PlayerPosition | null;
  slot_role?: PlayerSlotRole | null;
  captaincy?: PlayerCaptaincy;
  tier?: MemberTier;
};
export type UpdateMyMembershipResponse = { ok: true };

// Личный инбокс игрока (v0.4, итерация 46).
// kind='invite' — приглашение от команды; kind='request' — моя заявка в команду.
export type MyInviteKind = 'invite' | 'request';
export type MyInviteItem = {
  id: string;
  team_id: string;
  team_name: string;
  team_logo_url: string | null;
  kind: MyInviteKind;
  status: JoinRequestStatus;
  decided_at: string | null;
  created_at: string;
};
export type MyInvitesResponse = { items: MyInviteItem[] };

export type MyInviteDecisionRequest = { action: 'approve' | 'reject' };
export type MyInviteDecisionResponse = { ok: true; team_id: string; status: JoinRequestStatus };

export type ApplyToTeamRequest = { team_id: string };
export type ApplyToTeamResponse = { ok: true; status: JoinRequestStatus; already?: boolean };

export type CreateTeamRequest = {
  name: string;
};

export type CreateTeamResponse = {
  team: { id: string; name: string };
  membership: { role: 'organizer' };
};

export type PlayerSlotRole = 'lw' | 'c' | 'rw' | 'ld' | 'rd' | 'g';
export type MemberTier = 'main' | 'reserve';
export type PlayerShoots = 'left' | 'right';
// Капитанская нашивка — отдельно от прав organizer/player (MemberRole).
export type PlayerCaptaincy = 'none' | 'assistant' | 'captain';

export type TeamMember = {
  user_id: string;
  telegram_id: number | null;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  photo_url: string | null;
  avatar_url: string | null;
  birth_date: string | null;
  bio: string | null;
  shoots: PlayerShoots | null;
  role: MemberRole;
  captaincy: PlayerCaptaincy;
  jersey_number: number | null;
  position: PlayerPosition | null;
  slot_role: PlayerSlotRole | null;
  tier: MemberTier;
  note: string | null;
  // Контакты живут в users (общие, не по команде); здесь продублированы для
  // удобства фронта (показываются в карточках состава, в публичном профиле).
  contact_phone: string | null;
  contact_whatsapp: string | null;
  is_placeholder: boolean;
  // Посещаемость: showed_up / число прошедших не-отменённых событий команды (0–100).
  // null — у команды ещё нет прошедших событий.
  attendance_rate: number | null;
};

export type TeamMembersResponse = {
  team: { id: string; name: string };
  members: TeamMember[];
};

export type TeamMemberDetailResponse = {
  team: { id: string; name: string };
  member: TeamMember;
};

// Редактирование игрока организатором. Персональные поля → users, командные → team_memberships.
// avatar_path — путь в бакете team-media (после signed-upload); сервер сохранит public URL в avatar_url.
// role — смена роли организатор/игрок (итерация 41). Запрещено снимать роль с единственного
// организатора — сервер вернёт 409.
export type UpdateMemberRequest = {
  first_name?: string | null;
  last_name?: string | null;
  birth_date?: string | null;
  shoots?: PlayerShoots | null;
  avatar_path?: string | null;
  // Telegram-ник (users.username) — редактируется руками, в т.ч. для игрока без аккаунта.
  username?: string | null;
  contact_phone?: string | null;
  contact_whatsapp?: string | null;
  jersey_number?: number | null;
  position?: PlayerPosition | null;
  slot_role?: PlayerSlotRole | null;
  captaincy?: PlayerCaptaincy;
  tier?: MemberTier;
  role?: MemberRole;
};
export type UpdateMemberResponse = { ok: true };
export type DeleteMemberResponse = { ok: true };

// Создание игрока организатором (flow 2). Те же поля, что и в редактировании,
// плюс invite — отправлять ли приглашение (генерировать invite-ссылку).
export type CreateMemberRequest = {
  first_name?: string | null;
  last_name?: string | null;
  birth_date?: string | null;
  shoots?: PlayerShoots | null;
  avatar_path?: string | null;
  username?: string | null;
  contact_phone?: string | null;
  contact_whatsapp?: string | null;
  jersey_number?: number | null;
  position?: PlayerPosition | null;
  slot_role?: PlayerSlotRole | null;
  captaincy?: PlayerCaptaincy;
  tier?: MemberTier;
  invite?: boolean;
};
export type CreateMemberResponse = {
  user_id: string;
  // Заполнено только если invite=true — ссылка, которую организатор пересылает игроку.
  invite_link: string | null;
};

// Завершение онбординга (flow 1 — игрок сам / flow 2 — приглашённый подтверждает профиль).
// join_team_id задаётся только при самостоятельном приходе игрока без членства.
export type OnboardRequest = {
  first_name?: string | null;
  last_name?: string | null;
  birth_date?: string | null;
  shoots?: PlayerShoots | null;
  avatar_path?: string | null;
  username?: string | null;
  join_team_id?: string | null;
};
export type OnboardResponse = { ok: true };

// Поиск команды при онбординге игрока.
export type TeamSearchItem = {
  id: string;
  name: string;
  logo_url: string | null;
  member_count: number;
};
export type TeamSearchResponse = { teams: TeamSearchItem[] };

// Заявки на вступление: pending — ожидание решения организатора (для pop-up в
// профиле и активной части экрана /squad/requests). approved/rejected —
// история, видна на экране /squad/requests в режиме ?status=all.
export type JoinRequestStatus = 'pending' | 'approved' | 'rejected';
export type JoinRequestItem = {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  photo_url: string | null;
  avatar_url: string | null;
  status: JoinRequestStatus;
  decided_at: string | null;
  created_at: string;
};
export type JoinRequestsResponse = { requests: JoinRequestItem[] };
export type JoinRequestDecisionRequest = { action: 'approve' | 'reject' };
export type JoinRequestDecisionResponse = { ok: true };

export type SignAvatarRequest = { mime: string };
export type SignAvatarResponse = SignMediaUpload;

export type EventType = 'training' | 'game';
export type EventStatus = 'scheduled' | 'cancelled' | 'completed';

export type AttendanceCount = {
  going: number;
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
  photo_url: string | null;
};

export type EventDto = {
  id: string;
  type: EventType;
  title: string | null;
  starts_at: string;
  ends_at: string | null;
  venue: EventVenue | null;
  cost_per_player: number | null;
  arena_cost: number | null;
  opponent_name: string | null;
  status: EventStatus;
  attendance: AttendanceCount;
};

export type EventVote = 'going' | 'not_going';

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
  details: string | null;
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
  mime_type: string | null;
  created_at: string;
  uploaded_by: MediaUploader | null;
};

export type EventMediaResponse = {
  items: MediaItemDto[];
};

// Медиа в общей галерее команды — расширено информацией о событии,
// чтобы шапка просмотрщика показывала, где это снято.
export type TeamMediaEventInfo = {
  id: string;
  type: EventType;
  title: string | null;
  starts_at: string;
  ends_at: string | null;
  venue: { name: string } | null;
};

export type TeamMediaItemDto = MediaItemDto & {
  // Медиа из общей галереи может быть как привязано к событию (загружено со
  // страницы события), так и без привязки (загружено прямо в галерею команды).
  event: TeamMediaEventInfo | null;
};

export type TeamMediaResponse = {
  items: TeamMediaItemDto[];
};

// Командная статистика и аналитика (/squad/stats).
// Один endpoint /api/teams/me/stats?type=game|training — переключатель сегмента
// «Игры / Тренировки» на экране.

export type TeamStatsType = 'game' | 'training';

export type TeamStatsSummary = {
  events_played: number;
  // Победы считаются только для игр (по сохранённому events.outcome).
  // Для тренировок — null, карточка скрывается на фронте.
  wins: number | null;
  goals: number;
  assists: number;
};

export type TeamStatsPlayerRow = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  photo_url: string | null;
  avatar_url: string | null;
  jersey_number: number | null;
  position: PlayerPosition | null;
  goals: number;
  assists: number;
  points: number;
  penalty_minutes: number;
  // Число событий выбранного типа, на которых игрок отмечен showed_up=true.
  games_played: number;
};

// Универсальная мини-карточка игрока в аналитике (лидеры, эффективность, связки).
export type TeamStatsLeader = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  photo_url: string | null;
  avatar_url: string | null;
  jersey_number: number | null;
  position: PlayerPosition | null;
  value: number;
};

export type TeamStatsPointsShare = {
  user_id: string | null; // null = группа «Остальные» в распределении
  first_name: string | null;
  last_name: string | null;
  points: number;
};

// Топ связок — это партнёрства, а не упорядоченные пары «ассистент→бомбардир».
// (Абросимов→Жан) и (Жан→Абросимов) считаются одной и той же связкой и суммируются.
// player_a/player_b — два игрока пары; порядок внутри пары не несёт смысла
// (фактически — стабильная сортировка по user_id для дедупликации ключа).
// goals — суммарное число голов, в забивании которых участвовала эта пара
// в любом направлении.
export type TeamStatsTopCombination = {
  player_a: TeamStatsLeader;
  player_b: TeamStatsLeader;
  goals: number;
};

export type TeamStatsPositionContribution = {
  position: PlayerPosition;
  goals: number;
  assists: number;
};

export type TeamStatsAnalytics = {
  total_points: number;
  // Топ-3 игроков по очкам + строка «Остальные» (для донат-чарта).
  points_distribution: TeamStatsPointsShare[];
  total_goals: number;
  total_assists: number;
  // Топ-3 по очкам за событие выбранного типа (среди игроков с games_played > 0).
  top_efficiency: TeamStatsLeader[];
  leaders: {
    points: TeamStatsLeader | null;
    goals: TeamStatsLeader | null;
    assists: TeamStatsLeader | null;
    penalties: TeamStatsLeader | null; // value = минуты штрафа
  };
  // Голы/передачи по группам нападающие/защитники/вратари.
  by_position: TeamStatsPositionContribution[];
  // Пары «ассистент → бомбардир» с числом голов в паре, отсортированы убыванием.
  top_combinations: TeamStatsTopCombination[];
  // Топ-3 по сумме минут штрафа.
  top_penalties: TeamStatsLeader[];
};

export type TeamStatsResponse = {
  type: TeamStatsType;
  summary: TeamStatsSummary;
  players: TeamStatsPlayerRow[];
  analytics: TeamStatsAnalytics;
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

// Дефолты команды (team-level): звенья и распределение Светлые/Тёмные.
// Звенья — единое построение без деления на light/dark; стороны — независимая раскладка.
export type TeamDefaultLineEntry = {
  user_id: string;
  slot: LineSlot;
};

export type TeamDefaultSideEntry = {
  user_id: string;
  team_side: TeamSide;
};

export type TeamLinesResponse = {
  lines: TeamDefaultLineEntry[];
};

export type TeamSidesResponse = {
  sides: TeamDefaultSideEntry[];
};

export type SetTeamLineRequest = {
  user_id: string;
  slot: LineSlot | null;
};

export type SetTeamSideRequest = {
  user_id: string;
  team_side: TeamSide | null;
};

export type SetTeamLineResponse = { ok: true };
export type SetTeamSideResponse = { ok: true };

// Публичный профиль игрока — агрегаты для вкладки «Обзор».
export type AttendanceStatus = 'showed' | 'missed' | 'unknown';
export type AttendanceLast5Item = { event_id: string; status: AttendanceStatus };
export type PlayerStatLine = { played: number; goals: number; assists: number };

export type PlayerOverview = {
  // Посещаемость: rate 0–100 или null (нет прошедших событий за период членства).
  attendance: { rate: number | null; last5: AttendanceLast5Item[] };
  // balance > 0 — игрок должен команде; < 0 — команда должна игроку.
  finance: { balance: number };
  stats: { games: PlayerStatLine; trainings: PlayerStatLine };
};

export type PlayerOverviewResponse = PlayerOverview;

// Вкладка «Финансы» в профиле.
// Сдвоенная строка события: начисление + оплата за одно событие. Кликабельна → /events/[id].
export type PlayerFinanceEventRow = {
  kind: 'event';
  event_id: string;
  title: string;
  is_game: boolean;
  charged: number; // начислено (cost_per_player); 0 — оплата без явки/начисления
  charged_date: string; // дата события (starts_at) — по ней сортируем
  paid: number; // сумма оплат по событию; 0 — не оплачено
  paid_date: string | null; // когда организатор отметил оплату; null при paid=0
};
// Отдельная строка: оплата без привязки к событию (депозит). Не кликабельна.
export type PlayerFinanceDepositRow = {
  kind: 'deposit';
  id: string;
  title: string | null; // описание перевода
  amount: number;
  date: string;
};
export type PlayerFinanceRow = PlayerFinanceEventRow | PlayerFinanceDepositRow;
export type PlayerFinance = {
  balance: number; // > 0 — игрок должен; < 0 — переплата
  total_charged: number;
  total_paid: number;
  paid_percent: number; // 0–100
  rows: PlayerFinanceRow[]; // события и депозиты вперемешку, по дате desc
};
export type PlayerFinanceResponse = PlayerFinance;

// Вкладка «Статистика» в профиле.
export type PlayerEventStat = {
  event_id: string;
  is_game: boolean;
  title: string;
  starts_at: string;
  goals: number;
  assists: number;
  penalty_minutes: number;
};
export type PlayerStats = {
  games: { played: number; goals: number; assists: number; penalty_minutes: number };
  trainings: { played: number; goals: number; assists: number };
  events: PlayerEventStat[];
};
export type PlayerStatsResponse = PlayerStats;

export type PaymentClaimResponse = { ok: true };

export type VoteRequest = {
  vote: 'going' | 'not_going' | null;
};

export type VoteResponse = { ok: true };

export type EventsListResponse = {
  team_size: number;
  events: EventDto[];
};

export type ResultSide = 'own' | 'opponent' | 'light' | 'dark';

export type GoalParticipant = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  photo_url: string | null;
  jersey_number: number | null;
  position: PlayerPosition | null;
};

export type GoalDto = {
  id: string;
  team_side: ResultSide;
  scorer: GoalParticipant | null;
  assists: GoalParticipant[];
  time_seconds: number | null;
  created_at: string;
};

export type PenaltyDto = {
  id: string;
  team_side: ResultSide;
  player: GoalParticipant | null;
  minutes: number;
  time_seconds: number | null;
  created_at: string;
};

export type PlayerResultStats = {
  user: GoalParticipant;
  goals: number;
  assists: number;
  points: number;
  penalty_minutes: number;
};

export type ResultScore = {
  side_a: ResultSide;
  side_b: ResultSide;
  score_a: number;
  score_b: number;
};

export type EventResultDto = {
  event_id: string;
  is_game: boolean;
  own_team_name: string;
  opponent_name: string | null;
  score: ResultScore;
  goals: GoalDto[];
  penalties: PenaltyDto[];
  stats: PlayerResultStats[];
};

export type CreateGoalRequest = {
  team_side: ResultSide;
  scorer_user_id?: string | null;
  time_seconds?: number | null;
  assist1_user_id?: string | null;
  assist2_user_id?: string | null;
};

export type CreateGoalResponse = { id: string };

export type DeleteGoalResponse = { ok: true };

export type UpdateGoalRequest = CreateGoalRequest;
export type UpdateGoalResponse = { ok: true };

export type CreatePenaltyRequest = {
  team_side: ResultSide;
  player_user_id?: string | null;
  minutes: number;
  time_seconds?: number | null;
};

export type CreatePenaltyResponse = { id: string };

export type DeletePenaltyResponse = { ok: true };

export type UpdatePenaltyRequest = CreatePenaltyRequest;
export type UpdatePenaltyResponse = { ok: true };

export type CreateEventRequest = {
  type: EventType;
  starts_at: string;
  duration_minutes: number;
  venue_id: string;
  details?: string; // произвольное описание; название генерируется на сервере
  cost_per_player?: number;
  arena_cost?: number;
  opponent_name?: string;
};

export type UpdateEventRequest = {
  type?: EventType;
  starts_at?: string;
  duration_minutes?: number;
  venue_id?: string;
  details?: string | null; // название генерируется на сервере из type/opponent
  cost_per_player?: number | null;
  arena_cost?: number | null;
  opponent_name?: string | null;
  status?: 'scheduled' | 'cancelled';
  cancelled_reason?: string | null;
};

export type UpdateEventResponse = { ok: true };

export type CreateEventResponse = { id: string };

// ───────────────────────────────────────────────────────────────────────────
// Итерация 41 — Настройки команды (/squad/settings).
// Доступ — только организатор. Поля photo_url/default_*/archived_at живут в
// teams (миграция teams_add_settings_columns).
// ───────────────────────────────────────────────────────────────────────────

// Публичные поля команды для любого участника (хаб /squad, шапки).
// Доступны и игроку, и организатору через GET /api/teams/me.
export type TeamPublicDto = {
  id: string;
  name: string;
  logo_url: string | null;
  photo_url: string | null;
  archived_at: string | null;
};

// Стандартная арена команды — встраиваем минимальное venue-представление,
// чтобы UI мог сразу показать «Большая арена» в ListRow без отдельного запроса.
export type TeamSettingsVenue = {
  id: string;
  name: string;
  address: string | null;
};

export type TeamSettingsDto = {
  team_id: string;
  name: string;
  logo_url: string | null;
  photo_url: string | null;
  default_venue: TeamSettingsVenue | null;
  default_event_cost: number | null;
  default_player_fee: number | null;
  archived_at: string | null;
};

// PATCH /api/teams/me/settings — частичный апдейт, любые поля опциональны.
// logo_path / photo_path — пути в bucket team-media после signed-upload;
// сервер сохранит public URL в logo_url / photo_url.
export type UpdateTeamSettingsRequest = {
  name?: string;
  logo_path?: string | null;
  photo_path?: string | null;
  default_venue_id?: string | null;
  default_event_cost?: number | null;
  default_player_fee?: number | null;
};
export type UpdateTeamSettingsResponse = { ok: true };

// Sign-эндпоинты для загрузки логотипа и командной фотографии. Те же поля,
// что и в SignMediaUpload (использует тот же storage-клиент Supabase).
export type SignTeamMediaResponse = SignMediaUpload;

// Инвайт-токен команды. Один постоянный токен на команду, лениво создаётся
// при первом запросе. url — полный путь /join/<token>, готовый к копированию.
export type TeamInviteDto = {
  token: string;
  url: string;
};

// Превью команды для страницы /join/[token] — показывается до решения «принять».
export type JoinPreviewDto = {
  team: { id: string; name: string; logo_url: string | null };
  // already=true, если пользователь уже состоит в этой команде — кнопка
  // меняется на «Открыть команду» (редирект на /squad).
  already: boolean;
};

// Результат принятия инвайта. already=true возвращается, если игрок уже был
// в команде — на стороне клиента это эквивалентно успеху, редирект тот же.
export type JoinAcceptResponse = { ok: true; team_id: string; already: boolean };

export type LeaveTeamResponse = { ok: true };
export type ArchiveTeamResponse = { ok: true; archived_at: string };

