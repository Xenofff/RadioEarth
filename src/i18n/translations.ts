export type Language = 'ru' | 'en';

export interface Translations {
  // Brand & Header
  brandTitle: string;
  brandLive: string;
  brandSubtitle: string;
  randomBtn: string;
  randomTitle: string;
  telemetry: string;
  altPrefix: string;
  coordN: string;
  coordS: string;
  coordE: string;
  coordW: string;
  orbitTelemetry: (cities: number, stations: number) => string;
  engineOnline: string;

  // Language & Theme Switcher
  switchLangTitle: string;
  currentLangLabel: string;
  switchThemeTitle: string;
  themeLight: string;
  themeDark: string;

  // Player Bottom
  buffering: string;
  onAir: string;
  streamOffline: string;
  paused: string;
  playTitle: string;
  pauseTitle: string;
  prevStationTitle: string;
  nextStationTitle: string;
  allStationsBtn: string;
  viewCityStationsTitle: string;
  muteTitle: string;
  unmuteTitle: string;

  // City Drawer
  stationsAvailable: (count: number) => string;
  searchPlaceholder: string;
  clearBtn: string;
  noStationsFound: (query: string) => string;
  closeDrawerTitle: string;

  // Loading & Error Screens
  loadingTitle: string;
  loadingSubtitle: string;
  errorTitle: string;
  errorMessage: string;
  retryBtn: string;

  // Retention: Favorites
  favoritesTitle: string;
  favoritesBtn: string;
  favoritesEmpty: string;
  favoritesEmptySubtitle: string;
  addToFavorites: string;
  removeFromFavorites: string;
  favoritesCount: (count: number) => string;

  // Retention: Sharing
  shareBtn: string;
  shareCopied: string;
  shareTitle: string;

  // Retention: Global Search
  searchGlobalBtn: string;
  searchGlobalTitle: string;
  searchPlaceholderGlobal: string;
  searchShortcut: string;
  searchNoResults: (query: string) => string;
  quickGenres: string;
  searchHint: string;

  // Local Time & Atmospheric Periods
  localTime: string;
  timeNight: string;
  timeMorning: string;
  timeDay: string;
  timeEvening: string;
}

function pluralizeRu(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 19) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}

export const translations: Record<Language, Translations> = {
  ru: {
    brandTitle: 'RADIO EARTH',
    brandLive: 'В ЭФИРЕ',
    brandSubtitle: 'ГЛОБАЛЬНЫЙ РАДИОТЮНЕР',
    randomBtn: 'СЛУЧАЙНО',
    randomTitle: 'Перейти к случайному городу',
    telemetry: 'ТЕЛЕМЕТРИЯ',
    altPrefix: 'ВЫС',
    coordN: 'С.Ш.',
    coordS: 'Ю.Ш.',
    coordE: 'В.Д.',
    coordW: 'З.Д.',
    orbitTelemetry: (cities: number, stations: number) =>
      `ВЕКТОРНАЯ ОРБИТА • ${cities} ${pluralizeRu(cities, 'ГОРОД', 'ГОРОДА', 'ГОРОДОВ')} • ${stations} ${pluralizeRu(stations, 'СТАНЦИЯ', 'СТАНЦИИ', 'СТАНЦИЙ')}`,
    engineOnline: 'СИСТЕМА НАБЛЮДЕНИЯ АКТИВНА',

    switchLangTitle: 'Переключить язык (Switch to English)',
    currentLangLabel: 'RU',
    switchThemeTitle: 'Сменить тему оформления',
    themeLight: 'Светлая тема',
    themeDark: 'Темная тема',

    buffering: 'БУФЕРИЗАЦИЯ ПОТОКА...',
    onAir: 'В ЭФИРЕ',
    streamOffline: 'ПОТОК НЕДОСТУПЕН',
    paused: 'ПАУЗА',
    playTitle: 'Воспроизведение',
    pauseTitle: 'Пауза',
    prevStationTitle: 'Предыдущая станция в городе',
    nextStationTitle: 'Следующая станция в городе',
    allStationsBtn: 'ВСЕ СТАНЦИИ',
    viewCityStationsTitle: 'Показать все станции города',
    muteTitle: 'Выключить звук',
    unmuteTitle: 'Включить звук',

    stationsAvailable: (count: number) =>
      `${count} ${pluralizeRu(count, 'станция доступна', 'станции доступны', 'станций доступно')}`,
    searchPlaceholder: 'Поиск станций или жанров...',
    clearBtn: 'Очистить',
    noStationsFound: (query: string) => `Станций по запросу «${query}» не найдено`,
    closeDrawerTitle: 'Закрыть панель',

    loadingTitle: 'СИНХРОНИЗАЦИЯ ОРБИТАЛЬНЫХ ЧАСТОТ',
    loadingSubtitle: 'ЗАГРУЗКА ТОПОЛОГИИ • HTTPS ПОТОКИ',
    errorTitle: 'СИГНАЛ ПРЕРВАН',
    errorMessage: 'Не удалось загрузить радиочастоты. Проверьте подключение к сети.',
    retryBtn: 'ПОВТОРИТЬ ПОДКЛЮЧЕНИЕ',

    // Retention: Favorites
    favoritesTitle: 'ИЗБРАННЫЕ СТАНЦИИ',
    favoritesBtn: 'ИЗБРАННОЕ',
    favoritesEmpty: 'В избранном пока пусто',
    favoritesEmptySubtitle: 'Нажмите сердечко у любой радиостанции, чтобы сохранить её для быстрого доступа',
    addToFavorites: 'Добавить в избранное',
    removeFromFavorites: 'Удалить из избранного',
    favoritesCount: (count: number) =>
      `${count} ${pluralizeRu(count, 'сохраненная станция', 'сохраненные станции', 'сохраненных станций')}`,

    // Retention: Sharing
    shareBtn: 'ПОДЕЛИТЬСЯ',
    shareCopied: 'Ссылка скопирована в буфер!',
    shareTitle: 'Скопировать прямую ссылку на станцию',

    // Retention: Global Search
    searchGlobalBtn: 'ПОИСК',
    searchGlobalTitle: 'Глобальный поиск (Cmd+K)',
    searchPlaceholderGlobal: 'Поиск по станции, городу, стране или жанру...',
    searchShortcut: 'Cmd+K',
    searchNoResults: (query: string) => `Ничего не найдено по запросу «${query}»`,
    quickGenres: 'Популярные жанры:',
    searchHint: 'Нажмите Enter для перехода или Esc для закрытия',

    // Local Time & Atmospheric Periods
    localTime: 'Местное время',
    timeNight: 'Ночь',
    timeMorning: 'Утро',
    timeDay: 'День',
    timeEvening: 'Вечер',
  },
  en: {
    brandTitle: 'RADIO EARTH',
    brandLive: 'LIVE',
    brandSubtitle: 'GLOBAL FREQUENCY TUNER',
    randomBtn: 'RANDOM',
    randomTitle: 'Tune in to a random city',
    telemetry: 'TELEMETRY',
    altPrefix: 'ALT',
    coordN: 'N',
    coordS: 'S',
    coordE: 'E',
    coordW: 'W',
    orbitTelemetry: (cities: number, stations: number) =>
      `VECTOR ORBIT • ${cities} ${cities === 1 ? 'CITY' : 'CITIES'} • ${stations} ${stations === 1 ? 'STATION' : 'STATIONS'}`,
    engineOnline: 'GEOJSON VECTOR ENGINE ONLINE',

    switchLangTitle: 'Switch language to Russian / Переключить на русский',
    currentLangLabel: 'EN',
    switchThemeTitle: 'Switch theme',
    themeLight: 'Light theme',
    themeDark: 'Dark theme',

    buffering: 'BUFFERING STREAM...',
    onAir: 'ON AIR',
    streamOffline: 'STREAM OFFLINE',
    paused: 'PAUSED',
    playTitle: 'Play',
    pauseTitle: 'Pause',
    prevStationTitle: 'Previous station in city',
    nextStationTitle: 'Next station in city',
    allStationsBtn: 'ALL STATIONS',
    viewCityStationsTitle: 'Click to view city stations',
    muteTitle: 'Mute',
    unmuteTitle: 'Unmute',

    stationsAvailable: (count: number) =>
      `${count} ${count === 1 ? 'station' : 'stations'} available`,
    searchPlaceholder: 'Search stations or genres...',
    clearBtn: 'Clear',
    noStationsFound: (query: string) => `No radio stations found matching "${query}"`,
    closeDrawerTitle: 'Close drawer',

    loadingTitle: 'SYNCHRONIZING ORBITAL FREQUENCIES',
    loadingSubtitle: 'LOADING VECTOR TOPOLOGY • HTTPS STREAMS',
    errorTitle: 'SIGNAL INTERRUPTED',
    errorMessage: 'Failed to load live radio frequencies. Please check network connection.',
    retryBtn: 'RETRY CONNECTION',

    // Retention: Favorites
    favoritesTitle: 'FAVORITE STATIONS',
    favoritesBtn: 'FAVORITES',
    favoritesEmpty: 'No favorites saved yet',
    favoritesEmptySubtitle: 'Click the heart icon on any station to save it for quick access',
    addToFavorites: 'Add to favorites',
    removeFromFavorites: 'Remove from favorites',
    favoritesCount: (count: number) =>
      `${count} ${count === 1 ? 'saved station' : 'saved stations'}`,

    // Retention: Sharing
    shareBtn: 'SHARE',
    shareCopied: 'Link copied to clipboard!',
    shareTitle: 'Copy direct share link to station',

    // Retention: Global Search
    searchGlobalBtn: 'SEARCH',
    searchGlobalTitle: 'Global search (Cmd+K / Ctrl+K)',
    searchPlaceholderGlobal: 'Search station, city, country, or genre...',
    searchShortcut: 'Ctrl+K',
    searchNoResults: (query: string) => `No results found matching "${query}"`,
    quickGenres: 'Popular genres:',
    searchHint: 'Press Enter to select or Esc to close',

    // Local Time & Atmospheric Periods
    localTime: 'Local time',
    timeNight: 'Night',
    timeMorning: 'Morning',
    timeDay: 'Afternoon',
    timeEvening: 'Evening',
  },
};

/**
 * Detects default language on first visit:
 * 1. Checks localStorage preference
 * 2. Checks browser/system language
 */
export function getDefaultLanguage(): Language {
  try {
    const saved = localStorage.getItem('radio_earth_lang');
    if (saved === 'ru' || saved === 'en') {
      return saved;
    }

    const browserLang =
      (typeof navigator !== 'undefined' &&
        (navigator.language || (navigator.languages && navigator.languages[0]))) ||
      '';

    if (browserLang.toLowerCase().startsWith('ru') || browserLang.toLowerCase().startsWith('be') || browserLang.toLowerCase().startsWith('uk')) {
      return 'ru';
    }
  } catch {
    // Fallback in case localStorage or navigator is inaccessible
  }

  return 'en';
}
