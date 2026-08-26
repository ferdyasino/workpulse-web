import { TIMEZONES, type TimezoneId } from "@workpulse/shared";

export { TIMEZONES };

export const TIMEZONE_OPTIONS = TIMEZONES;

export type { TimezoneId };

export const LOCALE_OPTIONS = ["en-US", "en-GB", "fil-PH"] as const;

export type Locale = (typeof LOCALE_OPTIONS)[number];

export const CURRENCY_OPTIONS = ["USD", "PHP", "EUR", "GBP", "JPY"] as const;

export type Currency = (typeof CURRENCY_OPTIONS)[number];
