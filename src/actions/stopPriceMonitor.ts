import { PluginAction } from "../types";

interface StopPriceMonitorResult {
  stopped: boolean;
  message: string;
}

// Reuse the monitorInterval from startPriceMonitorAction
let monitorInterval: ReturnType<typeof setTimeout> | null = null;

/**
 * Stops the price monitor if running.
 */
export const stopPriceMonitorAction: PluginAction<undefined, StopPriceMonitorResult> = {
  name: "STOP_PRICE_MONITOR",
  description: "Stops the price monitor if running.",
  validate: async () => true,
  handler: async () => {
    if (monitorInterval) {
      clearInterval(monitorInterval);
      monitorInterval = null;
      return { stopped: true, message: "Price monitor stopped." };
    }
    return { stopped: false, message: "No active price monitor." };
  },
  examples: [
    {
      input: undefined,
      output: { stopped: true, message: "Price monitor stopped." },
    },
  ],
};

export default stopPriceMonitorAction; 