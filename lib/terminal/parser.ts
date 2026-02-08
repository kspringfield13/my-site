import type { ParsedCommandResult, TerminalResult } from "@/lib/terminal/types";

const tokenPattern = /(?:[^\s\"]+|\"[^\"]*\")+/g;

function buildError(description: string): TerminalResult {
  return {
    cards: [
      {
        id: "parse:error",
        kind: "error",
        title: "Command parse error",
        description
      }
    ]
  };
}

export function parseTerminalInput(raw: string): ParsedCommandResult {
  const input = raw.trim();
  if (!input) {
    return {
      error: buildError('No command entered. Try "help".')
    };
  }

  const matches = input.match(tokenPattern);
  if (!matches || matches.length === 0) {
    return {
      error: buildError("Unable to parse command.")
    };
  }

  const tokens = matches.map((token) => token.replace(/^\"|\"$/g, ""));
  const [nameToken, ...rest] = tokens;
  const name = nameToken.toLowerCase();
  const args: string[] = [];
  const flags: Record<string, string | boolean> = {};

  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index];
    if (token.startsWith("--")) {
      const key = token.slice(2).toLowerCase();
      if (!key) {
        return {
          error: buildError(`Invalid flag syntax near "${token}".`)
        };
      }

      const next = rest[index + 1];
      if (next && !next.startsWith("--")) {
        flags[key] = next;
        index += 1;
      } else {
        flags[key] = true;
      }
    } else {
      args.push(token);
    }
  }

  return {
    raw: input,
    name,
    args,
    flags
  };
}
