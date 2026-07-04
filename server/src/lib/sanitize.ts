import sanitizeHtml from 'sanitize-html';

/**
 * 白名单 HTML 清洗 — 只允许 Quill 编辑器产出的安全标签
 */
export function sanitizeContent(dirty: string): string {
  return sanitizeHtml(dirty, {
    allowedTags: ['b', 'i', 'u', 's', 'strong', 'em', 'br', 'p', 'ul', 'ol', 'li', 'a', 'span'],
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
      span: ['style'],
    },
    allowedStyles: {
      span: { color: [/.*/], 'background-color': [/.*/] },
    },
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: { ...attribs, target: '_blank', rel: 'noopener noreferrer' },
      }),
    },
  });
}
