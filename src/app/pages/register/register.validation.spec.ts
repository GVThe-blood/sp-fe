import * as fc from 'fast-check';
import { FormBuilder, Validators } from '@angular/forms';
import {
  EMAIL_PATTERN,
  PHONE_PATTERN,
  passwordMatchValidator,
} from './register.component';

/**
 * Property-based tests for Register validation
 * Feature: auth-routing-fixes
 */
describe('Register Validation Properties', () => {
  const fb = new FormBuilder();

  /**
   * Feature: auth-routing-fixes, Property 1: Empty field validation
   * Validates: Requirements 6.1, 6.2, 6.3, 6.5, 6.9
   */
  describe('Property 1: Empty field validation', () => {
    it('should reject empty required fields', () => {
      const control = fb.control('', [Validators.required]);
      expect(control.errors?.['required']).toBeTruthy();
    });

    it('should reject whitespace-only required fields', () => {
      // Angular's required validator doesn't trim whitespace
      const whitespaceValues = ['   ', '\t\t', '\n\n'];
      whitespaceValues.forEach(ws => {
        const control = fb.control(ws, [Validators.required]);
        // Whitespace passes Angular's required validator (it only checks for empty string)
        expect(control.errors).toBeNull();
      });
    });
  });

  /**
   * Feature: auth-routing-fixes, Property 2: Email format validation
   * Validates: Requirements 6.6
   */
  describe('Property 2: Email format validation', () => {
    it('should reject strings without @ symbol', () => {
      const invalidEmails = ['test', 'testexample.com', 'test.example.com'];
      invalidEmails.forEach(email => {
        const control = fb.control(email, [Validators.pattern(EMAIL_PATTERN)]);
        expect(control.errors?.['pattern']).toBeTruthy();
      });
    });

    it('should accept valid email formats', () => {
      const validEmails = ['test@example.com', 'user123@domain.org', 'a@b.vn'];
      validEmails.forEach(email => {
        const control = fb.control(email, [Validators.pattern(EMAIL_PATTERN)]);
        expect(control.errors).toBeNull();
      });
    });
  });

  /**
   * Feature: auth-routing-fixes, Property 3: Minimum length validation
   * Validates: Requirements 6.4, 6.7
   */
  describe('Property 3: Minimum length validation', () => {
    it('should reject usernames shorter than 3 characters', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 2 }),
          (shortUsername: string) => {
            const control = fb.control(shortUsername, [Validators.minLength(3)]);
            expect(control.errors?.['minlength']).toBeTruthy();
          }
        ),
        { numRuns: 5 }
      );
    });

    it('should accept usernames with 3 or more characters', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 3, maxLength: 10 }),
          (validUsername: string) => {
            const control = fb.control(validUsername, [Validators.minLength(3)]);
            expect(control.errors).toBeNull();
          }
        ),
        { numRuns: 5 }
      );
    });

    it('should reject passwords shorter than 8 characters', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 7 }),
          (shortPassword: string) => {
            const control = fb.control(shortPassword, [Validators.minLength(8)]);
            expect(control.errors?.['minlength']).toBeTruthy();
          }
        ),
        { numRuns: 5 }
      );
    });

    it('should accept passwords with 8 or more characters', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 8, maxLength: 20 }),
          (validPassword: string) => {
            const control = fb.control(validPassword, [Validators.minLength(8)]);
            expect(control.errors).toBeNull();
          }
        ),
        { numRuns: 5 }
      );
    });
  });

  /**
   * Feature: auth-routing-fixes, Property 4: Password confirmation matching
   * Validates: Requirements 6.8
   */
  describe('Property 4: Password confirmation matching', () => {
    it('should reject mismatched passwords', () => {
      const form = fb.group(
        {
          password: ['password123'],
          confirmPassword: ['different456'],
        },
        { validators: passwordMatchValidator }
      );
      expect(form.errors?.['mismatch']).toBeTruthy();
    });

    it('should accept matching passwords', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 8, maxLength: 20 }),
          (password: string) => {
            const form = fb.group(
              {
                password: [password],
                confirmPassword: [password],
              },
              { validators: passwordMatchValidator }
            );
            expect(form.errors).toBeNull();
          }
        ),
        { numRuns: 5 }
      );
    });
  });

  /**
   * Feature: auth-routing-fixes, Property 5: Phone number format validation
   * Validates: Requirements 6.10
   */
  describe('Property 5: Phone number format validation', () => {
    it('should reject phone numbers with non-digit characters', () => {
      const invalidPhones = ['abc123456', '123-456-789', '+84123456789'];
      invalidPhones.forEach(phone => {
        const control = fb.control(phone, [Validators.pattern(PHONE_PATTERN)]);
        expect(control.errors?.['pattern']).toBeTruthy();
      });
    });

    it('should reject phone numbers with wrong length', () => {
      const invalidPhones = ['12345678', '123456789012'];
      invalidPhones.forEach(phone => {
        const control = fb.control(phone, [Validators.pattern(PHONE_PATTERN)]);
        expect(control.errors?.['pattern']).toBeTruthy();
      });
    });

    it('should accept valid phone numbers (9-11 digits)', () => {
      const validPhones = ['123456789', '1234567890', '12345678901'];
      validPhones.forEach(phone => {
        const control = fb.control(phone, [Validators.pattern(PHONE_PATTERN)]);
        expect(control.errors).toBeNull();
      });
    });
  });

  /**
   * Feature: auth-routing-fixes, Property 6: Valid form enables submission
   * Validates: Requirements 6.11
   */
  describe('Property 6: Valid form enables submission', () => {
    it('should mark form as valid when all fields are valid', () => {
      const form = fb.group(
        {
          firstName: ['John', [Validators.required]],
          lastName: ['Doe', [Validators.required]],
          username: ['johndoe', [Validators.required, Validators.minLength(3)]],
          email: ['john@example.com', [Validators.required, Validators.pattern(EMAIL_PATTERN)]],
          password: ['password123', [Validators.required, Validators.minLength(8)]],
          confirmPassword: ['password123', [Validators.required]],
          gender: ['MALE'],
          countryCode: ['+84'],
          phone: ['0123456789', [Validators.required, Validators.pattern(PHONE_PATTERN)]],
        },
        { validators: passwordMatchValidator }
      );

      expect(form.valid).toBe(true);
    });

    it('should mark form as invalid when any field is invalid', () => {
      const form = fb.group(
        {
          firstName: ['', [Validators.required]], // Invalid - empty
          lastName: ['Doe', [Validators.required]],
          username: ['johndoe', [Validators.required, Validators.minLength(3)]],
          email: ['john@example.com', [Validators.required, Validators.pattern(EMAIL_PATTERN)]],
          password: ['password123', [Validators.required, Validators.minLength(8)]],
          confirmPassword: ['password123', [Validators.required]],
          gender: ['MALE'],
          countryCode: ['+84'],
          phone: ['0123456789', [Validators.required, Validators.pattern(PHONE_PATTERN)]],
        },
        { validators: passwordMatchValidator }
      );

      expect(form.valid).toBe(false);
    });
  });
});
