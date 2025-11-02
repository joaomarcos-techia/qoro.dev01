
'use client';

import React, { useMemo } from 'react';

// Função para escapar HTML especial em blocos de código
const escapeHtml = (text: string): string => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

// Função principal para converter Markdown para HTML
const toHtml = (markdown: string): string => {
  let html = `\n${markdown}\n`;

  const codeBlocks: string[] = [];
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
    const index = codeBlocks.length;
    const langClass = lang ? ` language-${lang}` : '';
    codeBlocks.push(`<pre><code class="code-block${langClass}">${escapeHtml(code.trim())}</code></pre>`);
    return `\n__CODE_BLOCK_${index}__\n`;
  });

  const inlineCodeBlocks: string[] = [];
  html = html.replace(/`([^`\n]+)`/g, (match, code) => {
    const index = inlineCodeBlocks.length;
    inlineCodeBlocks.push(`<code class="inline-code">${escapeHtml(code)}</code>`);
    return `__INLINE_CODE_${index}__`;
  });

  // Headers
  html = html
    .replace(/\n#### (.*)/g, '\n<h4 class="text-base font-semibold mt-4 mb-2 text-gray-200">$1</h4>')
    .replace(/\n### (.*)/g, '\n<h3 class="text-lg font-semibold mt-5 mb-3 text-gray-100">$1</h3>')
    .replace(/\n## (.*)/g, '\n<h2 class="text-xl font-bold mt-6 mb-4 text-white">$1</h2>')
    .replace(/\n# (.*)/g, '\n<h1 class="text-2xl font-bold mt-8 mb-6 text-white border-b border-gray-600 pb-2">$1</h1>');

  // Negrito e Itálico
  html = html
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>')
    .replace(/__(.*?)__/g, '<strong class="font-semibold text-white">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic text-gray-300">$1</em>')
    .replace(/_(.*?)_/g, '<em class="italic text-gray-300">$1</em>');

  // Listas
  html = html.replace(/^\s*\n\*\s/gm, '\n<uli>')
             .replace(/^\s*\n\-\s/gm, '\n<uli>')
             .replace(/^\s*\n\d+\.\s/gm, '\n<oli>');
  
  // Agrupar itens de lista
  html = html.replace(/(<(\/)?(uli|oli)>)/g, '\n$1\n').replace(/(\n\n)/g, '\n');

  // Blockquotes
  html = html.replace(/\n> /g, '\n<bquote>');

  // Linhas horizontais
  html = html.replace(/\n---\n/g, '\n<hr class="border-gray-600 my-6" />\n');

  // Parágrafos
  let sections = html.split('\n');
  html = sections.map(section => {
    let line = section.trim();
    if (/^<(\/)?(h|ul|ol|li|bquote|pre|hr)/.test(line)) {
      return line;
    }
    return line ? `<p>${line}</p>` : '';
  }).join('');

  // Agrupar elementos
  function groupElements(tag: string, groupTag: string, groupClass: string) {
    const regex = new RegExp(`(<${tag}>.*?<\/${tag}>)+`, 'gs');
    html = html.replace(regex, (match) => {
      const items = match.match(new RegExp(`<${tag}>(.*?)<\/${tag}>`, 'gs')) || [];
      const listItems = items.map(item => `<li class="mb-1 text-gray-300">${item.replace(new RegExp(`<\/?${tag}>`, 'g'), '')}</li>`).join('');
      return `<${groupTag} class="${groupClass}">${listItems}</${groupTag}>`;
    });
  }

  groupElements('bquote', 'blockquote', 'border-l-4 border-gray-500 pl-4 py-2 my-4 bg-gray-800/30 text-gray-300 italic');
  groupElements('uli', 'ul', 'list-disc list-inside space-y-1 my-4 ml-4 text-gray-300');
  groupElements('oli', 'ol', 'list-decimal list-inside space-y-1 my-4 ml-4 text-gray-300');

  // Restaurar blocos de código
  codeBlocks.forEach((block, index) => {
    html = html.replace(`__CODE_BLOCK_${index}__`, block);
  });
  inlineCodeBlocks.forEach((block, index) => {
    html = html.replace(`__INLINE_CODE_${index}__`, block);
  });

  return html.trim();
};

const useMarkdownHtml = (content: string): string => {
  return useMemo(() => toHtml(content), [content]);
};

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = "" }) => {
  const htmlContent = useMarkdownHtml(content);

  return (
    <div
      className={`markdown-content ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
      style={{
        '--inline-code-bg': 'rgb(31 41 55 / 0.7)',
        '--inline-code-color': 'hsl(var(--primary))',
        '--inline-code-padding': '0.125rem 0.375rem',
        '--inline-code-radius': '0.375rem',
        '--code-block-bg': 'rgb(17, 24, 39)',
        '--code-block-border': 'rgb(55, 65, 81)',
        '--code-block-padding': '1rem',
        '--code-block-radius': '0.5rem',
      } as React.CSSProperties}
    />
  );
};

export const markdownStyles = `
.markdown-content p {
  margin-bottom: 1rem;
  line-height: 1.7;
}
.markdown-content .inline-code {
  background-color: var(--inline-code-bg);
  color: var(--inline-code-color);
  padding: var(--inline-code-padding);
  border-radius: var(--inline-code-radius);
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, monospace;
  font-size: 0.875em;
  font-weight: 600;
}
.markdown-content pre {
  margin: 1.5rem 0;
  background-color: var(--code-block-bg);
  border-radius: var(--code-block-radius);
  border: 1px solid var(--code-block-border);
}
.markdown-content .code-block {
  background-color: transparent;
  border: none;
  padding: var(--code-block-padding);
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  color: rgb(229, 231, 235);
  overflow-x: auto;
  white-space: pre;
}
`;

export { toHtml, useMarkdownHtml };
