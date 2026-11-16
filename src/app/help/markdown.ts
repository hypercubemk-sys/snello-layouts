export interface Inline {
  kind: 'text' | 'strong' | 'code' | 'link';
  value: string;
  href?: string;
}

export type Block =
  | { kind: 'p'; parts: Inline[] }
  | { kind: 'h3'; parts: Inline[] }
  | { kind: 'ul'; items: Inline[][] }
  | { kind: 'ol'; items: Inline[][] };

export interface HelpSection {
  id: string;
  document: string;
  heading: string;
  blocks: Block[];
  text: string;
}

export function parseDocument(markdown: string, documentId: string, documentTitle: string): HelpSection[] {
  const sections: HelpSection[] = [];
  let heading = '';
  let blocks: Block[] = [];
  let index = 0;

  const flush = () => {
    if (!heading && blocks.length === 0) return;
    sections.push({
      id: `${documentId}-${index++}`,
      document: documentTitle,
      heading: heading || documentTitle,
      blocks,
      text: [heading, ...blocks.flatMap(blockText)].join(' '),
    });
    heading = '';
    blocks = [];
  };

  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  let i = 0;
  while (i < lines.length) {
    const line = lines[i] ?? '';
    const trimmed = line.trim();
    if (!trimmed) {
      i += 1;
      continue;
    }
    if (trimmed.startsWith('# ')) {
      i += 1;
      continue;
    }
    if (trimmed.startsWith('## ')) {
      flush();
      heading = trimmed.slice(3).trim();
      i += 1;
      continue;
    }
    if (trimmed.startsWith('### ')) {
      blocks.push({ kind: 'h3', parts: inlines(trimmed.slice(4).trim()) });
      i += 1;
      continue;
    }
    if (trimmed.startsWith('- ')) {
      const items: Inline[][] = [];
      while (i < lines.length && (lines[i] ?? '').trim().startsWith('- ')) {
        items.push(inlines((lines[i] ?? '').trim().slice(2)));
        i += 1;
      }
      blocks.push({ kind: 'ul', items });
      continue;
    }
    if (/^\d+\. /.test(trimmed)) {
      const items: Inline[][] = [];
      while (i < lines.length && /^\d+\. /.test((lines[i] ?? '').trim())) {
        items.push(inlines((lines[i] ?? '').trim().replace(/^\d+\. /, '')));
        i += 1;
      }
      blocks.push({ kind: 'ol', items });
      continue;
    }
    const paragraph: string[] = [];
    while (i < lines.length && (lines[i] ?? '').trim() && !isBlock((lines[i] ?? '').trim())) {
      paragraph.push((lines[i] ?? '').trim());
      i += 1;
    }
    blocks.push({ kind: 'p', parts: inlines(paragraph.join(' ')) });
  }
  flush();
  return sections;
}

function isBlock(line: string): boolean {
  return line.startsWith('# ') || line.startsWith('## ') || line.startsWith('### ') || line.startsWith('- ') || /^\d+\. /.test(line);
}

function blockText(block: Block): string[] {
  if (block.kind === 'ul' || block.kind === 'ol') {
    return block.items.map((item) => item.map((part) => part.value).join(''));
  }
  return [block.parts.map((part) => part.value).join('')];
}

function inlines(source: string): Inline[] {
  const parts: Inline[] = [];
  const pattern = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|`([^`]+)`/g;
  let cursor = 0;
  for (const match of source.matchAll(pattern)) {
    const start = match.index ?? 0;
    if (start > cursor) parts.push({ kind: 'text', value: source.slice(cursor, start) });
    if (match[1] != null && match[2] != null) parts.push({ kind: 'link', value: match[1], href: match[2] });
    else if (match[3] != null) parts.push({ kind: 'strong', value: match[3] });
    else if (match[4] != null) parts.push({ kind: 'code', value: match[4] });
    cursor = start + match[0].length;
  }
  if (cursor < source.length) parts.push({ kind: 'text', value: source.slice(cursor) });
  return parts.filter((part) => part.value.length > 0);
}
