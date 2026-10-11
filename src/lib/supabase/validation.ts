/**
 * Authentication Form Input Validation
 *
 * Enforces email syntax, password strength, and non-empty display name constraints.
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateEmail(email: string): ValidationResult {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: 'Email address is required.' };
  }

  const trimmed = email.trim();
  // Standard RFC-compliant basic email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, error: 'Please enter a valid email address.' };
  }

  return { isValid: true };
}

export function validatePassword(password: string): ValidationResult {
  if (!password || typeof password !== 'string') {
    return { isValid: false, error: 'Password is required.' };
  }

  if (password.length < 6) {
    return { isValid: false, error: 'Password must be at least 6 characters long.' };
  }

  return { isValid: true };
}

export function validateDisplayName(name: string): ValidationResult {
  if (!name || typeof name !== 'string') {
    return { isValid: false, error: 'Display name is required.' };
  }

  const trimmed = name.trim();
  if (trimmed.length < 2) {
    return { isValid: false, error: 'Display name must be at least 2 characters.' };
  }

  if (trimmed.length > 50) {
    return { isValid: false, error: 'Display name cannot exceed 50 characters.' };
  }

  return { isValid: true };
}

export function validatePasswordConfirmation(
  password: string,
  confirm: string
): ValidationResult {
  if (password !== confirm) {
    return { isValid: false, error: 'Passwords do not match.' };
  }

  return { isValid: true };
}
