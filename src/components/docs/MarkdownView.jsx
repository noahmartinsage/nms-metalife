import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** Markdown 渲染（深色主题排版） */
export default function MarkdownView({ content, className }) {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="mb-3 mt-2 border-b border-white/10 pb-2 text-lg font-bold text-white">{children}</h1>
          ),
          h2: ({ children }) => <h2 className="mb-2 mt-5 text-base font-semibold text-cyan-200">{children}</h2>,
          h3: ({ children }) => <h3 className="mb-1.5 mt-4 text-sm font-semibold text-foreground">{children}</h3>,
          h4: ({ children }) => <h4 className="mb-1 mt-3 text-[13px] font-medium text-foreground">{children}</h4>,
          p: ({ children }) => <p className="my-1.5 text-[12px] leading-relaxed text-muted-foreground">{children}</p>,
          ul: ({ children }) => <ul className="my-1.5 list-disc space-y-0.5 pl-5 text-[12px] text-muted-foreground">{children}</ul>,
          ol: ({ children }) => <ol className="my-1.5 list-decimal space-y-0.5 pl-5 text-[12px] text-muted-foreground">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
          a: ({ href, children }) => (
            <a href={href} className="text-cyan-300 underline-offset-2 hover:underline">
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-2 rounded-r-lg border-l-2 border-cyan-400/40 bg-cyan-400/5 py-1.5 pl-3 pr-2 text-[11px] text-muted-foreground">
              {children}
            </blockquote>
          ),
          code: ({ inline, children }) =>
            inline ? (
              <code className="rounded bg-white/10 px-1 py-0.5 font-mono text-[11px] text-cyan-200">{children}</code>
            ) : (
              <code className="block font-mono text-[11px] leading-relaxed text-emerald-200">{children}</code>
            ),
          pre: ({ children }) => (
            <pre className="my-2 overflow-x-auto rounded-xl border border-white/10 bg-black/40 p-3 text-[11px]">
              {children}
            </pre>
          ),
          table: ({ children }) => (
            <div className="my-2 overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-[11px]">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-white/5 text-muted-foreground">{children}</thead>,
          th: ({ children }) => (
            <th className="whitespace-nowrap border-b border-white/10 px-2 py-1.5 text-left font-medium">{children}</th>
          ),
          td: ({ children }) => (
            <td className="border-b border-white/5 px-2 py-1.5 text-muted-foreground">{children}</td>
          ),
          hr: () => <hr className="my-4 border-white/10" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
