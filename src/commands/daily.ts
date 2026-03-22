import { aggregateDaily } from "../aggregate/daily.js";
import { CommandContext, CommandOutput } from "../types.js";
import { renderBucketText } from "../render/text.js";

export function runDailyCommand(
  context: CommandContext,
): CommandOutput<ReturnType<typeof aggregateDaily>> {
  const rows = aggregateDaily(context.pricedEvents);
  return {
    data: rows,
    text: renderBucketText(rows, "Date"),
  };
}
