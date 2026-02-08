import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export async function GET() {
  const filePath = path.join(process.cwd(), "content", "resume", "resume.md");
  try {
    const source = await fs.readFile(filePath, "utf8");
    return new NextResponse(source, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": 'inline; filename="kyle-springfield-resume.md"'
      }
    });
  } catch {
    return new NextResponse("Resume source not found", { status: 404 });
  }
}
