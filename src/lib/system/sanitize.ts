import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize any HTML string before it reaches dangerouslySetInnerHTML.
 * Third-party book descriptions and LLM output are untrusted: they can contain
 * <script>, event handlers, javascript: URLs or <svg onload> payloads.
 */
export const sanitizeHtml = (html: string): string =>
  DOMPurify.sanitize(html ?? '', {
    ALLOWED_TAGS: [
      'p', 'br', 'b', 'strong', 'i', 'em', 'u', 'span', 'div',
      'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'blockquote', 'code', 'pre', 'hr',
    ],
    ALLOWED_ATTR: ['class', 'style'],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'svg', 'math', 'form', 'input', 'a'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'href', 'src', 'srcset', 'formaction'],
  });
