/**
 * Content moderation utility for detecting abusive language, profanity,
 * slurs, harassment, and spam in resident reviews and community content.
 */

// Comprehensive regex patterns for abusive words, harassment, profanity, and vulgarities
// Using word boundaries to avoid false positives on words like "classic", "pass", "basement", "assure", etc.
const ABUSIVE_PATTERNS: RegExp[] = [
  // Profanity & vulgar English terms
  /\b(f+u+c+k+|f+u+k+|f+u+c+k+i+n+g+|f+u+c+k+e+r+|motherf+u+c+k+e+r+)\b/i,
  /\b(s+h+i+t+|s+h+i+t+t+y+|b+u+l+l+s+h+i+t+)\b/i,
  /\b(b+i+t+c+h+|b+i+t+c+h+e+s+|b+i+t+c+h+i+n+g+)\b/i,
  /\b(b+a+s+t+a+r+d+|b+a+s+t+a+r+d+s+)\b/i,
  /\b(a+s+s+h+o+l+e+|a+s+s+h+o+l+e+s+)\b/i,
  /\b(d+i+c+k+|d+i+c+k+h+e+a+d+)\b/i,
  /\b(p+u+s+s+y+|w+h+o+r+e+|s+l+u+t+)\b/i,
  /\b(c+u+n+t+|c+u+n+t+s+)\b/i,

  // Common Hindi / Hinglish abusive & offensive words
  /\b(b+c+|m+c+|b+h+e+n+c+h+o+d+|m+a+d+a+r+c+h+o+d+|m+a+a+d+a+r+c+h+o+d+)\b/i,
  /\b(c+h+u+t+i+y+a+|c+h+u+t+i+y+e+|c+h+u+t+i+y+a+p+a+)\b/i,
  /\b(g+a+n+d+u+|g+a+a+n+d+u+|g+a+n+d+|g+a+a+n+d+)\b/i,
  /\b(h+a+r+a+m+i+|h+a+r+a+a+m+i+|h+a+r+a+m+k+h+o+r+)\b/i,
  /\b(k+u+t+t+a+|k+u+t+t+e+|k+u+t+t+i+|k+a+m+i+n+a+|k+a+m+i+n+e+)\b/i,
  /\b(b+h+a+d+w+a+|b+h+a+d+v+e+|r+a+n+d+i+|r+a+n+d+w+a+)\b/i,
  /\b(l+a+u+d+a+|l+o+u+d+a+|l+a+n+d+|l+o+d+u+)\b/i,
  /\b(b+h+o+s+d+i+k+e+|b+h+o+s+a+d+i+k+e+|b+h+o+s+d+i+|b+s+d+k+)\b/i,
  /\b(s+a+a+l+a+|s+a+a+l+e+|s+a+l+a+|s+a+l+e+)\s+(k+u+t+t+e+|c+h+u+t+i+y+e+|k+a+m+i+n+e+)\b/i,

  // Severe threats & harassment
  /\b(i\s*will\s*(kill|murder|beat|destroy|harm)\s*you)\b/i,
  /\b(gonna\s*kill\s*you|die\s*in\s*hell|burn\s*in\s*hell)\b/i,
];

export interface ModerationResult {
  isClean: boolean;
  reason?: string;
  isSpam?: boolean;
}

/**
 * Checks text content (such as review title and comments) for profanity,
 * abusive remarks, harassment, and spam patterns.
 */
export function checkProfanityAndAbuse(
  text: string,
  options?: { allowLinks?: boolean; allowPhones?: boolean }
): ModerationResult {
  if (!text || !text.trim()) {
    return { isClean: true };
  }

  const normalized = text
    .toLowerCase()
    .replace(/[@#$*!%]/g, (char) => {
      // Map leetspeak characters to approximate vowels/consonants
      switch (char) {
        case "@":
          return "a";
        case "$":
          return "s";
        case "!":
          return "i";
        case "0":
          return "o";
        case "1":
          return "i";
        default:
          return "";
      }
    });

  // Check for abusive patterns
  for (const pattern of ABUSIVE_PATTERNS) {
    if (pattern.test(normalized) || pattern.test(text)) {
      return {
        isClean: false,
        reason:
          "Your review contains abusive, offensive, or inappropriate language. Please keep your feedback respectful and constructive.",
      };
    }
  }

  // Check for spam patterns (unauthorized external links or phone spam)
  if (!options?.allowLinks && /https?:\/\/|www\./i.test(text)) {
    return {
      isClean: false,
      isSpam: true,
      reason:
        "External website links are not permitted in property reviews.",
    };
  }

  if (!options?.allowPhones && /\b(\+?91[\s-]?)?[6-9]\d{9}\b/.test(text)) {
    return {
      isClean: false,
      isSpam: true,
      reason:
        "Personal phone numbers cannot be posted inside public reviews.",
    };
  }

  if (/(.)\1{9,}/.test(text)) {
    return {
      isClean: false,
      isSpam: true,
      reason:
        "Please provide meaningful written feedback without excessive repeated characters.",
    };
  }

  return { isClean: true };
}
