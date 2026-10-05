export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

export function validateImageFile(file: {
  size: number;
  type: string;
  name: string;
}): ImageValidationResult {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `File size exceeds the 5MB limit (current: ${sizeMb}MB). Please select a smaller photo.`,
    };
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Unsupported file format (${file.type || 'unknown'}). Please choose a JPG, PNG, or WebP photo.`,
    };
  }

  return { valid: true };
}

export interface UploadResult {
  url: string;
  thumbnailUrl: string;
  fileName: string;
  fileSizeBytes: number;
}

/**
 * Generates a 200x200 client-side thumbnail via HTML Canvas.
 */
export async function generateThumbnail(file: Blob, targetSize = 200): Promise<string> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return 'data:image/jpeg;base64,mockThumbnailData';
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = targetSize;
          canvas.height = targetSize;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }

          // Crop square from center
          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;

          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, targetSize, targetSize);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = () => reject(new Error('Failed to load image for thumbnail processing.'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Handles image processing, local thumbnail generation, and upload to Supabase Storage.
 */
export async function processAndUploadImage(
  file: File,
  supabaseClient?: any,
  folder: string = 'listings'
): Promise<UploadResult> {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const thumbnailUrl = await generateThumbnail(file, 200);

  // If Supabase Storage is configured, attempt upload to 'listing-images' bucket
  if (supabaseClient && supabaseClient.storage) {
    let uploadError = '';
    try {
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${folder}/${Date.now()}_${sanitizedName}`;

      const { data, error } = await supabaseClient.storage
        .from('listing-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) uploadError = error.message;
      if (!error && data?.path) {
        const { data: publicUrlData } = supabaseClient.storage
          .from('listing-images')
          .getPublicUrl(data.path);

        if (publicUrlData?.publicUrl) {
          return {
            url: publicUrlData.publicUrl,
            thumbnailUrl,
            fileName: file.name,
            fileSizeBytes: file.size,
          };
        }
      }
    } catch (err) {
      uploadError = err instanceof Error ? err.message : 'storage unavailable';
    }
    throw new Error(
      `Photo upload failed (${uploadError || 'not allowed'}). Sign in and try again.`
    );
  }

  // Fallback / offline mode returns high-quality thumbnail as image URL
  return {
    url: thumbnailUrl,
    thumbnailUrl,
    fileName: file.name,
    fileSizeBytes: file.size,
  };
}
