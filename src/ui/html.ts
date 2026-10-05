/** Helpers for building HTML strings from member-supplied data. */

export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80';

/**
 * Returns the URL only if it is a plain web or inline image address; anything
 * else (script URLs, markup smuggled into the value) becomes the fallback.
 */
export function safeImageUrl(url: string | null | undefined, fallback = FALLBACK_IMAGE): string {
  const value = (url || '').trim();
  if (/^https?:\/\/[^\s"'<>]+$/i.test(value)) return value;
  if (/^data:image\/(png|jpe?g|webp);base64,[a-z0-9+/=]+$/i.test(value)) return value;
  return fallback;
}
