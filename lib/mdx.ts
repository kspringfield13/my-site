import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

interface MdxLoadResult<TFrontmatter> {
  frontmatter: TFrontmatter;
  source: string;
  raw: string;
}

export async function loadMdxFile<TFrontmatter>(absolutePath: string): Promise<MdxLoadResult<TFrontmatter>> {
  const source = await fs.readFile(absolutePath, "utf8");
  const parsed = matter(source);

  return {
    frontmatter: parsed.data as TFrontmatter,
    source: parsed.content,
    raw: source
  };
}

export function getContentPath(...segments: string[]) {
  return path.join(process.cwd(), "content", ...segments);
}
