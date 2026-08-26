export interface TimezoneOption {
  readonly id: string;
  readonly label: string;
  readonly region: string;
}

/**
 * Canonical WorkPulse timezone registry.
 *
 * IMPORTANT:
 * - `id` must be an IANA timezone identifier.
 * - These IDs are persisted by the application.
 * - Do not use fixed UTC offsets as timezone IDs.
 * - Add new supported timezones here so every application layer
 *   consumes the same registry.
 */
export const TIMEZONES = [
  {
    id: "UTC",
    label: "UTC",
    region: "UTC",
  },

  // Africa
  {
    id: "Africa/Cairo",
    label: "Africa/Cairo",
    region: "Africa",
  },
  {
    id: "Africa/Johannesburg",
    label: "Africa/Johannesburg",
    region: "Africa",
  },
  {
    id: "Africa/Lagos",
    label: "Africa/Lagos",
    region: "Africa",
  },
  {
    id: "Africa/Nairobi",
    label: "Africa/Nairobi",
    region: "Africa",
  },

  // America
  {
    id: "America/Argentina/Buenos_Aires",
    label: "America/Argentina/Buenos_Aires",
    region: "America",
  },
  {
    id: "America/Chicago",
    label: "America/Chicago",
    region: "America",
  },
  {
    id: "America/Denver",
    label: "America/Denver",
    region: "America",
  },
  {
    id: "America/Los_Angeles",
    label: "America/Los_Angeles",
    region: "America",
  },
  {
    id: "America/Mexico_City",
    label: "America/Mexico_City",
    region: "America",
  },
  {
    id: "America/New_York",
    label: "America/New_York",
    region: "America",
  },
  {
    id: "America/Phoenix",
    label: "America/Phoenix",
    region: "America",
  },
  {
    id: "America/Sao_Paulo",
    label: "America/Sao_Paulo",
    region: "America",
  },
  {
    id: "America/Toronto",
    label: "America/Toronto",
    region: "America",
  },
  {
    id: "America/Vancouver",
    label: "America/Vancouver",
    region: "America",
  },

  // Asia
  {
    id: "Asia/Bangkok",
    label: "Asia/Bangkok",
    region: "Asia",
  },
  {
    id: "Asia/Dhaka",
    label: "Asia/Dhaka",
    region: "Asia",
  },
  {
    id: "Asia/Dubai",
    label: "Asia/Dubai",
    region: "Asia",
  },
  {
    id: "Asia/Hong_Kong",
    label: "Asia/Hong_Kong",
    region: "Asia",
  },
  {
    id: "Asia/Jakarta",
    label: "Asia/Jakarta",
    region: "Asia",
  },
  {
    id: "Asia/Kolkata",
    label: "Asia/Kolkata",
    region: "Asia",
  },
  {
    id: "Asia/Manila",
    label: "Asia/Manila",
    region: "Asia",
  },
  {
    id: "Asia/Seoul",
    label: "Asia/Seoul",
    region: "Asia",
  },
  {
    id: "Asia/Shanghai",
    label: "Asia/Shanghai",
    region: "Asia",
  },
  {
    id: "Asia/Singapore",
    label: "Asia/Singapore",
    region: "Asia",
  },
  {
    id: "Asia/Taipei",
    label: "Asia/Taipei",
    region: "Asia",
  },
  {
    id: "Asia/Tokyo",
    label: "Asia/Tokyo",
    region: "Asia",
  },

  // Australia / Pacific
  {
    id: "Australia/Adelaide",
    label: "Australia/Adelaide",
    region: "Australia",
  },
  {
    id: "Australia/Brisbane",
    label: "Australia/Brisbane",
    region: "Australia",
  },
  {
    id: "Australia/Melbourne",
    label: "Australia/Melbourne",
    region: "Australia",
  },
  {
    id: "Australia/Perth",
    label: "Australia/Perth",
    region: "Australia",
  },
  {
    id: "Australia/Sydney",
    label: "Australia/Sydney",
    region: "Australia",
  },
  {
    id: "Pacific/Auckland",
    label: "Pacific/Auckland",
    region: "Pacific",
  },
  {
    id: "Pacific/Honolulu",
    label: "Pacific/Honolulu",
    region: "Pacific",
  },

  // Europe
  {
    id: "Europe/Amsterdam",
    label: "Europe/Amsterdam",
    region: "Europe",
  },
  {
    id: "Europe/Berlin",
    label: "Europe/Berlin",
    region: "Europe",
  },
  {
    id: "Europe/Brussels",
    label: "Europe/Brussels",
    region: "Europe",
  },
  {
    id: "Europe/Dublin",
    label: "Europe/Dublin",
    region: "Europe",
  },
  {
    id: "Europe/Helsinki",
    label: "Europe/Helsinki",
    region: "Europe",
  },
  {
    id: "Europe/Lisbon",
    label: "Europe/Lisbon",
    region: "Europe",
  },
  {
    id: "Europe/London",
    label: "Europe/London",
    region: "Europe",
  },
  {
    id: "Europe/Madrid",
    label: "Europe/Madrid",
    region: "Europe",
  },
  {
    id: "Europe/Paris",
    label: "Europe/Paris",
    region: "Europe",
  },
  {
    id: "Europe/Rome",
    label: "Europe/Rome",
    region: "Europe",
  },
  {
    id: "Europe/Stockholm",
    label: "Europe/Stockholm",
    region: "Europe",
  },
  {
    id: "Europe/Zurich",
    label: "Europe/Zurich",
    region: "Europe",
  },
] as const satisfies readonly TimezoneOption[];

export type TimezoneId = (typeof TIMEZONES)[number]["id"];

const TIMEZONE_SET = new Set<string>(TIMEZONES.map((timezone) => timezone.id));

export function isTimezoneId(value: string): value is TimezoneId {
  return TIMEZONE_SET.has(value);
}

export function getTimezoneOption(
  timezone: string,
): TimezoneOption | undefined {
  return TIMEZONES.find((option) => option.id === timezone);
}

export function getTimezonesByRegion(): Record<string, TimezoneOption[]> {
  return TIMEZONES.reduce<Record<string, TimezoneOption[]>>(
    (groups, timezone) => {
      const existing = groups[timezone.region];

      if (existing) {
        existing.push(timezone);
      } else {
        groups[timezone.region] = [timezone];
      }

      return groups;
    },
    {},
  );
}
