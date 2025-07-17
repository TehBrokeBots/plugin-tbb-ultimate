import { PluginAction } from "../types";
import { getTokenInfo } from "../providers/dexscreener";
import { getMintInfo, getTokenHolders as solanaGetTokenHolders } from "../providers/solana";

interface ScamCheckParams {
  chain: string;
  address: string;
  symbol?: string;
  plugins?: Record<string, any>;
}

interface ScamCheckResult {
  message: string;
  risk: string;
  reasons: string[];
  scamMentions: number;
}

function isDexscreenerData(data: any): data is { pairs: Array<any> } {
  return data && Array.isArray(data.pairs);
}

/**
 * Checks a token for scam risk factors using Dexscreener and Solana data.
 */
export const scamCheckAction: PluginAction<ScamCheckParams, ScamCheckResult> = {
  name: "SCAM_CHECK",
  description: "Checks a token for scam risk factors using Dexscreener and Solana data.",
  validate: async (params: ScamCheckParams) => {
    if (!params.chain || !params.address) throw new Error("Chain and address are required.");
    return true;
  },
  handler: async (runtime: any, ctx: ScamCheckParams) => {
    const { chain, address, symbol, plugins } = ctx;
    const data = await getTokenInfo(chain, address);
    if (!isDexscreenerData(data)) {
      throw new Error(`Failed to get token info: ${data.error ?? "unknown error"}`);
    }
    const pair = data.pairs[0];
    let risk = "unknown";
    const reasons: string[] = [];
    if (pair) {
      if (pair.verified === false) {
        risk = "high";
        reasons.push("Token is not verified on Dexscreener.");
      }
      if ((pair.liquidity?.usd ?? 0) < 1000) {
        risk = "high";
        reasons.push("Low liquidity.");
      }
      if ((pair.txns?.h24 ?? 0) < 10) {
        risk = risk === "high" ? risk : "medium";
        reasons.push("Low trading activity.");
      }
      if ((pair.ageDays ?? 9999) < 3) {
        risk = risk === "high" ? risk : "medium";
        reasons.push("Token is very new.");
      }
    }
    let mintInfo, holders;
    try {
      mintInfo = await getMintInfo(address);
      if (
        mintInfo.mintAuthority &&
        mintInfo.mintAuthority !== null &&
        mintInfo.mintAuthority !== "" &&
        mintInfo.mintAuthority !== "11111111111111111111111111111111"
      ) {
        risk = "high";
        reasons.push("Mint authority is not renounced.");
      }
      holders = await solanaGetTokenHolders(address);
      if (holders.length && mintInfo.supply) {
        const supply = Number(mintInfo.supply) / 10 ** (mintInfo.decimals ?? 0);
        const largest = holders[0];
        const largestPct = (Number(largest.amount) / supply) * 100;
        if (largestPct > 30) {
          risk = "high";
          reasons.push("Single wallet holds more than 30% of supply.");
        } else if (largestPct > 10) {
          risk = risk === "high" ? risk : "medium";
          reasons.push("Single wallet holds more than 10% of supply.");
        }
      }
    } catch (e) {
      reasons.push(`Mint/holder check failed: ${(e as Error).message}`);
    }
    let scamMentions = 0;
    if (symbol && plugins && plugins["elizaos/plugin-twitter"]) {
      try {
        const tweets = await plugins["elizaos/plugin-twitter"].searchTweets({
          q: `${symbol} scam`,
          count: 20,
        });
        scamMentions = tweets.filter((t: any) =>
          /scam|rug|fraud|hack/i.test(t.text),
        ).length;
        if (scamMentions > 2) {
          risk = "high";
          reasons.push("Multiple scam-related Twitter mentions.");
        }
      } catch (e) {
        reasons.push(`Twitter check failed: ${(e as Error).message}`);
      }
    }
    const lockers = [
      "11111111111111111111111111111111",
      "4ckmDgGz5qQh6vny1tRQAMf6Tx5Rk8QeYv1GZ6tMCp7y",
    ];
    if (holders && holders.length > 0) {
      const largest = holders[0];
      if (lockers.includes(largest.address)) {
        reasons.push("Liquidity appears to be locked.");
      } else {
        reasons.push("Liquidity may not be locked.");
      }
    }
    if (risk === "unknown") risk = "low";
    return {
      message: "Scam check completed.",
      risk,
      reasons,
      scamMentions,
    };
  },
  examples: [
    {
      input: { chain: "solana", address: "TokenAddress..." },
      output: { message: "Scam check completed.", risk: "low", reasons: [], scamMentions: 0 },
    },
  ],
};

export default scamCheckAction; 