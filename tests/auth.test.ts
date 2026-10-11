import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getSupabaseConfig, assertSupabaseConfig } from '../src/lib/supabase/config';
import { sanitizeRedirectUrl } from '../src/lib/supabase/redirect';
import {
  validateEmail,
  validatePassword,
  validateDisplayName,
  validatePasswordConfirmation,
} from '../src/lib/supabase/validation';

describe('Phase 1 Supabase Authentication Utilities', () => {
  describe('Environment Configuration & Validation', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('detects unconfigured environment when credentials are empty or placeholder', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const config = getSupabaseConfig();
      expect(config.isConfigured).toBe(false);

      expect(() => assertSupabaseConfig()).toThrow(
        /Supabase credentials are not configured/
      );
    });

    it('detects configured environment with valid URL and publishable key', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://valid-project.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'sb-anon-key-12345';

      const config = getSupabaseConfig();
      expect(config.isConfigured).toBe(true);
      expect(config.url).toBe('https://valid-project.supabase.co');
      expect(config.key).toBe('sb-anon-key-12345');

      const asserted = assertSupabaseConfig();
      expect(asserted.url).toBe('https://valid-project.supabase.co');
      expect(asserted.key).toBe('sb-anon-key-12345');
    });

    it('accepts NEXT_PUBLIC_SUPABASE_ANON_KEY as fallback alias', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://valid-project.supabase.co';
      delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb-anon-alias-key-999';

      const config = getSupabaseConfig();
      expect(config.isConfigured).toBe(true);
      expect(config.key).toBe('sb-anon-alias-key-999');
    });
  });

  describe('Redirect URL Sanitization (Open Redirect Protection)', () => {
    it('allows valid internal relative application paths', () => {
      expect(sanitizeRedirectUrl('/learn')).toBe('/learn');
      expect(sanitizeRedirectUrl('/learn/continents/Africa')).toBe('/learn/continents/Africa');
      expect(sanitizeRedirectUrl('/learn/explorer')).toBe('/learn/explorer');
      expect(sanitizeRedirectUrl('/learn/study/Asia/0')).toBe('/learn/study/Asia/0');
    });

    it('falls back to default /learn when input is missing or invalid', () => {
      expect(sanitizeRedirectUrl(null)).toBe('/learn');
      expect(sanitizeRedirectUrl(undefined)).toBe('/learn');
      expect(sanitizeRedirectUrl('')).toBe('/learn');
      expect(sanitizeRedirectUrl('   ')).toBe('/learn');
    });

    it('rejects protocol-relative URLs (e.g. //attacker.com)', () => {
      expect(sanitizeRedirectUrl('//attacker.com')).toBe('/learn');
      expect(sanitizeRedirectUrl('//evil.org/phish')).toBe('/learn');
    });

    it('rejects absolute external URLs and unsafe schemes', () => {
      expect(sanitizeRedirectUrl('https://malicious.com')).toBe('/learn');
      expect(sanitizeRedirectUrl('http://insecure.com')).toBe('/learn');
      expect(sanitizeRedirectUrl('javascript:alert(1)')).toBe('/learn');
      expect(sanitizeRedirectUrl('\\\\evil.com')).toBe('/learn');
    });
  });

  describe('Form Input Validation', () => {
    it('validates email format correctly', () => {
      expect(validateEmail('').isValid).toBe(false);
      expect(validateEmail('not-an-email').isValid).toBe(false);
      expect(validateEmail('user@').isValid).toBe(false);
      expect(validateEmail('@domain.com').isValid).toBe(false);
      expect(validateEmail('user@domain.com').isValid).toBe(true);
      expect(validateEmail('learner+flags@example.co.uk').isValid).toBe(true);
    });

    it('validates password minimum length requirement (>= 6 chars)', () => {
      expect(validatePassword('').isValid).toBe(false);
      expect(validatePassword('12345').isValid).toBe(false);
      expect(validatePassword('123456').isValid).toBe(true);
      expect(validatePassword('secure-strong-pass').isValid).toBe(true);
    });

    it('validates display name bounds (2 - 50 chars)', () => {
      expect(validateDisplayName('').isValid).toBe(false);
      expect(validateDisplayName('A').isValid).toBe(false);
      expect(validateDisplayName('Al').isValid).toBe(true);
      expect(validateDisplayName('Flag Scholar').isValid).toBe(true);
      expect(validateDisplayName('x'.repeat(51)).isValid).toBe(false);
    });

    it('validates password matching confirmation', () => {
      expect(validatePasswordConfirmation('secret123', 'different').isValid).toBe(false);
      expect(validatePasswordConfirmation('secret123', 'secret123').isValid).toBe(true);
    });
  });
});
