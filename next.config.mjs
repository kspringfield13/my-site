import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: __dirname,
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com"
      },
      {
        protocol: "https",
        hostname: "opengraph.githubassets.com"
      }
    ]
  },
  experimental: {
    mdxRs: true
  }
};

export default nextConfig;
