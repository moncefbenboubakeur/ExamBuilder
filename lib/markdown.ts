// Markdown configuration for react-markdown with sanitization

import type { Options } from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';

/**
 * Safe markdown rendering configuration
 * Uses rehype-sanitize to prevent XSS attacks
 */
export const markdownOptions: Partial<Options> = {
  rehypePlugins: [rehypeSanitize],
};

/**
 * Custom className for markdown content styling
 * Uses custom prose styles defined in globals.css with proper contrast ratios
 */
export const markdownClassName = 'prose max-w-full';
