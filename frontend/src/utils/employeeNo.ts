/**
 * Employee Number Utilities
 *
 * These utilities handle Employee No. formatting and validation.
 *
 * IMPORTANT:
 * - These functions do NOT determine the next available Employee No.
 * - The backend/database must allocate the sequence number.
 * - The prefix, padding, and separator are configurable by workspace ADMINs.
 */

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type EmployeeNumberFormat = {
  prefix?: string;
  padding?: number;
  separator?: string;
};

/* -------------------------------------------------------------------------- */
/* Defaults                                                                    */
/* -------------------------------------------------------------------------- */

export const DEFAULT_EMPLOYEE_NUMBER_FORMAT: Required<EmployeeNumberFormat> = {
  prefix: "EMP",
  padding: 6,
  separator: "-",
};

/* -------------------------------------------------------------------------- */
/* Normalization                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Normalize Employee No. format settings.
 *
 * This prevents invalid configuration values from reaching the formatter.
 */
export function normalizeEmployeeNumberFormat(
  format?: EmployeeNumberFormat | null,
): Required<EmployeeNumberFormat> {
  const prefix = normalizeEmployeeNumberPrefix(format?.prefix);

  const padding = normalizeEmployeeNumberPadding(format?.padding);

  const separator =
    format?.separator !== undefined
      ? normalizeEmployeeNumberSeparator(format.separator)
      : DEFAULT_EMPLOYEE_NUMBER_FORMAT.separator;

  return {
    prefix,
    padding,
    separator,
  };
}

/**
 * Normalize the configured prefix.
 *
 * Examples:
 *   "EMP"       → "EMP"
 *   " emp "     → "EMP"
 *   "EMP-"      → "EMP"
 *   ""          → ""
 */
export function normalizeEmployeeNumberPrefix(prefix?: string | null): string {
  if (!prefix) {
    return "";
  }

  return prefix
    .trim()
    .replace(/[\s]+/g, "")
    .replace(/[-_]+$/g, "")
    .toUpperCase();
}

/**
 * Normalize the configured separator.
 *
 * We intentionally keep this limited so Employee No. values remain
 * predictable and readable.
 */
export function normalizeEmployeeNumberSeparator(separator?: string | null): string {
  if (!separator) {
    return "";
  }

  return separator.trim().slice(0, 1);
}

/**
 * Normalize padding.
 *
 * Supported range:
 *   1 → 12
 */
export function normalizeEmployeeNumberPadding(padding?: number | null): number {
  if (padding === undefined || padding === null || !Number.isFinite(padding)) {
    return DEFAULT_EMPLOYEE_NUMBER_FORMAT.padding;
  }

  return Math.min(12, Math.max(1, Math.floor(padding)));
}

/* -------------------------------------------------------------------------- */
/* Formatting                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Format a numeric sequence into an Employee No.
 *
 * Examples:
 *
 * formatEmployeeNumber(1)
 * → "EMP-000001"
 *
 * formatEmployeeNumber(25, { prefix: "HR", padding: 4 })
 * → "HR-0025"
 *
 * formatEmployeeNumber(25, {
 *   prefix: "STAFF",
 *   padding: 3,
 *   separator: "_",
 * })
 * → "STAFF_025"
 */
export function formatEmployeeNumber(
  sequence: number,
  format?: EmployeeNumberFormat | null,
): string {
  if (!Number.isInteger(sequence) || sequence < 0) {
    throw new Error("Employee number sequence must be a non-negative integer.");
  }

  const normalized = normalizeEmployeeNumberFormat(format);

  const sequenceText = String(sequence).padStart(normalized.padding, "0");

  if (!normalized.prefix) {
    return sequenceText;
  }

  return `${normalized.prefix}${normalized.separator}${sequenceText}`;
}

/* -------------------------------------------------------------------------- */
/* Parsing                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Extract the numeric sequence from an automatically generated Employee No.
 *
 * Examples:
 *
 * parseEmployeeNumber("EMP-000123")
 * → 123
 *
 * parseEmployeeNumber("HR-0012", { prefix: "HR", padding: 4 })
 * → 12
 *
 * Returns null when the value does not match the configured format.
 */
export function parseEmployeeNumber(
  employeeNumber: string,
  format?: EmployeeNumberFormat | null,
): number | null {
  if (!employeeNumber.trim()) {
    return null;
  }

  const normalized = normalizeEmployeeNumberFormat(format);

  const prefix = normalized.prefix
    ? `${escapeRegExp(normalized.prefix)}${escapeRegExp(normalized.separator)}`
    : "";

  const pattern = new RegExp(`^${prefix}(\\d+)$`, "i");

  const match = employeeNumber.trim().match(pattern);

  if (!match) {
    return null;
  }

  const sequence = Number(match[1]);

  return Number.isSafeInteger(sequence) ? sequence : null;
}

/* -------------------------------------------------------------------------- */
/* Validation                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Validate a manually entered Employee No.
 *
 * Custom Employee Nos. are allowed by design.
 *
 * Therefore this function validates the value itself, rather than requiring
 * it to match the configured automatic-generation format.
 */
export function validateEmployeeNumber(employeeNumber: string): {
  valid: boolean;
  value: string;
  error?: string;
} {
  const value = employeeNumber.trim();

  if (!value) {
    return {
      valid: true,
      value: "",
    };
  }

  if (value.length > 50) {
    return {
      valid: false,
      value,
      error: "Employee No. must not exceed 50 characters.",
    };
  }

  /*
   * Allow:
   *   EMP-000001
   *   HR-001
   *   FIN-2026-001
   *   STAFF_A001
   *   CDO001
   *
   * Disallow whitespace and characters that are problematic for identifiers.
   */
  if (!/^[A-Z0-9][A-Z0-9._/-]*$/i.test(value)) {
    return {
      valid: false,
      value,
      error:
        "Employee No. may contain only letters, numbers, hyphens, underscores, periods, and slashes.",
    };
  }

  return {
    valid: true,
    value: value.toUpperCase(),
  };
}

/**
 * Normalize a manually entered Employee No.
 *
 * This does NOT generate anything.
 */
export function normalizeEmployeeNumber(employeeNumber?: string | null): string {
  return employeeNumber?.trim().toUpperCase() ?? "";
}

/* -------------------------------------------------------------------------- */
/* Comparison                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Compare Employee Nos. consistently.
 *
 * Useful when checking values on the frontend before sending them to the
 * backend.
 */
export function employeeNumbersEqual(first?: string | null, second?: string | null): boolean {
  return normalizeEmployeeNumber(first) === normalizeEmployeeNumber(second);
}

/* -------------------------------------------------------------------------- */
/* Display Helpers                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Return a preview of what the next generated Employee No. would look like.
 *
 * IMPORTANT:
 * This is ONLY a preview.
 *
 * It does NOT reserve or allocate the number.
 */
export function previewEmployeeNumber(
  sequence: number,
  format?: EmployeeNumberFormat | null,
): string {
  return formatEmployeeNumber(sequence, format);
}

/**
 * Check whether an Employee No. looks like an automatically generated number
 * for the supplied workspace format.
 */
export function isGeneratedEmployeeNumber(
  employeeNumber: string,
  format?: EmployeeNumberFormat | null,
): boolean {
  return parseEmployeeNumber(employeeNumber, format) !== null;
}

/* -------------------------------------------------------------------------- */
/* Internal Helpers                                                            */
/* -------------------------------------------------------------------------- */

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
