/**
 * Validates URL format and scheme
 * Returns error message if invalid, null if valid
 */
export function validateURL(url) {
  if (typeof url !== 'string' || !url.trim()) {
    return 'Invalid URL format';
  }
  
  let parsedURL;
  try {
    parsedURL = new URL(url.trim());
  } catch {
    return 'Invalid URL format';
  }
  
  // Only allow http and https schemes
  if (parsedURL.protocol !== 'http:' && parsedURL.protocol !== 'https:') {
    return 'Invalid URL scheme';
  }
  
  // Basic validation - must have a hostname
  if (!parsedURL.hostname || parsedURL.hostname.length === 0) {
    return 'Invalid URL hostname';
  }
  
  return null; // Valid URL
}
