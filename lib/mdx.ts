import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import type { ReactNode } from "react";

interface MdxLoadResult<TFrontmatter> {
  frontmatter: TFrontmatter;
  content: ReactNode;
  raw: string;
}

export async function loadMdxFile<TFrontmatter>(absolutePath: string): Promise<MdxLoadResult<TFrontmatter>> {
  const source = await fs.readFile(absolutePath, "utf8");
  const parsed = matter(source);
  const compiled = await compileMDX<TFrontmatter>({
    source: parsed.content,
    options: {
      parseFrontmatter: false,
      mdxOptions: {
        remarkPlugins: [remarkGfm]
      }
    }
  });

  return {
    frontmatter: parsed.data as TFrontmatter,
    content: compiled.content,
    raw: source
  };
}

export function getContentPath(...segments: string[]) {
  return path.join(process.cwd(), "content", ...segments);
}
