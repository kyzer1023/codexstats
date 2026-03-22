import { aggregateSessions } from "../aggregate/sessions.js";
import { CommandContext, CommandOutput } from "../types.js";
import { renderSessionText } from "../render/text.js";

export function runSessionCommand(
  context: CommandContext,
): CommandOutput<ReturnType<typeof aggregateSessions>> {
  const rows = aggregateSessions(context.sessions, context.pricedEvents);
  return {
    data: rows,
    text: renderSessionText(rows),
  };
}
