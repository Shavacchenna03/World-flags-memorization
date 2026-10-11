/**
 * Safe Redirect URL Sanitization
 *
 * Enforces internal-only navigation paths to prevent Open Redirect vulnerabilities.
 * Disallows protocol-relative URLs (e.g. `//evil.com`), scheme prefixes (`javascript:`, `http:`),
 * and Windows path separator tricks (`\\evil.com`).
 */

export function sanitizeRedirectUrl(
  target: string | null | undefined,
  fallback: string = '/learn'
): string {
  if (!target || typeof target !== 'string') {
    return fallback;
  }

  const trimmed = target.trim();

  // Must begin with single forward slash and never double forward slash
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) {
    return fallback;
  }

  // Reject backslashes and protocol indicators
  if (trimmed.includes('\\') || trimmed.includes(':')) {
    return fallback;
  }

  // Reject control characters or newlines
  if (/[\x00-\x1F\x7F]/.test(trimmed)) {
    return fallback;
  }

  return trimmed;
}
