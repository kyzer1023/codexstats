import { aggregateModels } from "../aggregate/models.js";
import { aggregateSources } from "../aggregate/sources.js";
import { aggregateSummary } from "../aggregate/summary.js";
import { CommandContext, CommandOutput } from "../types.js";
import {
  renderModelText,
  renderSourceText,
  renderSummaryText,
} from "../render/text.js";

export function runSummaryCommand(
  context: CommandContext,
): CommandOutput<{
  summary: ReturnType<typeof aggregateSummary>;
  models: ReturnType<typeof aggregateModels>;
  sources: ReturnType<typeof aggregateSources>;
}> {
  const summary = aggregateSummary(context.pricedEvents, context.sessions.length);
  const models = aggregateModels(context.pricedEvents);
  const sources = aggregateSources(context.pricedEvents);

  return {
    data: {
      summary,
      models,
      sources,
    },
    text:
      renderSummaryText(summary) +
      "\nModels\n" +
      renderModelText(models) +
      "\nSources\n" +
      renderSourceText(sources),
  };
}
