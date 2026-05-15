export const ru = {
  // Tabs
  'tabs.home': 'Главная',
  'tabs.events': 'События',
  'tabs.squad': 'Состав',
  'tabs.money': 'Деньги',
  'tabs.profile': 'Профиль',

  // Pages — заголовки-заглушки v0.0
  'home.title': 'Главная',
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
  'onboarding.player.description': 'Попроси организатора прислать ссылку приглашения в Telegram. Нажми её — попадёшь в команду.',
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

  // Common
  'common.empty': 'Пока ничего нет',
  'common.loading': 'Загружаем',
  'common.error': 'Что-то пошло не так',
} as const;

export type TKey = keyof typeof ru;
