import { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { Translations } from '../i18n/translations';

export type TimePeriodKey = 'night' | 'morning' | 'day' | 'evening';

export interface CityLocalTimeResult {
  timeString: string; // "03:45"
  periodKey: TimePeriodKey; // "night"
  periodLabel: string; // "Ночь" or "Night"
  formatted: string; // "03:45 (Ночь)"
  hour: number;
  minute: number;
}

/**
 * Approximate daylight saving time for northern hemisphere (roughly end of March to end of October)
 */
function isNorthernSummer(now: Date): boolean {
  const month = now.getUTCMonth(); // 0-11
  return month >= 2 && month <= 9;
}

/**
 * Approximate daylight saving time for southern hemisphere (roughly October to April)
 */
function isSouthernSummer(now: Date): boolean {
  const month = now.getUTCMonth();
  return month >= 9 || month <= 3;
}

/**
 * Computes the timezone offset in hours from UTC for given coordinates & country code.
 * 100% client-side, zero external API requests.
 */
export function estimateTimezoneOffsetHours(
  lat: number,
  lng: number,
  countryCode?: string
): number {
  const code = (countryCode || '').toUpperCase().trim();
  const now = new Date();
  const northDst = isNorthernSummer(now) ? 1 : 0;
  const southDst = isSouthernSummer(now) ? 1 : 0;

  // Specific country overrides
  switch (code) {
    case 'IN': // India (UTC+5:30)
      return 5.5;
    case 'IR': // Iran (UTC+3:30)
      return 3.5;
    case 'NP': // Nepal (UTC+5:45)
      return 5.75;
    case 'MM': // Myanmar (UTC+6:30)
      return 6.5;
    case 'LK': // Sri Lanka (UTC+5:30)
      return 5.5;
    case 'AF': // Afghanistan (UTC+4:30)
      return 4.5;
    case 'CN': // China (single timezone UTC+8)
    case 'HK':
    case 'MO':
    case 'TW':
      return 8;
    case 'JP': // Japan (UTC+9)
      return 9;
    case 'KR': // South Korea (UTC+9)
    case 'KP':
      return 9;
    case 'SG': // Singapore (UTC+8)
    case 'MY': // Malaysia (UTC+8)
    case 'PH': // Philippines (UTC+8)
      return 8;
    case 'TH': // Thailand (UTC+7)
    case 'VN': // Vietnam (UTC+7)
    case 'KH': // Cambodia (UTC+7)
    case 'LA': // Laos (UTC+7)
      return 7;
    case 'NZ': // New Zealand (UTC+12, +13 in DST)
      return 12 + southDst;
    case 'GB': // United Kingdom (UTC+0, +1 in BST)
    case 'IE': // Ireland
    case 'PT': // Portugal
    case 'IS': // Iceland (UTC+0 always)
      return code === 'IS' ? 0 : 0 + northDst;
  }

  // Australia
  if (code === 'AU') {
    if (lng < 129) return 8; // Western Australia
    if (lng < 138) return 9.5 + (lat < -26 ? southDst : 0); // Northern Territory / South Australia
    return 10 + (lat < -28 ? southDst : 0); // Eastern (NSW, VIC, TAS have DST; QLD does not)
  }

  // USA & Canada
  if (code === 'US' || code === 'CA') {
    if (lng >= -67) return -4 + northDst; // Atlantic
    if (lng >= -86) return -5 + northDst; // Eastern
    if (lng >= -102) return -6 + northDst; // Central
    if (lng >= -115) return -7 + northDst; // Mountain
    if (lng >= -125) return -8 + northDst; // Pacific
    if (lng >= -168 && lat >= 50) return -9 + northDst; // Alaska
    return -10; // Hawaii
  }

  // Western & Central Europe
  if (
    [
      'FR', 'DE', 'IT', 'ES', 'NL', 'BE', 'CH', 'AT', 'PL', 'CZ',
      'SE', 'NO', 'DK', 'SK', 'HU', 'HR', 'SI', 'BA', 'RS', 'ME', 'AL',
    ].includes(code)
  ) {
    return 1 + northDst; // UTC+1 / UTC+2
  }

  // Eastern Europe
  if (['FI', 'EE', 'LV', 'LT', 'UA', 'RO', 'BG', 'GR', 'CY'].includes(code)) {
    return 2 + northDst; // UTC+2 / UTC+3
  }

  // Turkey (permanent UTC+3)
  if (code === 'TR' || code === 'BY') {
    return 3;
  }

  // Russia (broad longitudinal spread)
  if (code === 'RU') {
    if (lng < 44) return 3; // Moscow UTC+3
    if (lng < 54) return 4; // Samara UTC+4
    if (lng < 68) return 5; // Yekaterinburg UTC+5
    if (lng < 78) return 6; // Omsk UTC+6
    if (lng < 95) return 7; // Krasnoyarsk UTC+7
    if (lng < 110) return 8; // Irkutsk UTC+8
    if (lng < 128) return 9; // Yakutsk UTC+9
    if (lng < 144) return 10; // Vladivostok UTC+10
    if (lng < 162) return 11; // Magadan / Sakhalin UTC+11
    return 12; // Kamchatka UTC+12
  }

  // Brazil
  if (code === 'BR') {
    if (lng >= -45) return -3; // Brasilia / Sao Paulo
    if (lng >= -65) return -4; // Manaus / Amazon
    return -5; // Acre
  }

  // Generic global fallback: round longitude to nearest 15 degrees
  return Math.round(lng / 15);
}

/**
 * Calculates current local time and period for given coordinates & country.
 */
export function calculateCityLocalTime(
  lat: number,
  lng: number,
  countryCode?: string,
  t?: Translations
): CityLocalTimeResult {
  const offsetHours = estimateTimezoneOffsetHours(lat, lng, countryCode);
  const now = new Date();

  // Convert current UTC time to city local time
  const utcMillis = now.getTime() + now.getTimezoneOffset() * 60 * 1000;
  const cityMillis = utcMillis + offsetHours * 3600 * 1000;
  const cityDate = new Date(cityMillis);

  const hour = cityDate.getHours();
  const minute = cityDate.getMinutes();

  const timeString = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

  // Determine period
  let periodKey: TimePeriodKey;
  if (hour >= 5 && hour < 12) {
    periodKey = 'morning';
  } else if (hour >= 12 && hour < 17) {
    periodKey = 'day';
  } else if (hour >= 17 && hour < 23) {
    periodKey = 'evening';
  } else {
    periodKey = 'night';
  }

  const periodLabel = t
    ? t[
        periodKey === 'morning'
          ? 'timeMorning'
          : periodKey === 'day'
          ? 'timeDay'
          : periodKey === 'evening'
          ? 'timeEvening'
          : 'timeNight'
      ]
    : periodKey;

  return {
    timeString,
    periodKey,
    periodLabel,
    formatted: `${timeString} (${periodLabel})`,
    hour,
    minute,
  };
}

/**
 * React hook to get live updating local time for a selected city / station coordinates.
 * Updates automatically every 10 seconds.
 */
export function useCityLocalTime(
  lat?: number,
  lng?: number,
  countryCode?: string
): CityLocalTimeResult | null {
  const { t } = useLanguage();
  const [localTime, setLocalTime] = useState<CityLocalTimeResult | null>(() => {
    if (lat === undefined || lng === undefined) return null;
    return calculateCityLocalTime(lat, lng, countryCode, t);
  });

  useEffect(() => {
    if (lat === undefined || lng === undefined) {
      setLocalTime(null);
      return;
    }

    const update = () => {
      setLocalTime(calculateCityLocalTime(lat, lng, countryCode, t));
    };

    update();
    const timer = setInterval(update, 10000); // 10s refresh
    return () => clearInterval(timer);
  }, [lat, lng, countryCode, t]);

  return localTime;
}
