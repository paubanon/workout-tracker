/**
 * Password validation utilities
 * 
 * Shared validation logic for password requirements across auth and settings screens.
 */

export interface PasswordValidation {
    label: string;
    valid: boolean;
}

/**
 * Validates if password contains at least one character matching the regex
 */
export const validateOne = (password: string, regex: RegExp): boolean => regex.test(password);

/**
 * Validates if password length is greater than 8 characters
 */
export const validateLength = (password: string): boolean => password.length > 8;

/**
 * Returns an array of validation rules with their current status
 */
export const getPasswordValidations = (password: string): PasswordValidation[] => [
    { label: '> 8 Characters', valid: validateLength(password) },
    { label: 'Capital Letter', valid: validateOne(password, /[A-Z]/) },
    { label: 'Number', valid: validateOne(password, /[0-9]/) },
    { label: 'Symbol', valid: validateOne(password, /[!@#$%^&*(),.?":{}|<>]/) },
];

/**
 * Returns compact validation labels (for smaller UI contexts)
 */
export const getPasswordValidationsCompact = (password: string): PasswordValidation[] => [
    { label: '> 8 Chars', valid: validateLength(password) },
    { label: 'Caps', valid: validateOne(password, /[A-Z]/) },
    { label: 'Num', valid: validateOne(password, /[0-9]/) },
    { label: 'Sym', valid: validateOne(password, /[!@#$%^&*(),.?":{}|<>]/) },
];

/**
 * Checks if all password validations pass
 */
export const isPasswordValid = (password: string): boolean => {
    return getPasswordValidations(password).every(v => v.valid);
};
