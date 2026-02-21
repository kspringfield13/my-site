import { unified } from "unified";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import type { ReactNode } from "react";

interface MarkdownNode {
  type: string;
  value?: string;
  url?: string;
  depth?: number;
  ordered?: boolean;
  children?: MarkdownNode[];
}

function renderInline(nodes: MarkdownNode[] | undefined, keyPrefix: string): ReactNode[] {
  if (!nodes || nodes.length === 0) {
    return [];
  }

  return nodes.map((node, index) => {
    const key = `${keyPrefix}-inline-${index}`;
    if (node.type === "text") {
      return node.value ?? "";
    }

    if (node.type === "link") {
      const href = node.url ?? "#";
      const external = /^https?:\/\//.test(href);
      return (
        <a key={key} href={href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined}>
          {renderInline(node.children, key)}
        </a>
      );
    }

    return null;
  });
}

function renderListItem(node: MarkdownNode, key: string): ReactNode {
  const children = node.children ?? [];
  if (children.length === 1 && children[0]?.type === "paragraph") {
    return <li key={key}>{renderInline(children[0].children, key)}</li>;
  }

  return (
    <li key={key}>
      {children.map((child, index) => {
        const childKey = `${key}-child-${index}`;
        if (child.type === "paragraph") {
          return <p key={childKey}>{renderInline(child.children, childKey)}</p>;
        }
        return renderBlock(child, childKey);
      })}
    </li>
  );
}

function renderBlock(node: MarkdownNode, key: string): ReactNode {
  if (node.type === "heading") {
    const depth = Math.min(6, Math.max(1, node.depth ?? 2));
    if (depth === 1) return <h1 key={key}>{renderInline(node.children, key)}</h1>;
    if (depth === 2) return <h2 key={key}>{renderInline(node.children, key)}</h2>;
    if (depth === 3) return <h3 key={key}>{renderInline(node.children, key)}</h3>;
    if (depth === 4) return <h4 key={key}>{renderInline(node.children, key)}</h4>;
    if (depth === 5) return <h5 key={key}>{renderInline(node.children, key)}</h5>;
    return <h6 key={key}>{renderInline(node.children, key)}</h6>;
  }

  if (node.type === "paragraph") {
    return <p key={key}>{renderInline(node.children, key)}</p>;
  }

  if (node.type === "list") {
    const items = (node.children ?? []).map((child, index) => renderListItem(child, `${key}-item-${index}`));
    if (node.ordered) {
      return <ol key={key}>{items}</ol>;
    }
    return <ul key={key}>{items}</ul>;
  }

  return null;
}

export function MarkdownContent({ source }: { source: string }) {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(source) as MarkdownNode;
  const nodes = tree.children ?? [];
  return <>{nodes.map((node, index) => renderBlock(node, `block-${index}`))}</>;
}
