import { describe, it, expect } from 'vitest';
import {
  validateImageFile,
  MAX_FILE_SIZE_BYTES,
  generateThumbnail,
  processAndUploadImage,
} from './imageUpload';

describe('Storage & Photo Upload Validation', () => {
  it('accepts valid JPEG, PNG, and WebP files under 5MB', () => {
    const validJpg = {
      name: 'solar_inverter.jpg',
      type: 'image/jpeg',
      size: 2 * 1024 * 1024, // 2MB
    };
    expect(validateImageFile(validJpg).valid).toBe(true);

    const validPng = {
      name: 'diesel_generator.png',
      type: 'image/png',
      size: 4.8 * 1024 * 1024, // 4.8MB
    };
    expect(validateImageFile(validPng).valid).toBe(true);

    const validWebp = {
      name: 'macbook.webp',
      type: 'image/webp',
      size: 500 * 1024, // 500KB
    };
    expect(validateImageFile(validWebp).valid).toBe(true);
  });

  it('rejects files exceeding 5MB size limit', () => {
    const oversizedFile = {
      name: 'huge_photo.jpg',
      type: 'image/jpeg',
      size: MAX_FILE_SIZE_BYTES + 1024, // 5MB + 1KB
    };
    const res = validateImageFile(oversizedFile);
    expect(res.valid).toBe(false);
    expect(res.error).toMatch(/exceeds the 5MB limit/i);
  });

  it('rejects unsupported file formats like PDF or EXE', () => {
    const pdfFile = {
      name: 'receipt.pdf',
      type: 'application/pdf',
      size: 1024 * 100,
    };
    const res = validateImageFile(pdfFile);
    expect(res.valid).toBe(false);
    expect(res.error).toMatch(/unsupported file format/i);
  });

  it('rejects null or empty file descriptors', () => {
    const res = validateImageFile(null as any);
    expect(res.valid).toBe(false);
    expect(res.error).toMatch(/no file selected/i);
  });

  it('generates a fallback thumbnail in non-browser environment safely', async () => {
    const blob = new Blob(['sample-data'], { type: 'image/jpeg' });
    const thumb = await generateThumbnail(blob, 200);
    expect(typeof thumb).toBe('string');
    expect(thumb.length).toBeGreaterThan(0);
  });

  it('handles offline fallback gracefully when Supabase client is not connected', async () => {
    const file = new File(['image-bytes'], 'test.png', { type: 'image/png' });
    const result = await processAndUploadImage(file);
    expect(result.fileName).toBe('test.png');
    expect(result.thumbnailUrl).toBeDefined();
    expect(result.url).toBeDefined();
  });
});
