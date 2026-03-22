import { aggregateMonthly } from "../aggregate/monthly.js";
import { CommandContext, CommandOutput } from "../types.js";
import { renderBucketText } from "../render/text.js";

export function runMonthlyCommand(
  context: CommandContext,
): CommandOutput<ReturnType<typeof aggregateMonthly>> {
  const rows = aggregateMonthly(context.pricedEvents);
  return {
    data: rows,
    text: renderBucketText(rows, "Month"),
  };
}
