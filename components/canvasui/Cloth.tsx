/*
 * Adapted from Canvas UI Cloth by David Haz.
 * Upstream: https://github.com/DavidHDev/canvas-ui
 * License: ./UPSTREAM_LICENSE.md
 */
"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import {
  createCloth,
  supportsHtmlInCanvas,
  type ClothFallbackPainter,
  type ClothInstance,
  type ClothOptions,
} from "./ClothVanilla";

export interface ClothProps extends ClothOptions {
  children: ReactNode;
  className?: string;
  fallbackPainter?: ClothFallbackPainter;
  style?: React.CSSProperties;
}

const emptySubscribe = () => () => {};

export function Cloth({ children, className, fallbackPainter, style, ...options }: ClothProps) {
  const sourceRef = useRef<HTMLCanvasElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const outputRef = useRef<HTMLCanvasElement>(null);
  const instanceRef = useRef<ClothInstance | null>(null);
  const fallbackPainterRef = useRef(fallbackPainter);
  fallbackPainterRef.current = fallbackPainter;
  const [initialOptions] = useState(options);
  const [failed, setFailed] = useState(false);
  const hasFallbackPainter = Boolean(fallbackPainter);

  const supported = useSyncExternalStore(
    emptySubscribe,
    supportsHtmlInCanvas,
    () => false,
  );
  const native = supported && !failed;
  const synthetic = hasFallbackPainter && !native && !failed;

  useEffect(() => {
    const source = sourceRef.current;
    const content = contentRef.current;
    const output = outputRef.current;
    if (!source || !content || !output) return;
    instanceRef.current = createCloth(
      {
        source,
        content,
        output,
        paintFallback: hasFallbackPainter
          ? (context, width, height) => fallbackPainterRef.current?.(context, width, height)
          : undefined,
      },
      initialOptions,
    );
    if (!instanceRef.current) setFailed(true);
    return () => {
      instanceRef.current?.destroy();
      instanceRef.current = null;
    };
  }, [hasFallbackPainter, initialOptions, native]);

  useEffect(() => {
    instanceRef.current?.setOptions(options);
  });

  return (
    <div className={className} style={{ position: "relative", ...style }}>
      <canvas
        ref={sourceRef}
        // @ts-expect-error experimental html-in-canvas attribute
        layoutsubtree="true"
        suppressHydrationWarning
        style={
          native
            ? { position: "absolute", inset: 0, width: "100%", height: "100%" }
            : { display: "none" }
        }
      >
        {native ? (
          <div
            ref={contentRef}
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
              overflow: "hidden",
            }}
          >
            {children}
          </div>
        ) : null}
      </canvas>
      {!native ? (
        <div
          ref={contentRef}
          style={
            synthetic
              ? { display: "none" }
              : {
                  position: "relative",
                  width: "100%",
                  height: "100%",
                  overflow: "hidden",
                }
          }
        >
          {children}
        </div>
      ) : null}
      <canvas
        ref={outputRef}
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

export type { ClothFallbackPainter, ClothInstance, ClothOptions };

export default Cloth;
