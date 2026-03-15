import { Fragment, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface MarkdownContentProps {
  content: string;
  className?: string;
}

type Block =
  | { type: 'text'; value: string }
  | { type: 'code'; value: string; language?: string };

const parseBlocks = (content: string): Block[] => {
  const blocks: Block[] = [];
  const regex = /```([a-zA-Z0-9_-]+)?\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    const [fullMatch, language, code] = match;
    const start = match.index;

    if (start > lastIndex) {
      blocks.push({
        type: 'text',
        value: content.slice(lastIndex, start),
      });
    }

    blocks.push({
      type: 'code',
      language: language?.trim() || undefined,
      value: code.replace(/\n$/, ''),
    });

    lastIndex = start + fullMatch.length;
  }

  if (lastIndex < content.length) {
    blocks.push({
      type: 'text',
      value: content.slice(lastIndex),
    });
  }

  if (blocks.length === 0) {
    blocks.push({ type: 'text', value: content });
  }

  return blocks;
};

const renderInline = (text: string): ReactNode[] => {
  const nodes: ReactNode[] = [];
  const inlineRegex = /`([^`]+)`/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = inlineRegex.exec(text)) !== null) {
    const [fullMatch, inlineCode] = match;
    const start = match.index;

    if (start > lastIndex) {
      nodes.push(text.slice(lastIndex, start));
    }

    nodes.push(
      <code
        key={`${start}-${inlineCode}`}
        className="rounded bg-slate-200 px-1.5 py-0.5 font-mono text-[0.85em] text-slate-800"
      >
        {inlineCode}
      </code>,
    );

    lastIndex = start + fullMatch.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  if (nodes.length === 0) {
    nodes.push(text);
  }

  return nodes;
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
              <pre className="p-3 text-xs leading-relaxed text-slate-100">
                <code>{block.value}</code>
              </pre>
            </div>
          );
        }

        const paragraphs = block.value
          .split(/\n{2,}/)
          .map((part) => part.trim())
          .filter(Boolean);

        return paragraphs.map((paragraph, paragraphIndex) => (
          <p key={`text-${blockIndex}-${paragraphIndex}`} className="whitespace-pre-wrap">
            {renderInline(paragraph).map((node, nodeIndex) => (
              <Fragment key={`inline-${blockIndex}-${paragraphIndex}-${nodeIndex}`}>{node}</Fragment>
            ))}
          </p>
        ));
      })}
    </div>
  );
};
