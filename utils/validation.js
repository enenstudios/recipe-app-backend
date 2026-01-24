/**
 * Normalizes URL input: ensure string, trim, remove invisible/zero-width chars,
 * strip trailing punctuation sometimes picked up when pasting.
 */
function normalizeURLInput(input) {
  if (input == null) return '';
  let s = String(input).trim();
  // Remove zero-width and other invisible characters that break parsing
  s = s.replace(/[\u200B-\u200D\uFEFF\u00AD]/g, '');
  // Trim again after stripping
  s = s.trim();
  // Remove trailing punctuation often pasted with the URL (period, comma, etc.)
  s = s.replace(/[.,;:!?\s]+$/, '').trim();
  return s;
}

/**
 * Validates URL format and scheme.
 * Returns error message if invalid, null if valid.
 * Uses normalized input to handle paste artifacts (invisible chars, trailing punctuation).
 */
export function validateURL(url) {
  const normalized = normalizeURLInput(url);
  if (!normalized) {
    return 'Invalid URL format';
  }

  let parsedURL;
  try {
    parsedURL = new URL(normalized);
  } catch {
    return 'Invalid URL format';
  }

  if (parsedURL.protocol !== 'http:' && parsedURL.protocol !== 'https:') {
    return 'Invalid URL scheme';
  }

  if (!parsedURL.hostname || parsedURL.hostname.length === 0) {
    return 'Invalid URL hostname';
  }

  return null;
}

/**
 * Returns a normalized URL string suitable for scraping, or null if empty after normalize.
 */
export function normalizeURLForExtract(url) {
  const s = normalizeURLInput(url);
  return s || null;
}
