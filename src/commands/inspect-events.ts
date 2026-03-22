import { CommandContext, CommandOutput } from "../types.js";
import { renderEventsText } from "../render/text.js";

export function runInspectEventsCommand(
  context: CommandContext,
): CommandOutput<typeof context.pricedEvents> {
  return {
    data: context.pricedEvents,
    text: renderEventsText(context.pricedEvents),
  };
}
