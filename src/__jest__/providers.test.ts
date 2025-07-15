// src/__tests__/providers.test.ts
import { describe, test, expect, beforeEach, jest } from "@jest/globals";

// Mock @solana/web3.js before any imports
jest.mock("@solana/web3.js", () => ({
  Transaction: {
    from: jest.fn(() => ({ partialSign: jest.fn() })),
  },
  PublicKey: function(address: any) {
    if (typeof address !== "string" || !/^([1-9A-HJ-NP-Za-km-z]{32,44})$/.test(address)) {
      throw new Error("Non-base58 character");
    }
    return { toBase58: () => address };
  },
  Keypair: {
    generate: jest.fn(() => ({
      publicKey: { toBase58: () => "mocked" },
    })),
    fromSecretKey: jest.fn(() => ({
      publicKey: { toBase58: () => "mocked" },
    })),
  },
  sendAndConfirmTransaction: jest.fn(),
  Connection: jest.fn(),
}));

// Mock axios before any imports
jest.mock("axios", () => {
  return {
    get: jest.fn((url: string) => {
      if (url.includes("jup")) {
        return Promise.resolve({ data: { data: [{ price: "1", amount: 1000000 }] } });
      }
      if (url.includes("pumpportal.fun/data-api/real-time/new-tokens")) {
        return Promise.resolve({ data: [{ tokenMint: "TEST", name: "Test", symbol: "TST" }] });
      }
      return Promise.resolve({ data: { data: { price: 100 }, pools: [], pairs: [] } });
    }),
    post: jest.fn((url: string) => {
      if (url.includes("jup")) {
        return Promise.resolve({ data: { swapTransaction: "mockedSwapTx" } });
      }
      if (url.includes("pumpportal.fun/trading-api/swap")) {
        return Promise.resolve({ data: "mockPumpFunSignature" });
      }
      if (url.includes("pumpportal.fun/trading-api/create-token")) {
        return Promise.resolve({ data: "mockCreateSignature" });
      }
      return Promise.resolve({ data: {} });
    }),
  };
});

// Import all provider functions
import { 
  keypair, 
  sendTransaction, 
  getBalance, 
  getParsedTokenAccounts, 
  getMintInfo, 
  getTokenHolders 
} from "../providers/solana";

import { 
  getQuote, 
  buildSwapTransaction 
} from "../providers/jupiter";

import { 
  getTokenInfo, 
  getDexscreenerData 
} from "../providers/dexscreener";

import { 
  getPumpFunRealTimeTokens, 
  pumpFunTrade, 
  createPumpFunToken 
} from "../providers/pumpfun";

import { 
  getPrice as getOrcaPrice 
} from "../providers/orca";

import { 
  getPrice as getRaydiumPrice 
} from "../providers/raydium";

import { 
  calculateRSI, 
  calculateBollingerBands, 
  calculateMACD 
} from "../providers/technicalindicators";

describe("Provider Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Solana Provider", () => {
    test("should have keypair with public key", () => {
      expect(keypair).toBeDefined();
      expect(keypair.publicKey).toBeDefined();
      expect(typeof keypair.publicKey.toBase58).toBe("function");
    });

    test("should have sendTransaction function", () => {
      expect(typeof sendTransaction).toBe("function");
    });

    test("should have getBalance function", () => {
      expect(typeof getBalance).toBe("function");
    });

    test("should have getParsedTokenAccounts function", () => {
      expect(typeof getParsedTokenAccounts).toBe("function");
    });

    test("should have getMintInfo function", () => {
      expect(typeof getMintInfo).toBe("function");
    });

    test("should have getTokenHolders function", () => {
      expect(typeof getTokenHolders).toBe("function");
    });
  });

  describe("Jupiter Provider", () => {
    test("should have getQuote function", () => {
      expect(typeof getQuote).toBe("function");
    });

    test("should have buildSwapTransaction function", () => {
      expect(typeof buildSwapTransaction).toBe("function");
    });

    test("should handle getQuote with valid parameters", async () => {
      const result = await getQuote(
        "So11111111111111111111111111111111111111112",
        "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        1000000,
        50
      );

      expect(result).toBeDefined();
      expect(result).toHaveProperty("price");
      expect(result).toHaveProperty("amount");
    });

    test("should handle buildSwapTransaction with valid parameters", async () => {
      const mockQuote = {
        data: {
          data: [{
            price: "1",
            amount: 1000000,
            data: [{ price: "1" }]
          }]
        }
      };

      const result = await buildSwapTransaction(
        mockQuote,
        "7sS9M8nYwUvBhBDZqUoZ6ZD4C3tX9D5ZJk2LJxD51L1d"
      );

      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
    });
  });

  describe("DexScreener Provider", () => {
    test("should have getTokenInfo function", () => {
      expect(typeof getTokenInfo).toBe("function");
    });

    test("should have getDexscreenerData function", () => {
      expect(typeof getDexscreenerData).toBe("function");
    });

    test("should handle getTokenInfo with valid parameters", async () => {
      const result = await getTokenInfo("solana", "So11111111111111111111111111111111111111112");

      expect(result).toBeDefined();
      if ("error" in result) {
        expect(typeof result.error).toBe("string");
      } else {
        expect(result).toHaveProperty("pairs");
        expect(Array.isArray(result.pairs)).toBe(true);
      }
    });

    test("should handle getDexscreenerData with valid parameters", async () => {
      const result = await getDexscreenerData({
        tokenMint: "So11111111111111111111111111111111111111112",
        symbol: "SOL"
      });

      expect(result).toBeDefined();
      if ("error" in result) {
        expect(typeof result.error).toBe("string");
      } else {
        expect(result).toHaveProperty("priceUsd");
        expect(typeof result.priceUsd).toBe("number");
      }
    });
  });

  describe("PumpFun Provider", () => {
    test("should have getPumpFunRealTimeTokens function", () => {
      expect(typeof getPumpFunRealTimeTokens).toBe("function");
    });

    test("should have pumpFunTrade function", () => {
      expect(typeof pumpFunTrade).toBe("function");
    });

    test("should have createPumpFunToken function", () => {
      expect(typeof createPumpFunToken).toBe("function");
    });

    test("should handle getPumpFunRealTimeTokens", async () => {
      const result = await getPumpFunRealTimeTokens();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        expect(result[0]).toHaveProperty("tokenMint");
        expect(result[0]).toHaveProperty("name");
        expect(result[0]).toHaveProperty("symbol");
      }
    });

    test("should handle pumpFunTrade with valid parameters", async () => {
      const result = await pumpFunTrade({
        tokenMint: "TEST_TOKEN_MINT",
        amount: 1000000,
        action: "buy"
      });

      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
    });

    test("should handle createPumpFunToken with valid parameters", async () => {
      const result = await createPumpFunToken({
        name: "Test Token",
        symbol: "TEST",
        initialSupply: 1000000
      });

      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
    });
  });

  describe("Orca Provider", () => {
    test("should have getPrice function", () => {
      expect(typeof getOrcaPrice).toBe("function");
    });

    test("should handle getPrice with valid parameters", async () => {
      const result = await getOrcaPrice(
        "So11111111111111111111111111111111111111112",
        "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
      );

      expect(result).toBeDefined();
      if (result !== null) {
        expect(typeof result).toBe("number");
        expect(result).toBeGreaterThan(0);
      }
    });
  });

  describe("Raydium Provider", () => {
    test("should have getPrice function", () => {
      expect(typeof getRaydiumPrice).toBe("function");
    });

    test("should handle getPrice with valid parameters", async () => {
      const result = await getRaydiumPrice(
        "So11111111111111111111111111111111111111112",
        "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
      );

      expect(result).toBeDefined();
      if (result !== null) {
        expect(typeof result).toBe("number");
        expect(result).toBeGreaterThan(0);
      }
    });
  });

  describe("Technical Indicators Provider", () => {
    test("should have calculateRSI function", () => {
      expect(typeof calculateRSI).toBe("function");
    });

    test("should have calculateBollingerBands function", () => {
      expect(typeof calculateBollingerBands).toBe("function");
    });

    test("should have calculateMACD function", () => {
      expect(typeof calculateMACD).toBe("function");
    });

    test("should handle calculateRSI with valid parameters", () => {
      const prices = [100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115];
      const result = calculateRSI(prices);

      expect(result).toBeDefined();
      if (result !== null) {
        expect(typeof result).toBe("number");
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThanOrEqual(100);
      }
    });

    test("should handle calculateBollingerBands with valid parameters", () => {
      const prices = [100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120];
      const result = calculateBollingerBands(prices);

      expect(result).toBeDefined();
      if (result !== null) {
        expect(result).toHaveProperty("upper");
        expect(result).toHaveProperty("lower");
        expect(result).toHaveProperty("middle");
        expect(result).toHaveProperty("pb");
        expect(typeof result.upper).toBe("number");
        expect(typeof result.lower).toBe("number");
        expect(typeof result.middle).toBe("number");
        expect(typeof result.pb).toBe("number");
      }
    });

    test("should handle calculateMACD with valid parameters", () => {
      const prices = [100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126];
      const result = calculateMACD(prices);

      expect(result).toBeDefined();
      if (result !== null) {
        expect(result).toHaveProperty("MACD");
        expect(result).toHaveProperty("histogram");
        expect(result).toHaveProperty("signal");
        expect(typeof result.MACD).toBe("number");
        expect(typeof result.histogram).toBe("number");
        expect(typeof result.signal).toBe("number");
      }
    });
  });
}); 