import { predict } from "../evaluators/predict";
import * as dexscreener from "../providers/dexscreener";
import * as actions from "../actions";
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
jest.mock("../providers/dexscreener");
jest.mock("../actions");

describe("Evaluators", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  const fullMockData = {
    priceUsd: 10,
    liquidityUsd: null,
    volume24h: null,
    dexId: "dummy-dex",
    pairAddress: "dummy-address",
    priceChart: [],
    verified: undefined,
    txnsH24: undefined,
    ageDays: undefined,
    raw: { pairs: [] },
  };
  test("predict function returns valid results", async () => {
    (
      dexscreener.getDexscreenerData as jest.MockedFunction<
        typeof dexscreener.getDexscreenerData
      >
    ).mockResolvedValue(fullMockData);

    (
      actions.sentimentAnalysis as jest.MockedFunction<
        typeof actions.sentimentAnalysis
      >
    ).mockResolvedValue({ bullish: 70, bearish: 10, neutral: 20 });

    const result = await predict({ tokenMint: "TOKEN_MINT", symbol: "SYM" });
    expect(["LONG", "SHORT", "HOLD"]).toContain(result.prediction);
    expect(typeof result.confidence).toBe("number");
  }, 20000); // 20 seconds timeout
});
