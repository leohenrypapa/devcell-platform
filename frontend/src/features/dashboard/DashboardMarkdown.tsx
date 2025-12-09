// frontend/src/features/dashboard/DashboardMarkdown.tsx
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type DashboardMarkdownProps = {
  markdown: string;
};

const DashboardMarkdown: React.FC<DashboardMarkdownProps> = ({ markdown }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h1
            style={{
              margin: "0 0 0.4rem",
              fontSize: "var(--dc-font-size-lg)",
              fontWeight: 600,
              lineHeight: 1.25,
            }}
          >
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2
            style={{
              margin: "0.4rem 0 0.3rem",
              fontSize: "var(--dc-font-size-md)",
              fontWeight: 600,
              lineHeight: 1.3,
            }}
          >
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3
            style={{
              margin: "0.3rem 0 0.2rem",
              fontSize: "var(--dc-font-size-sm)",
              fontWeight: 600,
              lineHeight: 1.3,
            }}
          >
            {children}
          </h3>
        ),
        p: ({ children }) => (
          <p
            style={{
              margin: "0 0 0.4rem",
              fontSize: "var(--dc-font-size-sm)",
              lineHeight: 1.5,
            }}
          >
            {children}
          </p>
        ),
        ul: ({ children }) => (
          <ul
            style={{
              margin: "0 0 0.4rem 1.2rem",
              padding: 0,
              fontSize: "var(--dc-font-size-sm)",
              lineHeight: 1.5,
            }}
          >
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol
            style={{
              margin: "0 0 0.4rem 1.2rem",
              padding: 0,
              fontSize: "var(--dc-font-size-sm)",
              lineHeight: 1.5,
            }}
          >
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li
            style={{
              marginBottom: "0.2rem",
            }}
          >
            {children}
          </li>
        ),
        strong: ({ children }) => (
          <strong
            style={{
              fontWeight: 600,
            }}
          >
            {children}
          </strong>
        ),
      }}
    >
      {markdown}
    </ReactMarkdown>
  );
};

export default DashboardMarkdown;
