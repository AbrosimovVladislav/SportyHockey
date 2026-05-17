export const ru = {
  // Tabs (нижняя навигация: Команда / События / Деньги / Состав / Ещё)
  'tabs.home': 'Команда',
  'tabs.events': 'События',
  'tabs.squad': 'Состав',
  'tabs.money': 'Деньги',
  'tabs.profile': 'Ещё',

  // Pages — заголовки-заглушки
  'home.title': 'Команда',
  'events.title': 'События',
  'squad.title': 'Состав команды',
  'money.title': 'Деньги',
  'profile.title': 'Профиль',

  // Onboarding
  'onboarding.welcome.title': 'Привет!',
  'onboarding.welcome.subtitle': 'Кто ты в команде?',
  'onboarding.role.organizer': 'Я организатор',
  'onboarding.role.player': 'Я игрок',
  'onboarding.organizer.title': 'Создай команду',
  'onboarding.organizer.namePlaceholder': 'Название команды',
  'onboarding.organizer.create': 'Создать команду',
  'onboarding.player.title': 'Жди ссылку от организатора',
  'onboarding.player.description':
    'Попроси организатора прислать ссылку приглашения в Telegram. Нажми её — попадёшь в команду.',
  'onboarding.back': 'Назад',

  // Profile
  'profile.team': 'Команда',
  'profile.role.organizer': 'Организатор',
  'profile.role.player': 'Игрок',
  'profile.copyInvite': 'Скопировать ссылку приглашения',
  'profile.copyInviteHint': 'Перешли её игрокам — они нажмут и попадут в команду.',
  'profile.copied': 'Скопировано',

  // Squad
  'squad.empty': 'В команде пока никого нет',

  // Schedule (расписание событий)
  'schedule.role.organizer': 'Капитан',
  'schedule.role.player': 'Игрок',
  'schedule.title': 'Расписание',
  'schedule.tabs.list': 'Список',
  'schedule.tabs.calendar': 'Календарь',
  'schedule.filters.all': 'Все',
  'schedule.filters.training': 'Тренировки',
  'schedule.filters.game': 'Игры',
  'schedule.sections.today': 'Сегодня',
  'schedule.sections.week': 'Эта неделя',
  'schedule.sections.later': 'Далее',
  'schedule.empty': 'Событий пока нет',
  'schedule.calendarSoon': 'Календарь скоро',
  'schedule.fabLabel': 'Создать событие',
  'schedule.backLabel': 'Назад',
  'schedule.titles.training': 'Тренировка',
  'schedule.titles.game': 'Игра',

  // Common
  'common.empty': 'Пока ничего нет',
  'common.loading': 'Загружаем',
  'common.error': 'Что-то пошло не так',
} as const;

export type TKey = keyof typeof ru;
