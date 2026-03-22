import { aggregateSessions } from "../aggregate/sessions.js";
import { CommandContext, CommandOutput } from "../types.js";
import { renderSessionText, renderTitleBox } from "../render/text.js";

export function runSessionCommand(
  context: CommandContext,
): CommandOutput<ReturnType<typeof aggregateSessions>> {
  const rows = aggregateSessions(context.sessions, context.pricedEvents);
  return {
    data: rows,
    text:
      renderTitleBox(
        `Codex Token Usage Report - Sessions (Timezone: ${context.options.timezone})`,
      ) +
      "\n" +
      renderSessionText(rows, context.options.compact),
  };
}
