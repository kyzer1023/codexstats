import { aggregateDaily } from "../aggregate/daily.js";
import { CommandContext, CommandOutput } from "../types.js";
import { renderBucketText, renderTitleBox } from "../render/text.js";

export function runDailyCommand(
  context: CommandContext,
): CommandOutput<ReturnType<typeof aggregateDaily>> {
  const rows = aggregateDaily(context.pricedEvents);
  return {
    data: rows,
    text:
      renderTitleBox(
        `Codex Token Usage Report - Daily (Timezone: ${context.options.timezone})`,
      ) +
      "\n" +
      renderBucketText(rows, "Date", context.options.compact),
  };
}
