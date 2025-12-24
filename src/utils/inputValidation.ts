/**
 * Input Validation Utilities
 * 
 * These functions sanitize and validate numeric inputs for workout tracking.
 * They enforce specific formats while typing to prevent invalid entries.
 */

/**
 * Sanitize input for positive decimals with 1 decimal place max
 * Used for: Load (kg), Weight (personal)
 * @param value - raw input string
 * @returns sanitized string
 */
export const sanitizeDecimal = (value: string): string => {
    // Remove anything that's not a digit or decimal point
    let sanitized = value.replace(/[^0-9.]/g, '');

    // Only allow one decimal point
    const parts = sanitized.split('.');
    if (parts.length > 2) {
        sanitized = parts[0] + '.' + parts.slice(1).join('');
    }

    // Limit to 1 decimal place
    if (parts.length === 2 && parts[1].length > 1) {
        sanitized = parts[0] + '.' + parts[1].charAt(0);
    }

    return sanitized;
};

/**
 * Parse sanitized decimal to number
 * @param value - sanitized string
 * @returns number value (0 if invalid)
 */
export const parseDecimal = (value: string): number => {
    const num = parseFloat(value);
    return isNaN(num) || num < 0 ? 0 : Math.round(num * 10) / 10;
};

/**
 * Sanitize input for positive integers only
 * Used for: Reps, Time (seconds), Distance (meters)
 * @param value - raw input string
 * @returns sanitized string
 */
export const sanitizeInteger = (value: string): string => {
    // Remove anything that's not a digit
    return value.replace(/[^0-9]/g, '');
};

/**
 * Parse sanitized integer to number
 * @param value - sanitized string
 * @returns integer value (0 if invalid)
 */
export const parseInteger = (value: string): number => {
    const num = parseInt(value, 10);
    return isNaN(num) || num < 0 ? 0 : num;
};

/**
 * Sanitize input for decimals that can be negative (1 decimal place max)
 * Used for: ROM (range of motion can be negative for deficit movements)
 * @param value - raw input string
 * @returns sanitized string
 */
export const sanitizeSignedDecimal = (value: string): string => {
    // Allow leading minus sign
    const isNegative = value.startsWith('-');

    // Remove anything that's not a digit or decimal point
    let sanitized = value.replace(/[^0-9.]/g, '');

    // Only allow one decimal point
    const parts = sanitized.split('.');
    if (parts.length > 2) {
        sanitized = parts[0] + '.' + parts.slice(1).join('');
    }

    // Limit to 1 decimal place
    if (parts.length === 2 && parts[1].length > 1) {
        sanitized = parts[0] + '.' + parts[1].charAt(0);
    }

    // Re-add minus sign if it was there
    if (isNegative && sanitized.length > 0) {
        sanitized = '-' + sanitized;
    }

    return sanitized;
};

/**
 * Parse sanitized signed decimal to number
 * @param value - sanitized string
 * @returns number value (0 if empty/invalid)
 */
export const parseSignedDecimal = (value: string): number => {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : Math.round(num * 10) / 10;
};

/**
 * Get keyboard type for different input types
 */
export const getKeyboardType = (fieldType: 'decimal' | 'integer' | 'signedDecimal'): 'numeric' | 'number-pad' | 'decimal-pad' => {
    switch (fieldType) {
        case 'integer':
            return 'number-pad';
        case 'decimal':
        case 'signedDecimal':
            return 'decimal-pad';
        default:
            return 'numeric';
    }
};
