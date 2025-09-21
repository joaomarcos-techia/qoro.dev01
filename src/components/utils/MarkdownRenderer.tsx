'use client';

import React from 'react';

// Função para converter Markdown básico para HTML
const toHtml = (markdown: string): string => {
  let html = markdown
    // Headers (h1, h2, h3)
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Negrito (**)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Itálico (*)
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Listas não ordenadas (* ou -)
    .replace(/^\s*[\*-] (.*$)/gim, '<li>$1</li>');

  // Agrupar itens de lista em <ul>
  html = html.replace(/<li>(.*?)<\/li>/g, '<ul><li>$1</li></ul>');
  html = html.replace(/<\/ul>\s*<ul>/g, '');

  // Parágrafos (quebras de linha duplas)
  html = html.split('\n\n').map(p => {
    if (p.startsWith('<ul>') || p.startsWith('<h')) {
      return p;
    }
    return `<p>${p}</p>`;
  }).join('');

  // Remover <p> em volta de listas
  html = html.replace(/<p><ul>/g, '<ul>').replace(/<\/ul><\/p>/g, '</ul>');
  
  // Substituir quebras de linha simples por <br> dentro de parágrafos
  html = html.replace(/\n/g, '<br />');

  return html;
};

// Componente React para renderizar o HTML
interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const htmlContent = toHtml(content);

  return (
    <div
      className="prose prose-invert prose-sm max-w-none text-base leading-relaxed"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};
