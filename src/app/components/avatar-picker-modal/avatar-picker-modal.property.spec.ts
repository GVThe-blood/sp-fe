import * as fc from 'fast-check';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AvatarPickerModalComponent } from './avatar-picker-modal.component';

/**
 * Property-based tests for AvatarPickerModalComponent
 * Feature: profile-mystore-enhancements
 */
describe('AvatarPickerModalComponent Property Tests', () => {
  let component: AvatarPickerModalComponent;
  let fixture: ComponentFixture<AvatarPickerModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AvatarPickerModalComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(AvatarPickerModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  /**
   * **Feature: profile-mystore-enhancements, Property 5: Avatar File Type Validation**
   * 
   * For any uploaded file, the Avatar_Picker SHALL accept the file if and only if 
   * its MIME type is in ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'].
   * 
   * **Validates: Requirements 4.4**
   */
  describe('Property 5: Avatar File Type Validation', () => {
    const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const DISALLOWED_TYPES = [
      'image/bmp',
      'image/svg+xml',
      'image/tiff',
      'image/x-icon',
      'application/pdf',
      'text/plain',
      'video/mp4',
      'audio/mpeg',
      'application/json',
      'text/html',
      'application/zip'
    ];

    // Arbitrary for file name
    const fileNameArbitrary = fc.string({ minLength: 1, maxLength: 50 })
      .map(name => name.replace(/[^a-zA-Z0-9_-]/g, '_'));

    // Arbitrary for allowed MIME types
    const allowedMimeTypeArbitrary = fc.constantFrom(...ALLOWED_TYPES);

    // Arbitrary for disallowed MIME types
    const disallowedMimeTypeArbitrary = fc.constantFrom(...DISALLOWED_TYPES);

    // Helper to create a mock File object
    function createMockFile(name: string, type: string): File {
      const blob = new Blob(['mock file content'], { type });
      return new File([blob], name, { type });
    }

    // Helper to create a mock FileList
    function createMockFileList(file: File): FileList {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      return dataTransfer.files;
    }

    // Helper to simulate file selection
    function simulateFileSelection(component: AvatarPickerModalComponent, file: File): void {
      const mockEvent = {
        target: {
          files: createMockFileList(file),
          value: ''
        }
      } as unknown as Event;

      component.onFileSelect(mockEvent);
    }

    it('should accept all files with allowed MIME types', () => {
      fc.assert(
        fc.property(
          fileNameArbitrary,
          allowedMimeTypeArbitrary,
          (fileName: string, mimeType: string) => {
            // Reset component state
            component.fileError = '';
            component.uploadedFile = null;
            component.uploadedPreview = null;

            // Create a file with allowed MIME type
            const file = createMockFile(fileName, mimeType);

            // Simulate file selection
            simulateFileSelection(component, file);

            // Property: File should be accepted (no error, file is set)
            expect(component.fileError).toBe('');
            expect(component.uploadedFile).toBeTruthy();
            expect(component.uploadedFile!.type).toBe(mimeType);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject all files with disallowed MIME types', () => {
      fc.assert(
        fc.property(
          fileNameArbitrary,
          disallowedMimeTypeArbitrary,
          (fileName: string, mimeType: string) => {
            // Reset component state
            component.fileError = '';
            component.uploadedFile = null;
            component.uploadedPreview = null;

            // Create a file with disallowed MIME type
            const file = createMockFile(fileName, mimeType);

            // Simulate file selection
            simulateFileSelection(component, file);

            // Property: File should be rejected (error is set, file is null)
            expect(component.fileError).toBeTruthy();
            expect(component.fileError).toContain('Chỉ chấp nhận file ảnh định dạng');
            expect(component.uploadedFile).toBeNull();
            expect(component.uploadedPreview).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept if and only if MIME type is in allowed list', () => {
      fc.assert(
        fc.property(
          fileNameArbitrary,
          fc.constantFrom(...ALLOWED_TYPES, ...DISALLOWED_TYPES),
          (fileName: string, mimeType: string) => {
            // Reset component state
            component.fileError = '';
            component.uploadedFile = null;
            component.uploadedPreview = null;

            // Create a file
            const file = createMockFile(fileName, mimeType);

            // Simulate file selection
            simulateFileSelection(component, file);

            const isAllowed = ALLOWED_TYPES.includes(mimeType);

            // Property: File acceptance should match whether type is allowed
            if (isAllowed) {
              expect(component.fileError).toBe('');
              expect(component.uploadedFile).toBeTruthy();
            } else {
              expect(component.fileError).toBeTruthy();
              expect(component.uploadedFile).toBeNull();
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should clear previous errors when selecting a valid file after an invalid one', () => {
      fc.assert(
        fc.property(
          fileNameArbitrary,
          disallowedMimeTypeArbitrary,
          fileNameArbitrary,
          allowedMimeTypeArbitrary,
          (invalidFileName: string, invalidType: string, validFileName: string, validType: string) => {
            // Reset component state
            component.fileError = '';
            component.uploadedFile = null;
            component.uploadedPreview = null;

            // First, select an invalid file
            const invalidFile = createMockFile(invalidFileName, invalidType);
            simulateFileSelection(component, invalidFile);

            // Verify error is set
            expect(component.fileError).toBeTruthy();
            expect(component.uploadedFile).toBeNull();

            // Then, select a valid file
            const validFile = createMockFile(validFileName, validType);
            simulateFileSelection(component, validFile);

            // Property: Error should be cleared and file should be accepted
            expect(component.fileError).toBe('');
            expect(component.uploadedFile).toBeTruthy();
            expect(component.uploadedFile!.type).toBe(validType);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain error state when selecting another invalid file', () => {
      fc.assert(
        fc.property(
          fileNameArbitrary,
          disallowedMimeTypeArbitrary,
          fileNameArbitrary,
          disallowedMimeTypeArbitrary,
          (fileName1: string, type1: string, fileName2: string, type2: string) => {
            // Reset component state
            component.fileError = '';
            component.uploadedFile = null;
            component.uploadedPreview = null;

            // Select first invalid file
            const file1 = createMockFile(fileName1, type1);
            simulateFileSelection(component, file1);

            // Verify error is set
            expect(component.fileError).toBeTruthy();

            // Select second invalid file
            const file2 = createMockFile(fileName2, type2);
            simulateFileSelection(component, file2);

            // Property: Error should still be set and file should be null
            expect(component.fileError).toBeTruthy();
            expect(component.uploadedFile).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle edge case of empty file type', () => {
      // Reset component state
      component.fileError = '';
      component.uploadedFile = null;
      component.uploadedPreview = null;

      // Create a file with empty MIME type
      const file = createMockFile('test.txt', '');

      // Simulate file selection
      simulateFileSelection(component, file);

      // Property: Empty MIME type should be rejected
      expect(component.fileError).toBeTruthy();
      expect(component.uploadedFile).toBeNull();
    });

    // Note: Case sensitivity test removed because browsers automatically normalize
    // MIME types to lowercase. When creating a File with type 'IMAGE/JPEG', the browser
    // converts it to 'image/jpeg' before our validation code sees it. This is standard
    // browser behavior and not something we can or should test.
  });
});
