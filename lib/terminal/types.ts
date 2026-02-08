import type { NowEntry, ProjectMeta, ResumeDerived, SearchDoc } from "@/lib/types";

export type TerminalCardKind = "info" | "error" | "success" | "result" | "list";

export interface TerminalAction {
  label: string;
  href?: string;
  sectionId?: string;
  resultId?: string;
  command?: string;
}

export interface TerminalResultCard {
  id: string;
  kind: TerminalCardKind;
  title: string;
  description: string;
  meta?: string;
  actions?: TerminalAction[];
}

export interface TerminalResult {
  cards: TerminalResultCard[];
  clear?: boolean;
  searchResults?: SearchDoc[];
  navigateTo?: string;
  navigateSection?: string;
}

export interface ParsedCommand {
  raw: string;
  name: string;
  args: string[];
  flags: Record<string, string | boolean>;
}

export interface ParsedFailure {
  error: TerminalResult;
}

export type ParsedCommandResult = ParsedCommand | ParsedFailure;

export interface TerminalDataContext {
  projects: ProjectMeta[];
  nowEntries: NowEntry[];
  resume: ResumeDerived;
  searchDocs: SearchDoc[];
  contact: {
    email: string;
    github: string;
    linkedin: string;
  };
}

export interface TerminalExecutionContext extends TerminalDataContext {
  lastSearchResults: SearchDoc[];
}

export type TerminalCommandHandler = (ctx: TerminalExecutionContext, parsed: ParsedCommand) => TerminalResult;

export interface TerminalCommandDescriptor {
  name: string;
  description: string;
  usage: string;
  examples: string[];
  handler: TerminalCommandHandler;
}
