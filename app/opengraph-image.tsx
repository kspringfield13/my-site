import { ImageResponse } from "next/og";
import { THEME_PALETTE } from "@/lib/theme/palette";

export const runtime = "edge";
export const alt = "Kyle Springfield";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background: THEME_PALETTE.black,
          color: THEME_PALETTE.text
        }}
      >
        <div style={{ fontSize: 28, letterSpacing: 1.2, textTransform: "uppercase", color: THEME_PALETTE.textMuted }}>
          Kyle Springfield
        </div>
        <div style={{ fontSize: 76, lineHeight: 1.05, maxWidth: 900, fontWeight: 600 }}>
          Data pipelines, analytics systems, and AI-powered apps.
        </div>
        <div style={{ fontSize: 30, color: THEME_PALETTE.accent700 }}>SQL · Python · dbt · Snowflake · AWS · GenAI</div>
      </div>
    ),
    {
      ...size
    }
  );
}
