import { parseTerminalInput } from "@/lib/terminal/parser";
import { runUnknownCommand, terminalCommandRegistry } from "@/lib/terminal/registry";
import type {
  ParsedCommand,
  TerminalExecutionContext,
  TerminalResult,
  TerminalDataContext
} from "@/lib/terminal/types";

function toExecutionContext(data: TerminalDataContext, lastSearchResults: TerminalExecutionContext["lastSearchResults"]): TerminalExecutionContext {
  return {
    ...data,
    lastSearchResults
  };
}

export function executeTerminalCommand(
  rawInput: string,
  data: TerminalDataContext,
  lastSearchResults: TerminalExecutionContext["lastSearchResults"]
): TerminalResult {
  const parsed = parseTerminalInput(rawInput);
  if ("error" in parsed) {
    return parsed.error;
  }

  const entry = terminalCommandRegistry[parsed.name as keyof typeof terminalCommandRegistry];
  if (!entry) {
    return runUnknownCommand(parsed.name);
  }

  return entry.handler(toExecutionContext(data, lastSearchResults), parsed as ParsedCommand);
}
