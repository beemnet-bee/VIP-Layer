
import React from 'react';

interface Props {
  content: string;
}

const MarkdownRenderer: React.FC<Props> = ({ content }) => {
  // Simple markdown to JSX conversion
  const lines = content.split('\n');
  
  return (
    <div className="space-y-4">
      {lines.map((line, i) => {
        // Handle Headings (###)
        if (line.startsWith('### ')) {
          return <h3 key={i} className="text-xl font-black text-emerald-400 mt-8 mb-4 tracking-tight uppercase">{line.replace('### ', '')}</h3>;
        }
        if (line.startsWith('## ')) {
          return <h2 key={i} className="text-2xl font-black text-[var(--text-main)] mt-10 mb-6 tracking-tighter uppercase border-l-4 border-emerald-500 pl-4">{line.replace('## ', '')}</h2>;
        }
        
        // Handle Bold (**text**)
        let formattedLine: any = line;
        const boldRegex = /\*\*(.*?)\*\*/g;
        const parts = [];
        let lastIndex = 0;
        let match;
        
        while ((match = boldRegex.exec(line)) !== null) {
          parts.push(line.substring(lastIndex, match.index));
          parts.push(<strong key={match.index} className="text-emerald-400 font-extrabold">{match[1]}</strong>);
          lastIndex = boldRegex.lastIndex;
        }
        parts.push(line.substring(lastIndex));

        // Handle Bullet Points
        if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
          return (
            <div key={i} className="flex gap-4 items-start pl-4 group">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0 group-hover:scale-150 transition-transform"></div>
              <p className="text-[var(--text-muted)] text-base font-medium leading-relaxed">{parts.length > 1 ? parts : line.replace(/^[\*-]\s/, '')}</p>
            </div>
          );
        }

        if (line.trim() === '') return <div key={i} className="h-4"></div>;

        return <p key={i} className="text-[var(--text-muted)] text-base font-medium leading-relaxed">{parts.length > 1 ? parts : line}</p>;
      })}
    </div>
  );
};

export default MarkdownRenderer;
