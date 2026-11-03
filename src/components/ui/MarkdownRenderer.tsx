import React from "react";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

function parseInline(text: string): React.ReactNode[] {
  // Regex to match inline patterns:
  // 1. Links: [text](href)
  // 2. Code: `code`
  // 3. Bold: **text** or __text__
  // 4. Strikethrough: ~~text~~
  // 5. Italic: *text* or _text_
  const tokens: React.ReactNode[] = [];
  let remaining = text;
  let keyIdx = 0;

  while (remaining.length > 0) {
    // Code block check first
    const codeMatch = remaining.match(/^`([^`]+)`/);
    if (codeMatch) {
      tokens.push(
        <code
          key={`code-${keyIdx++}`}
          className="px-1.5 py-0.5 rounded bg-slate-800/90 text-amber-300 font-mono text-xs border border-slate-700/60"
        >
          {codeMatch[1]}
        </code>
      );
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // Link check: [text](url)
    const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      const linkText = linkMatch[1];
      const href = linkMatch[2].trim();
      const isSafe =
        href.startsWith("http://") ||
        href.startsWith("https://") ||
        href.startsWith("mailto:") ||
        href.startsWith("/");

      tokens.push(
        <a
          key={`link-${keyIdx++}`}
          href={isSafe ? href : "#"}
          target={isSafe && href.startsWith("http") ? "_blank" : undefined}
          rel={isSafe && href.startsWith("http") ? "noopener noreferrer" : undefined}
          className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors cursor-pointer"
        >
          {parseInline(linkText)}
        </a>
      );
      remaining = remaining.slice(linkMatch[0].length);
      continue;
    }

    // Bold check: **text** or __text__
    const boldMatch = remaining.match(/^(\*\*|__)(.+?)\1/);
    if (boldMatch) {
      tokens.push(
        <strong key={`bold-${keyIdx++}`} className="font-bold text-white">
          {parseInline(boldMatch[2])}
        </strong>
      );
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // Strikethrough: ~~text~~
    const strikeMatch = remaining.match(/^~~(.+?)~~/);
    if (strikeMatch) {
      tokens.push(
        <del key={`strike-${keyIdx++}`} className="line-through text-slate-400">
          {parseInline(strikeMatch[1])}
        </del>
      );
      remaining = remaining.slice(strikeMatch[0].length);
      continue;
    }

    // Italic check: *text* or _text_
    const italicMatch = remaining.match(/^(\*|_)([^*_]+?)\1/);
    if (italicMatch) {
      tokens.push(
        <em key={`italic-${keyIdx++}`} className="italic text-slate-200">
          {parseInline(italicMatch[2])}
        </em>
      );
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // Plain text until next special character
    const nextSpecial = remaining.search(/[`*~_\[]/);
    if (nextSpecial === -1) {
      tokens.push(remaining);
      break;
    } else if (nextSpecial === 0) {
      tokens.push(remaining[0]);
      remaining = remaining.slice(1);
    } else {
      tokens.push(remaining.slice(0, nextSpecial));
      remaining = remaining.slice(nextSpecial);
    }
  }

  return tokens;
}

export default function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  if (!content || !content.trim()) return null;

  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;
  let elementKey = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced Code Block
    if (line.trim().startsWith("```")) {
      const lang = line.trim().slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // Skip closing ```
      elements.push(
        <div key={`code-block-${elementKey++}`} className="my-2.5 rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
          {lang && (
            <div className="px-3 py-1 bg-slate-900 border-b border-slate-800 text-[10px] uppercase font-mono tracking-wider text-slate-400">
              {lang}
            </div>
          )}
          <pre className="p-3 text-xs font-mono text-emerald-400 overflow-x-auto leading-relaxed">
            <code>{codeLines.join("\n")}</code>
          </pre>
        </div>
      );
      continue;
    }

    // Horizontal Rule
    if (/^(---|___|\*\*\*)$/.test(line.trim())) {
      elements.push(
        <hr key={`hr-${elementKey++}`} className="my-3 border-t border-slate-800" />
      );
      i++;
      continue;
    }

    // Headings
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const headingText = headingMatch[2];
      const parsedHeading = parseInline(headingText);

      switch (level) {
        case 1:
          elements.push(
            <h1 key={`h1-${elementKey++}`} className="text-lg font-extrabold text-white mt-3 mb-2 first:mt-0 tracking-tight">
              {parsedHeading}
            </h1>
          );
          break;
        case 2:
          elements.push(
            <h2 key={`h2-${elementKey++}`} className="text-base font-bold text-white mt-3 mb-1.5 first:mt-0 tracking-tight">
              {parsedHeading}
            </h2>
          );
          break;
        case 3:
          elements.push(
            <h3 key={`h3-${elementKey++}`} className="text-sm font-bold text-slate-100 mt-2 mb-1 first:mt-0">
              {parsedHeading}
            </h3>
          );
          break;
        default:
          elements.push(
            <h4 key={`h4-${elementKey++}`} className="text-xs font-bold uppercase tracking-wider text-slate-300 mt-2 mb-1 first:mt-0">
              {parsedHeading}
            </h4>
          );
          break;
      }
      i++;
      continue;
    }

    // Blockquote
    if (line.trim().startsWith(">")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoteLines.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      elements.push(
        <blockquote
          key={`quote-${elementKey++}`}
          className="border-l-2 border-indigo-500 pl-3 my-2 text-slate-400 italic text-sm leading-relaxed"
        >
          {quoteLines.map((ql, qIdx) => (
            <p key={qIdx} className={qIdx > 0 ? "mt-1" : ""}>
              {parseInline(ql)}
            </p>
          ))}
        </blockquote>
      );
      continue;
    }

    // Unordered List
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ""));
        i++;
      }
      elements.push(
        <ul key={`ul-${elementKey++}`} className="list-disc list-inside space-y-1 my-2 text-sm text-slate-200 pl-1">
          {items.map((itemText, itemIdx) => (
            <li key={itemIdx} className="leading-relaxed">
              <span className="text-slate-200">{parseInline(itemText)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Ordered List
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ""));
        i++;
      }
      elements.push(
        <ol key={`ol-${elementKey++}`} className="list-decimal list-inside space-y-1 my-2 text-sm text-slate-200 pl-1">
          {items.map((itemText, itemIdx) => (
            <li key={itemIdx} className="leading-relaxed">
              <span className="text-slate-200">{parseInline(itemText)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Blank line
    if (!line.trim()) {
      i++;
      continue;
    }

    // Paragraph
    const paragraphLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith("```") &&
      !lines[i].trim().startsWith(">") &&
      !lines[i].match(/^#{1,6}\s+/) &&
      !/^\s*[-*]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i]) &&
      !/^(---|___|\*\*\*)$/.test(lines[i].trim())
    ) {
      paragraphLines.push(lines[i]);
      i++;
    }

    elements.push(
      <p key={`p-${elementKey++}`} className="text-sm text-slate-200 leading-relaxed my-1.5 first:mt-0 last:mb-0 break-words">
        {paragraphLines.map((pl, plIdx) => (
          <React.Fragment key={plIdx}>
            {plIdx > 0 && <br />}
            {parseInline(pl)}
          </React.Fragment>
        ))}
      </p>
    );
  }

  return <div className={`space-y-1.5 ${className}`}>{elements}</div>;
}
