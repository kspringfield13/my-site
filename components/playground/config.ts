export const PLAYGROUND_HEIGHT_THRESHOLDS = [5, 10, 15] as const;
export const PLAYGROUND_LOCAL_SCORES_KEY = "kyle-playground-tower-scores-v1";

export type LeaderboardEntry = {
  id: string;
  name: string;
  height: number;
  achievedAt: string;
};

export type LeaderboardResponse = {
  mode: "global" | "unavailable";
  submissionEnabled: boolean;
  entries: LeaderboardEntry[];
  thresholds: number[];
};
