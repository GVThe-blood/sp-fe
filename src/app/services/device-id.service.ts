import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

// Constants
export const DEVICE_ID_KEY = 'x-device-id';
export const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable({
  providedIn: 'root'
})
export class DeviceIdService {
  private inMemoryDeviceId: string | null = null;
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  /**
   * Lấy Device ID hiện tại, sinh mới nếu chưa có
   * Requirements: 1.1, 1.2
   */
  getDeviceId(): string {
    // Try to get from LocalStorage first
    if (this.isBrowser && this.isLocalStorageAvailable()) {
      try {
        const storedId = localStorage.getItem(DEVICE_ID_KEY);
        
        // If exists and valid, return it (Requirement 1.2)
        if (storedId && UUID_V4_PATTERN.test(storedId)) {
          return storedId;
        }
        
        // Generate new UUID if not exists or invalid (Requirement 1.1, 1.4)
        const newId = this.generateUUID();
        localStorage.setItem(DEVICE_ID_KEY, newId);
        return newId;
      } catch (error) {
        // LocalStorage unavailable, use in-memory (Requirement 1.4)
        console.warn('LocalStorage unavailable, using in-memory Device ID');
        return this.getInMemoryDeviceId();
      }
    }
    
    // Fallback to in-memory for SSR or when LocalStorage is unavailable
    return this.getInMemoryDeviceId();
  }

  /**
   * Kiểm tra Device ID có tồn tại không
   */
  hasDeviceId(): boolean {
    if (this.isBrowser && this.isLocalStorageAvailable()) {
      try {
        const storedId = localStorage.getItem(DEVICE_ID_KEY);
        return storedId !== null && UUID_V4_PATTERN.test(storedId);
      } catch {
        return this.inMemoryDeviceId !== null;
      }
    }
    return this.inMemoryDeviceId !== null;
  }

  /**
   * Sinh UUID v4 mới using crypto API
   * Requirements: 1.3
   * Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
   */
  generateUUID(): string {
    // Use crypto.randomUUID() if available (modern browsers)
    if (this.isBrowser && typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    
    // Fallback implementation for older browsers or SSR
    return this.generateUUIDFallback();
  }

  /**
   * Fallback UUID v4 generation for environments without crypto.randomUUID()
   */
  private generateUUIDFallback(): string {
    // Use crypto.getRandomValues if available
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      
      // Set version (4) and variant (8, 9, a, or b)
      bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
      bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 10xx
      
      const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
    }
    
    // Last resort: Math.random() based (less secure but functional)
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Get or create in-memory Device ID
   */
  private getInMemoryDeviceId(): string {
    if (!this.inMemoryDeviceId) {
      this.inMemoryDeviceId = this.generateUUID();
    }
    return this.inMemoryDeviceId;
  }

  /**
   * Check if LocalStorage is available
   */
  private isLocalStorageAvailable(): boolean {
    try {
      const testKey = '__localStorage_test__';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }
}
