/**
 * Input sanitization and XSS defense utilities
 */

/**
 * Strips dangerous HTML tags, inline event handlers, and javascript: protocols.
 * Also enforces an optional maximum string length.
 */
export function sanitizeText(input: string, maxLength?: number): string {
  if (typeof input !== "string") {
    return "";
  }

  let sanitized = input
    // Remove script tags and contents
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    // Remove iframe, object, embed tags
    .replace(/<\/?(?:iframe|object|embed|applet|meta|link)[^>]*>/gi, "")
    // Remove inline event handlers (e.g. onload=, onclick=, onerror=)
    .replace(/\bon\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, "")
    // Remove javascript: and data: URIs in tags
    .replace(/(?:href|src)\s*=\s*(?:'javascript:[^']*'|"javascript:[^"]*"|javascript:[^\s>]+)/gi, "")
    // Strip HTML opening/closing tags from plain text user entries
    .replace(/<[^>]*>/g, "")
    .trim();

  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength).trim();
  }

  return sanitized;
}

/**
 * Encodes special characters to HTML entities.
 */
export function escapeHtml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
