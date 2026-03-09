import * as fc from 'fast-check';
import { FormBuilder, Validators } from '@angular/forms';
import { EMAIL_PATTERN, LOGIN_VALIDATION_MESSAGES } from './login.component';

/**
 * Property-based tests for Login validation
 * Feature: auth-routing-fixes
 */
describe('Login Validation Properties', () => {
  const fb = new FormBuilder();

  /**
   * Feature: auth-routing-fixes, Property 1: Empty field validation
   * For any form field that is required, if the input value is empty or contains only whitespace,
   * the validation system SHALL return an error.
   * Validates: Requirements 5.1, 5.3
   */
  describe('Property 1: Empty field validation', () => {
    it('should reject empty email', () => {
      fc.assert(
        fc.property(
          fc.constant(''),
          (emptyString: string) => {
            const control = fb.control(emptyString, [Validators.required]);
            expect(control.errors?.['required']).toBeTruthy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject empty password', () => {
      fc.assert(
        fc.property(
          fc.constant(''),
          (emptyString: string) => {
            const control = fb.control(emptyString, [Validators.required, Validators.minLength(6)]);
            expect(control.errors?.['required']).toBeTruthy();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: auth-routing-fixes, Property 2: Email format validation
   * For any string input in an email field, if the string does not match the email regex pattern,
   * the validation system SHALL return an error.
   * Validates: Requirements 5.2
   */
  describe('Property 2: Email format validation', () => {
    it('should reject strings without @ symbol', () => {
      fc.assert(
        fc.property(
          fc.string().filter((s: string) => !s.includes('@') && s.length > 0),
          (invalidEmail: string) => {
            const control = fb.control(invalidEmail, [Validators.pattern(EMAIL_PATTERN)]);
            expect(control.errors?.['pattern']).toBeTruthy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject strings without domain', () => {
      fc.assert(
        fc.property(
          fc.string().map((s: string) => s.replace(/[.]/g, '') + '@'),
          (invalidEmail: string) => {
            const control = fb.control(invalidEmail, [Validators.pattern(EMAIL_PATTERN)]);
            expect(control.errors?.['pattern']).toBeTruthy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept valid email formats', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            fc.string({ minLength: 1, maxLength: 10 }).filter((s: string) => /^[a-z0-9]+$/.test(s)),
            fc.string({ minLength: 1, maxLength: 10 }).filter((s: string) => /^[a-z]+$/.test(s)),
            fc.constantFrom('com', 'org', 'net', 'vn', 'edu')
          ),
          ([localPart, domain, tld]: [string, string, string]) => {
            const validEmail = `${localPart}@${domain}.${tld}`;
            const control = fb.control(validEmail, [Validators.pattern(EMAIL_PATTERN)]);
            expect(control.errors).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: auth-routing-fixes, Property 3: Minimum length validation
   * For any string input in a field with minimum length requirement,
   * if the string length is less than the required minimum, the validation system SHALL return an error.
   * Validates: Requirements 5.4
   */
  describe('Property 3: Minimum length validation', () => {
    it('should reject passwords shorter than 6 characters', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 5 }),
          (shortPassword: string) => {
            const control = fb.control(shortPassword, [Validators.minLength(6)]);
            expect(control.errors?.['minlength']).toBeTruthy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept passwords with 6 or more characters', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 6, maxLength: 50 }),
          (validPassword: string) => {
            const control = fb.control(validPassword, [Validators.minLength(6)]);
            expect(control.errors).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: auth-routing-fixes, Property 6: Valid form enables submission
   * For any form where all fields pass their respective validations,
   * the form SHALL be marked as valid.
   * Validates: Requirements 5.5
   */
  describe('Property 6: Valid form enables submission', () => {
    it('should mark form as valid when all fields are valid', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            fc.string({ minLength: 1, maxLength: 10 }).filter((s: string) => /^[a-z0-9]+$/.test(s)),
            fc.string({ minLength: 1, maxLength: 10 }).filter((s: string) => /^[a-z]+$/.test(s)),
            fc.constantFrom('com', 'org', 'net'),
            fc.string({ minLength: 6, maxLength: 20 })
          ),
          ([localPart, domain, tld, password]: [string, string, string, string]) => {
            const validEmail = `${localPart}@${domain}.${tld}`;
            const form = fb.group({
              email: [validEmail, [Validators.required, Validators.pattern(EMAIL_PATTERN)]],
              password: [password, [Validators.required, Validators.minLength(6)]]
            });
            expect(form.valid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should mark form as invalid when any field is invalid', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            fc.string().filter((s: string) => !EMAIL_PATTERN.test(s)),
            fc.string({ minLength: 6, maxLength: 20 })
          ),
          ([invalidEmail, password]: [string, string]) => {
            const form = fb.group({
              email: [invalidEmail, [Validators.required, Validators.pattern(EMAIL_PATTERN)]],
              password: [password, [Validators.required, Validators.minLength(6)]]
            });
            expect(form.valid).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
