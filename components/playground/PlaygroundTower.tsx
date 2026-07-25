"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "@/components/playground/PlaygroundTower.module.css";
import {
  PLAYGROUND_HEIGHT_THRESHOLDS,
  PLAYGROUND_LOCAL_SCORES_KEY,
  type LeaderboardEntry,
  type LeaderboardResponse
} from "@/components/playground/config";
import type { TowerEngineApi } from "@/components/playground/TowerEngine";

type GameState = "idle" | "loading" | "playing" | "collapsed" | "error";

const sortScores = (entries: LeaderboardEntry[]) =>
  [...entries].sort((a, b) => b.height - a.height).slice(0, 3);

function readLocalScores() {
  try {
    const parsed = JSON.parse(localStorage.getItem(PLAYGROUND_LOCAL_SCORES_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return sortScores(
      parsed.filter(
        (entry): entry is LeaderboardEntry =>
          typeof entry?.id === "string" &&
          typeof entry?.name === "string" &&
          typeof entry?.height === "number" &&
          typeof entry?.achievedAt === "string"
      )
    );
  } catch {
    return [];
  }
}

export function PlaygroundTower() {
  const rootRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<TowerEngineApi | null>(null);
  const heightRef = useRef(0);
  const visibleRef = useRef(true);
  const [gameState, setGameState] = useState<GameState>("idle");
  const [height, setHeight] = useState(0);
  const [piece, setPiece] = useState("READY");
  const [reducedMotion, setReducedMotion] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [boardMode, setBoardMode] = useState<"global" | "local">("local");
  const [submissionEnabled, setSubmissionEnabled] = useState(false);
  const [thresholds, setThresholds] = useState<number[]>([...PLAYGROUND_HEIGHT_THRESHOLDS]);
  const [initials, setInitials] = useState("YOU");
  const [scoreSaved, setScoreSaved] = useState(false);
  const [scoreError, setScoreError] = useState("");
  const [announcement, setAnnouncement] = useState(
    "Tower game ready. Start when you want to play."
  );

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReducedMotion(motionQuery.matches);
    updateMotion();
    motionQuery.addEventListener("change", updateMotion);
    return () => motionQuery.removeEventListener("change", updateMotion);
  }, []);

  useEffect(() => {
    let active = true;
    const localScores = readLocalScores();
    setLeaderboard(localScores);

    fetch("/api/playground/leaderboard", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Leaderboard unavailable");
        return (await response.json()) as LeaderboardResponse;
      })
      .then((data) => {
        if (!active) return;
        setThresholds(data.thresholds.length ? data.thresholds : [...PLAYGROUND_HEIGHT_THRESHOLDS]);
        if (data.mode === "global") {
          setBoardMode("global");
          setSubmissionEnabled(data.submissionEnabled);
          setLeaderboard(sortScores(data.entries));
        }
      })
      .catch(() => {
        // Device-local scores are the explicit offline/development fallback.
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting;
        engineRef.current?.setPaused(!entry.isIntersecting || document.hidden);
      },
      { threshold: 0.06 }
    );
    const onVisibility = () =>
      engineRef.current?.setPaused(!visibleRef.current || document.hidden);
    observer.observe(root);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  useEffect(
    () => () => {
      engineRef.current?.destroy();
      engineRef.current = null;
    },
    []
  );

  const persistScore = useCallback(
    async (score: number, playerInitials: string) => {
      if (score <= 0.05) return;
      const normalizedInitials = playerInitials.trim().toUpperCase();
      if (!/^[A-Z0-9]{3}$/.test(normalizedInitials)) {
        setScoreError("Use exactly 3 letters or numbers.");
        return;
      }
      setScoreError("");
      const entry: LeaderboardEntry = {
        id: crypto.randomUUID(),
        name: normalizedInitials,
        height: Number(score.toFixed(1)),
        achievedAt: new Date().toISOString()
      };

      if (boardMode === "global" && submissionEnabled) {
        try {
          const response = await fetch("/api/playground/leaderboard", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ initials: entry.name, height: entry.height })
          });
          if (!response.ok) {
            const errorBody = (await response.json().catch(() => null)) as { error?: string } | null;
            throw new Error(errorBody?.error ?? "Score submission failed");
          }
          const data = (await response.json()) as LeaderboardResponse;
          setLeaderboard(sortScores(data.entries));
          setScoreSaved(true);
          return;
        } catch (error) {
          setScoreError(error instanceof Error ? error.message : "Score submission failed.");
          return;
        }
      }

      const next = sortScores([...readLocalScores(), entry]);
      localStorage.setItem(PLAYGROUND_LOCAL_SCORES_KEY, JSON.stringify(next));
      setLeaderboard(next);
      setScoreSaved(true);
    },
    [boardMode, submissionEnabled]
  );

  const startGame = useCallback(async () => {
    if (gameState === "loading" || gameState === "playing") return;
    if (engineRef.current) {
      engineRef.current.restart();
      engineRef.current.setPaused(!visibleRef.current || document.hidden);
      heightRef.current = 0;
      setHeight(0);
      setScoreSaved(false);
      setScoreError("");
      setGameState("playing");
      setAnnouncement("New run started.");
      rootRef.current?.focus();
      return;
    }

    const mount = mountRef.current;
    if (!mount) return;
    setGameState("loading");
    setAnnouncement("Loading the 3D physics arena.");
    try {
      const { createTowerEngine } = await import("@/components/playground/TowerEngine");
      if (!mountRef.current) return;
      engineRef.current = await createTowerEngine({
        mount,
        reducedMotion,
        onHeight: (nextHeight) => {
          heightRef.current = nextHeight;
          setHeight(nextHeight);
        },
        onPiece: setPiece,
        onCollapse: (finalHeight) => {
          heightRef.current = finalHeight;
          setHeight(finalHeight);
          setGameState("collapsed");
          setScoreSaved(false);
          setScoreError("");
          setAnnouncement(`Tower collapsed at ${finalHeight.toFixed(1)} meters. Replay is ready.`);
        },
        onReady: () => {
          setGameState("playing");
          setAnnouncement(
            "Arena ready. Drag to position, right-drag to orbit, scroll to zoom, then rotate or drop."
          );
        }
      });
      engineRef.current.setPaused(!visibleRef.current || document.hidden);
      rootRef.current?.focus();
    } catch (error) {
      console.error("Tower game failed to initialize", error);
      setGameState("error");
      setAnnouncement("The 3D arena could not start on this device.");
    }
  }, [gameState, reducedMotion]);

  const stopGame = useCallback(() => {
    engineRef.current?.destroy();
    engineRef.current = null;
    heightRef.current = 0;
    setHeight(0);
    setGameState("idle");
    setPiece("READY");
    setAnnouncement("Game stopped. Start again whenever you like.");
  }, []);

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (gameState !== "playing") return;
    const engine = engineRef.current;
    if (!engine) return;
    const amount = event.shiftKey ? 0.42 : 0.22;
    if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") engine.move(-amount, 0);
    else if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") engine.move(amount, 0);
    else if (event.key === "ArrowUp" || event.key.toLowerCase() === "w") engine.move(0, -amount);
    else if (event.key === "ArrowDown" || event.key.toLowerCase() === "s") engine.move(0, amount);
    else if (event.key.toLowerCase() === "q") engine.rotate(-1);
    else if (event.key.toLowerCase() === "e" || event.key.toLowerCase() === "r") engine.rotate(1);
    else if (event.key === " " || event.key === "Enter") engine.drop();
    else return;
    event.preventDefault();
  };

  const meterMax = useMemo(
    () => Math.max(18, ...thresholds.map((value) => value + 2), height + 2),
    [height, thresholds]
  );
  const closeThreshold = thresholds.find(
    (threshold) => Math.abs(height - threshold) <= 0.8 || (height >= threshold && height < threshold + 1.1)
  );

  return (
    <div
      ref={rootRef}
      className={styles.game}
      data-state={gameState}
      data-reduced-motion={reducedMotion ? "true" : "false"}
      tabIndex={0}
      onKeyDown={onKeyDown}
      aria-label="Tower 01 physics game"
    >
      <div className={styles.topBar}>
        <div>
          <span className={styles.gameIndex}>EXPERIMENT 01</span>
          <h3>TOWER / 01</h3>
        </div>
        <div className={styles.heightReadout} aria-live="polite">
          <span>HEIGHT</span>
          <strong>{height.toFixed(1)} m</strong>
        </div>
      </div>

      <div className={styles.arena}>
        <div ref={mountRef} className={styles.canvasMount} aria-hidden={gameState === "idle"} />

        <div className={styles.gridBackdrop} aria-hidden="true" />

        {gameState === "idle" && (
          <div className={styles.startPanel}>
            <span className={styles.previewGlyph} aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <p>Stack randomized forms. Gravity keeps the score honest.</p>
            <button type="button" className={styles.primaryControl} onClick={startGame}>
              Start tower
            </button>
            <a href="#skills" className={styles.skipLink}>
              Skip to Skills
            </a>
          </div>
        )}

        {gameState === "loading" && (
          <div className={styles.loadingPanel} role="status">
            <span className={styles.loader} aria-hidden="true" />
            Initializing physics…
          </div>
        )}

        {gameState === "error" && (
          <div className={styles.startPanel} role="alert">
            <p>The WebGL arena is unavailable here. The rest of the page is unaffected.</p>
            <button type="button" className={styles.secondaryControl} onClick={() => setGameState("idle")}>
              Try again
            </button>
            <a href="#skills" className={styles.skipLink}>
              Continue to Skills
            </a>
          </div>
        )}

        {gameState === "collapsed" && (
          <div className={styles.collapsePanel} role="status" aria-live="polite">
            <span>STRUCTURE LOST</span>
            <strong>{height.toFixed(1)} m</strong>
            {!scoreSaved ? (
              <form
                className={styles.scoreForm}
                onSubmit={(event) => {
                  event.preventDefault();
                  void persistScore(heightRef.current, initials);
                }}
              >
                <label>
                  <span>INITIALS</span>
                  <input
                    value={initials}
                    onChange={(event) =>
                      setInitials(
                        event.target.value
                          .toUpperCase()
                          .replace(/[^A-Z0-9]/g, "")
                          .slice(0, 3)
                      )
                    }
                    inputMode="text"
                    autoComplete="off"
                    maxLength={3}
                    aria-describedby={scoreError ? "tower-score-error" : undefined}
                  />
                </label>
                <button type="submit" className={styles.secondaryControl}>
                  {boardMode === "global" ? "Save global" : "Save local"}
                </button>
              </form>
            ) : (
              <small>Score saved {boardMode === "global" ? "globally" : "on this device"}</small>
            )}
            {scoreError && (
              <small id="tower-score-error" className={styles.scoreError} role="alert">
                {scoreError}
              </small>
            )}
            <button type="button" className={styles.primaryControl} onClick={startGame}>
              Build again
            </button>
          </div>
        )}

        <aside className={styles.leaderboard} aria-label={`${boardMode} top three tower scores`}>
          <div className={styles.boardHeader}>
            <span>TOP 3</span>
            <span className={styles.boardMode}>{boardMode === "global" ? "GLOBAL" : "THIS DEVICE"}</span>
          </div>
          <ol>
            {[0, 1, 2].map((rank) => {
              const entry = leaderboard[rank];
              return (
                <li key={entry?.id ?? `empty-${rank}`}>
                  <span>{String(rank + 1).padStart(2, "0")}</span>
                  <b>{entry?.name ?? "—"}</b>
                  <em>{entry ? `${entry.height.toFixed(1)}m` : "—"}</em>
                </li>
              );
            })}
          </ol>
          {boardMode === "local" && <p>Global board not connected</p>}
        </aside>

        <div className={styles.heightMeter} aria-hidden="true">
          <span className={styles.meterRail}>
            <i style={{ height: `${Math.min(100, (height / meterMax) * 100)}%` }} />
            {thresholds.map((threshold) => (
              <b
                key={threshold}
                className={closeThreshold === threshold ? styles.thresholdActive : undefined}
                style={{ bottom: `${Math.min(96, (threshold / meterMax) * 100)}%` }}
              >
                {threshold}m
              </b>
            ))}
          </span>
        </div>

        {(gameState === "playing" || gameState === "collapsed") && (
          <div className={styles.pieceBadge}>
            <span>NEXT FORM</span>
            <strong>{piece}</strong>
          </div>
        )}
      </div>

      <div className={styles.controlDeck}>
        <div className={styles.movePad} aria-label="Position piece">
          <button
            type="button"
            onClick={() => engineRef.current?.move(-0.34, 0)}
            aria-label="Move left"
            disabled={gameState !== "playing"}
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => engineRef.current?.move(0, -0.34)}
            aria-label="Move away"
            disabled={gameState !== "playing"}
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => engineRef.current?.move(0, 0.34)}
            aria-label="Move closer"
            disabled={gameState !== "playing"}
          >
            ↓
          </button>
          <button
            type="button"
            onClick={() => engineRef.current?.move(0.34, 0)}
            aria-label="Move right"
            disabled={gameState !== "playing"}
          >
            →
          </button>
        </div>
        <p>
          <span className={styles.desktopHint}>
            Drag: position · Right-drag: orbit · Scroll: zoom · Q/E: rotate · Space: drop
          </span>
          <span className={styles.mobileHint}>1 finger places · 2 fingers orbit</span>
        </p>
        <div className={styles.actionControls}>
          <button
            type="button"
            className={styles.secondaryControl}
            onClick={() => engineRef.current?.rotate(1)}
            disabled={gameState !== "playing"}
          >
            Rotate
          </button>
          <button
            type="button"
            className={styles.primaryControl}
            onClick={() => engineRef.current?.drop()}
            disabled={gameState !== "playing"}
          >
            Drop
          </button>
        </div>
        {gameState !== "idle" && (
          <button type="button" className={styles.stopControl} onClick={stopGame}>
            Stop game
          </button>
        )}
      </div>

      <p className={styles.srOnly} aria-live="polite">
        {announcement}
      </p>
    </div>
  );
}
