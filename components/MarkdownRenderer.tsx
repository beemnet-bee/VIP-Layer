
import React from 'react';

interface Props {
  content: string;
}

const MarkdownRenderer: React.FC<Props> = ({ content }) => {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];

  const parseInline = (text: string) => {
    // Strip bold markers (**), italics (*), and horizontal rules (---)
    // while keeping the internal text for a clean, professional look.
    return text
      .replace(/\*\*\*(.*?)\*\*\*/g, '$1')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/---/g, '')
      .replace(/\*/g, '')
      .trim();
  };

  const renderTable = (rows: string[], key: number) => {
    const tableData = rows.map(row => 
      row.split('|')
         .filter((cell, index, array) => {
            // Remove the empty segments created by splitting at the start/end pipes
            const isEdge = (index === 0 || index === array.length - 1) && cell.trim() === '';
            return !isEdge;
         })
         .map(cell => cell.trim())
    ).filter(row => row.length > 0);

    // Filter out markdown table separator rows (e.g., |---|---|)
    const filteredRows = tableData.filter(row => !row.every(cell => cell.includes('---')));
    
    if (filteredRows.length < 1) return null;

    const headers = filteredRows[0];
    const bodyRows = filteredRows.slice(1);

    return (
      <div key={key} className="my-8 overflow-x-auto rounded-2xl border border-white/20 bg-black/[0.03] shadow-xl backdrop-blur-md">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-emerald-500/10 border-b border-white/20">
              {headers.map((header, i) => (
                <th key={i} className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-emerald-500">
                  {parseInline(header)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/20">
            {bodyRows.map((row, i) => (
              <tr key={i} className="hover:bg-black/[0.02] transition-colors">
                {row.map((cell, j) => (
                  <td key={j} className="px-6 py-4 text-sm text-[var(--text-muted)] font-medium">
                    {parseInline(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  let currentTableRows: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Table detection: line starts/ends with pipe or contains multiple pipes
    if (line.startsWith('|') || (line.includes('|') && line.split('|').length > 2)) {
      currentTableRows.push(lines[i]);
      // If it's the last line or next line isn't part of the table, render it
      if (i === lines.length - 1 || (!lines[i + 1].trim().startsWith('|') && !lines[i + 1].trim().includes('|'))) {
        elements.push(renderTable(currentTableRows, i));
        currentTableRows = [];
      }
      continue;
    }

    // Header detection
    if (line.startsWith('### ')) {
      elements.push(<h3 key={i} className="text-lg font-black text-emerald-500 mt-8 mb-4 tracking-tight uppercase">{parseInline(line.replace('### ', ''))}</h3>);
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(<h2 key={i} className="text-xl font-black text-[var(--text-main)] mt-10 mb-6 tracking-tighter uppercase border-l-4 border-emerald-500 pl-4">{parseInline(line.replace('## ', ''))}</h2>);
      continue;
    }

    // Skip empty lines or markdown rules
    if (line === '' || line === '---' || line === '***') {
      continue;
    }

    // List Item detection (starts with * or -)
    if (line.startsWith('* ') || line.startsWith('- ')) {
      elements.push(
        <div key={i} className="flex gap-4 items-start pl-2 mb-4 group">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2.5 flex-shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.5)] group-hover:scale-125 transition-transform"></div>
          <p className="text-[var(--text-muted)] text-base font-medium leading-relaxed">{parseInline(line.replace(/^[\*-]\s/, ''))}</p>
        </div>
      );
      continue;
    }

    // Default paragraph rendering
    const cleanedLine = parseInline(line);
    if (cleanedLine) {
      elements.push(
        <p key={i} className="text-[var(--text-muted)] text-base font-medium leading-relaxed mb-6 last:mb-0">
          {cleanedLine}
        </p>
      );
    }
  }

  return <div className="markdown-container">{elements}</div>;
};

export default MarkdownRenderer;
