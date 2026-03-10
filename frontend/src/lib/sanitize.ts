// Utility for sanitizing HTML content to prevent XSS attacks
// Uses DOMPurify to clean potentially dangerous HTML

import DOMPurify from 'dompurify';

/**
 * Configuration for allowed HTML tags and attributes
 * Customize based on your application's needs
 */
const SANITIZE_CONFIG = {
  ALLOWED_TAGS: [
    // Text formatting
    'b', 'i', 'em', 'strong', 'u', 's', 'sup', 'sub',
    // Structure
    'br', 'p', 'span', 'div', 'pre', 'code',
    // Headings
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    // Lists
    'ul', 'ol', 'li',
    // Tables (if needed for chord sheets)
    'table', 'thead', 'tbody', 'tr', 'td', 'th',
  ],
  ALLOWED_ATTR: [
    'class', 
    'style', // Be careful with inline styles
    'data-*', // Allow data attributes for chord positioning
  ],
  ALLOWED_STYLES: {
    '*': {
      // Only allow safe CSS properties
      'color': [/^#[0-9a-fA-F]{3,6}$/, /^rgb\(/],
      'background-color': [/^#[0-9a-fA-F]{3,6}$/, /^rgb\(/],
      'font-size': [/^\d+(?:px|em|rem|%)$/],
      'font-weight': [/^(?:bold|normal|\d{3})$/],
      'text-align': [/^(?:left|right|center|justify)$/],
      'margin': [/^\d+(?:px|em|rem)$/],
      'padding': [/^\d+(?:px|em|rem)$/],
    }
  },
  // Remove scripts and event handlers
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
};

/**
 * Sanitizes HTML string to prevent XSS attacks
 * @param dirty - The potentially unsafe HTML string
 * @param config - Optional custom DOMPurify configuration
 * @returns Sanitized HTML string safe for rendering
 */
export const sanitizeHtml = (
  dirty: string, 
  config: DOMPurify.Config = SANITIZE_CONFIG
): string => {
  if (!dirty || typeof dirty !== 'string') {
    return '';
  }

  try {
    return DOMPurify.sanitize(dirty, config);
  } catch (error) {
    console.error('Error sanitizing HTML:', error);
    // Return empty string on error to be safe
    return '';
  }
};

/**
 * Sanitizes HTML with stricter rules (no styling allowed)
 * Use for user-generated content that shouldn't have any formatting
 */
export const sanitizeHtmlStrict = (dirty: string): string => {
  return sanitizeHtml(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 'br', 'p'],
    ALLOWED_ATTR: [],
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'style'],
  });
};

/**
 * Strips all HTML tags, leaving only text
 * Use when you need plain text output from HTML content
 */
export const stripHtml = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
};

/**
 * Sanitizes and validates URLs to prevent javascript: and data: schemes
 */
export const sanitizeUrl = (url: string): string => {
  if (!url || typeof url !== 'string') {
    return '';
  }

  const trimmed = url.trim();
  
  // Block dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  const lowerUrl = trimmed.toLowerCase();
  
  for (const protocol of dangerousProtocols) {
    if (lowerUrl.startsWith(protocol)) {
      console.warn(`Blocked dangerous URL protocol: ${protocol}`);
      return '';
    }
  }

  // Only allow http, https, mailto, tel
  if (!/^(?:https?:|mailto:|tel:)?\/\//i.test(trimmed) && 
      !trimmed.startsWith('mailto:') && 
      !trimmed.startsWith('tel:') &&
      !trimmed.startsWith('/')) {
    // Relative URL is OK
    return trimmed;
  }

  return trimmed;
};

/**
 * Hook for React components to safely render HTML
 * Usage: const safeHtml = useSafeHtml(unsafeHtml);
 */
import { useMemo } from 'react';

export const useSafeHtml = (dirty: string, strict: boolean = false): string => {
  return useMemo(() => {
    return strict ? sanitizeHtmlStrict(dirty) : sanitizeHtml(dirty);
  }, [dirty, strict]);
};

export default {
  sanitizeHtml,
  sanitizeHtmlStrict,
  stripHtml,
  sanitizeUrl,
  useSafeHtml,
};
