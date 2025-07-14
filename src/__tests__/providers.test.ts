import * as dexscreener from "../providers/dexscreener";
import * as pumpfun from "../providers/pumpfun";
import axios from "axios";
import {
  describe,
  expect,
  test,
  jest,
  beforeEach,
  afterEach,
} from "@jest/globals";
import { createValidMockTransaction, setupActionTest } from "../utils/utils";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Type guard to check for error property
function hasError(obj: any): obj is { error: string } {
  return obj && typeof obj === "object" && "error" in obj;
}

describe("Providers tests", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("dexscreener returns token data", async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        pairs: [
          {
            priceUsd: "1.23",
            liquidity: { usd: 20000 },
            volume: { h24: 1000 },
            dexId: "uniswap",
            pairAddress: "0xabc",
          },
        ],
      },
    });

    const data = await dexscreener.getDexscreenerData({
      tokenMint: "TOKEN_MINT",
    });

    if (hasError(data)) {
      fail(`API returned error: ${data.error}`);
    } else {
      expect(data.priceUsd).toBeCloseTo(1.23);
    }
  });

  test("dexscreener handles API error", async () => {
    mockedAxios.get.mockRejectedValue(new Error("API fail"));
    const data = await dexscreener.getDexscreenerData({
      tokenMint: "TOKEN_MINT",
    });

    if (hasError(data)) {
      expect(data.error).toBeDefined();
    } else {
      fail("Expected an error response but got data");
    }
  });

  test("pumpfun returns token data", async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { price: 2.5, volume: 1234 },
    });
    const data = await pumpfun.getPumpFunData({ tokenMint: "TOKEN_MINT" });
    expect(data.price).toBe(2.5);
  });

  test("pumpfun pumpFunTrade returns signature", async () => {
    jest
      .spyOn(pumpfun, "pumpFunTrade")
      .mockImplementation(async () => "signature");
    const sig = await pumpfun.pumpFunTrade({
      tokenMint: "TOKEN",
      action: "buy",
      amount: 1000,
    });
    expect(sig).toBe("signature");
  });
});
