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
  'onboarding.title': 'Добро пожаловать',

  // Common
  'common.empty': 'Пока ничего нет',
  'common.loading': 'Загружаем',
  'common.error': 'Что-то пошло не так',
} as const;

export type TKey = keyof typeof ru;
