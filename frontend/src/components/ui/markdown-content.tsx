import { Fragment, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface MarkdownContentProps {
  content: string;
  className?: string;
}

type Block =
  | { type: 'text'; value: string }
  | { type: 'code'; value: string; language?: string };

const normalizeFencedCode = (content: string) =>
  content
    .replace(/[ \t]+```/g, '\n```')
    .replace(/```([a-zA-Z0-9_-]+)[ \t]+/g, '```$1\n')
    .replace(/```[ \t]+/g, '```\n');

const formatCodeBlock = (code: string) => {
  if (code.includes('\n')) return code.replace(/\n$/, '');

  return code
    .replace(/\s+/g, ' ')
    .replace(/\s*([{};])\s*/g, '$1\n')
    .replace(/\n{2,}/g, '\n')
    .trim();
};

const parseBlocks = (content: string): Block[] => {
  const blocks: Block[] = [];
  const normalizedContent = normalizeFencedCode(content);
  const regex = /```([a-zA-Z0-9_-]+)?\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(normalizedContent)) !== null) {
    const [fullMatch, language, code] = match;
    const start = match.index;

    if (start > lastIndex) {
      blocks.push({
        type: 'text',
        value: normalizedContent.slice(lastIndex, start),
      });
    }

    blocks.push({
      type: 'code',
      language: language?.trim() || undefined,
      value: formatCodeBlock(code),
    });

    lastIndex = start + fullMatch.length;
  }

  if (lastIndex < normalizedContent.length) {
    blocks.push({
      type: 'text',
      value: normalizedContent.slice(lastIndex),
    });
  }

  if (blocks.length === 0) {
    blocks.push({ type: 'text', value: normalizedContent });
  }

  return blocks;
};

const renderInline = (text: string, keyPrefix: string): ReactNode[] => {
  const tokens = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g).filter(Boolean);

  return tokens.map((token, index) => {
    const tokenKey = `${keyPrefix}-${index}`;

    if (token.startsWith('`') && token.endsWith('`')) {
      return (
        <code
          key={tokenKey}
          className="rounded bg-slate-200 px-1.5 py-0.5 font-mono text-[0.85em] text-slate-800"
        >
          {token.slice(1, -1)}
        </code>
      );
    }

    if (token.startsWith('**') && token.endsWith('**')) {
      return <strong key={tokenKey}>{token.slice(2, -2)}</strong>;
    }

    if (token.startsWith('*') && token.endsWith('*')) {
      return <em key={tokenKey}>{token.slice(1, -1)}</em>;
    }

    const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      const href = /^https?:\/\//i.test(linkMatch[2]) ? linkMatch[2] : null;
      if (!href) return <Fragment key={tokenKey}>{linkMatch[1]}</Fragment>;
      return (
        <a
          key={tokenKey}
          href={href}
          target="_blank"
          rel="noreferrer noopener"
          className="text-brand-700 underline underline-offset-2 hover:text-brand-900"
        >
          {linkMatch[1]}
        </a>
      );
    }

    return <Fragment key={tokenKey}>{token}</Fragment>;
  });
};

const renderTextBlock = (value: string, blockIndex: number) => {
  const lines = value.split('\n');
  const elements: ReactNode[] = [];
  let currentListItems: string[] = [];

  const flushList = () => {
    if (currentListItems.length === 0) return;
    const listKey = `list-${blockIndex}-${elements.length}`;
    elements.push(
      <ul key={listKey} className="list-disc pl-5 space-y-1">
        {currentListItems.map((item, itemIndex) => (
          <li key={`${listKey}-${itemIndex}`}>
            {renderInline(item, `${listKey}-inline-${itemIndex}`)}
          </li>
        ))}
      </ul>,
    );
    currentListItems = [];
  };

  lines.forEach((rawLine, lineIndex) => {
    const line = rawLine.trim();
    const lineKey = `line-${blockIndex}-${lineIndex}`;

    if (!line) {
      flushList();
      return;
    }

    const listMatch = line.match(/^[-*]\s+(.+)$/);
    if (listMatch) {
      currentListItems.push(listMatch[1]);
      return;
    }

    flushList();

    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const headingContent = renderInline(headingMatch[2], `${lineKey}-heading`);

      if (level === 1) {
        elements.push(
          <h1 key={lineKey} className="text-2xl font-bold tracking-tight text-slate-900">
            {headingContent}
          </h1>,
        );
        return;
      }

      if (level === 2) {
        elements.push(
          <h2 key={lineKey} className="text-xl font-bold tracking-tight text-slate-900">
            {headingContent}
          </h2>,
        );
        return;
      }

      elements.push(
        <h3 key={lineKey} className="text-base font-semibold text-slate-900">
          {headingContent}
        </h3>,
      );
      return;
    }

    if (line === '---') {
      elements.push(<hr key={lineKey} className="border-slate-300" />);
      return;
    }

    const quoteMatch = line.match(/^>\s+(.+)$/);
    if (quoteMatch) {
      elements.push(
        <blockquote
          key={lineKey}
          className="border-l-4 border-slate-300 bg-slate-50 px-3 py-2 text-slate-700"
        >
          {renderInline(quoteMatch[1], `${lineKey}-quote`)}
        </blockquote>,
      );
      return;
    }

    elements.push(
      <p key={lineKey} className="whitespace-pre-wrap">
        {renderInline(line, `${lineKey}-p`)}
      </p>,
    );
  });

  flushList();
  return elements;
};

export const MarkdownContent = ({ content, className }: MarkdownContentProps) => {
  const blocks = parseBlocks(content || '');

  return (
    <div className={cn('space-y-3', className)}>
      {blocks.map((block, blockIndex) => {
        if (block.type === 'code') {
          return (
            <div key={`code-${blockIndex}`} className="overflow-x-auto rounded-lg border border-slate-200 bg-slate-900">
              {block.language && (
                <div className="border-b border-slate-700 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-300">
                  {block.language}
                </div>
              )}
              <pre className="p-3 text-xs leading-relaxed text-slate-100 whitespace-pre-wrap">
                <code>{block.value}</code>
              </pre>
            </div>
          );
        }

        return <div key={`text-${blockIndex}`} className="space-y-2">{renderTextBlock(block.value, blockIndex)}</div>;
      })}
    </div>
  );
};
