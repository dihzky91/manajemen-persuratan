const BLOCK_TAGS_WITH_CONTENT =
  /<\s*(script|iframe|object|embed)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi;
const BLOCK_SINGLE_TAGS = /<\s*(meta|link)[^>]*>/gi;
const INLINE_EVENT_HANDLERS =
  /\s+on[a-z]+\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi;
const JS_PROTOCOL = /(href|src)\s*=\s*(['"])\s*javascript:[\s\S]*?\2/gi;

export function sanitizeAnnouncementHtml(input: string): string {
  const normalized = input.trim();
  if (!normalized) return "";

  return normalized
    .replace(BLOCK_TAGS_WITH_CONTENT, "")
    .replace(BLOCK_SINGLE_TAGS, "")
    .replace(INLINE_EVENT_HANDLERS, "")
    .replace(JS_PROTOCOL, '$1="#"');
}

export function announcementHtmlToText(input: string): string {
  return input
    .replace(/<\s*(style|script)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
