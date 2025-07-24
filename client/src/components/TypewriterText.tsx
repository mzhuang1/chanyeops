import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface TypewriterTextProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  className?: string;
  enableMarkdown?: boolean;
}

export function TypewriterText({ 
  text, 
  speed = 30, 
  onComplete, 
  className = "",
  enableMarkdown = true
}: TypewriterTextProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timeout);
    } else if (currentIndex === text.length && onComplete) {
      onComplete();
    }
  }, [currentIndex, text, speed, onComplete]);

  // Reset when text changes
  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
  }, [text]);

  if (enableMarkdown) {
    return (
      <div className={className}>
        <div className="prose prose-sm max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => <h1 className="text-xl font-bold text-gray-900 mb-3 mt-4">{children}</h1>,
              h2: ({ children }) => <h2 className="text-lg font-semibold text-gray-900 mb-2 mt-3">{children}</h2>,
              h3: ({ children }) => <h3 className="text-md font-semibold text-gray-900 mb-2 mt-2">{children}</h3>,
              p: ({ children }) => <p className="text-gray-800 mb-2 leading-relaxed">{children}</p>,
              ul: ({ children }) => <ul className="list-disc list-inside text-gray-800 mb-2 space-y-1">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal list-inside text-gray-800 mb-2 space-y-1">{children}</ol>,
              li: ({ children }) => <li className="text-gray-800">{children}</li>,
              strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
              code: ({ children }) => <code className="text-blue-600 bg-blue-50 px-1 py-0.5 rounded text-sm">{children}</code>,
              pre: ({ children }) => <pre className="bg-gray-100 p-3 rounded-lg text-sm text-gray-800 overflow-x-auto mb-2">{children}</pre>,
              blockquote: ({ children }) => <blockquote className="border-l-4 border-blue-500 pl-4 text-gray-700 italic mb-2">{children}</blockquote>,
              table: ({ children }) => <table className="min-w-full border-collapse border border-gray-300 my-2">{children}</table>,
              thead: ({ children }) => <thead className="bg-gray-50">{children}</thead>,
              tbody: ({ children }) => <tbody>{children}</tbody>,
              tr: ({ children }) => <tr className="border-b border-gray-200">{children}</tr>,
              th: ({ children }) => <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-900">{children}</th>,
              td: ({ children }) => <td className="border border-gray-300 px-3 py-2 text-gray-800">{children}</td>,
            }}
          >
            {displayedText}
          </ReactMarkdown>
        </div>
        {currentIndex < text.length && (
          <span className="animate-pulse text-gray-600">|</span>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      {displayedText}
      {currentIndex < text.length && (
        <span className="animate-pulse">|</span>
      )}
    </div>
  );
}