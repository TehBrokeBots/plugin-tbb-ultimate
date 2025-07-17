import { PluginAction } from "../types";

interface StopAutoBuySellResult {
  stopped: boolean;
  message: string;
}

let autoBuySellInterval: ReturnType<typeof setTimeout> | null = null;

/**
 * Stops the automated buy/sell task if running.
 */
export const stopAutoBuySellAction: PluginAction<undefined, StopAutoBuySellResult> = {
  name: "STOP_AUTO_BUY_SELL",
  description: "Stops the automated buy/sell task if running.",
  validate: async () => true,
  handler: async () => {
    if (autoBuySellInterval) {
      clearInterval(autoBuySellInterval);
      autoBuySellInterval = null;
      return { stopped: true, message: "Automated buy/sell stopped" };
    }
    return { stopped: false, message: "No active automated buy/sell task" };
  },
  examples: [
    {
      input: undefined,
      output: { stopped: true, message: "Automated buy/sell stopped" },
    },
  ],
};

export default stopAutoBuySellAction; 