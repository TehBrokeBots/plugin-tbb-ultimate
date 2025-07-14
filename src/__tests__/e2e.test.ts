// src/__tests__/actions.test.ts
import * as actions from "../actions";
import { setupActionTest, createValidMockTransaction } from "../utils/utils";
import axios from "axios";
import {
  Transaction,
  Connection,
  PublicKey,
  ParsedAccountData,
} from "@solana/web3.js";
import {
  keypair,
  connection,
  sendTransaction,
  getParsedTokenAccounts,
  getBalance,
  getMintInfo,
  getTokenHolders,
  solana,
} from "../providers/solana";
import { getQuote, buildSwapTransaction } from "../providers/jupiter";
import {
  describe,
  test,
  expect,
  jest,
  beforeEach,
  afterEach,
} from "@jest/globals";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock("../providers/solana");

jest.mock("../providers/jupiter", () => ({
  getQuote: jest
    .fn<
      () => Promise<{
        price: string;
        amount: number;
        data: { price: string }[];
      }>
    >()
    .mockResolvedValue({ price: "1", amount: 1000000, data: [{ price: "1" }] }),
  buildSwapTransaction: jest
    .fn<() => Promise<string>>()
    .mockResolvedValue(
      createValidMockTransaction()
        .serialize({ verifySignatures: false })
        .toString("base64"),
    ),
}));

jest.useFakeTimers();

describe("Actions tests", () => {
  const { resetAllMocks } = setupActionTest();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  afterEach(() => {
    resetAllMocks();
    jest.clearAllTimers();
  });

  test("swap returns signature", async () => {
    const signature = await actions.swap({
      inputMint: "So11111111111111111111111111111111111111112",
      outputMint: "TOKEN_MINT",
      amount: 1000000,
    });

    expect(typeof signature).toBe("string");
    expect(signature).toBe("mockSignature");
    expect(getQuote).toHaveBeenCalledWith(
      "So11111111111111111111111111111111111111112",
      "TOKEN_MINT",
      1000000,
      50,
    );
    expect(buildSwapTransaction).toHaveBeenCalled();
    expect(connection.sendRawTransaction).toHaveBeenCalled();
    expect(connection.confirmTransaction).toHaveBeenCalled();
  }, 180000);

  test("buy calls swap", async () => {
    const signature = await actions.buy({
      tokenMint: "TOKEN_MINT",
      amount: 1000,
    });
    expect(signature).toBeDefined();
    expect(signature).toBe("mockSignature");
    expect(getQuote).toHaveBeenCalledWith(
      "So11111111111111111111111111111111111111112",
      "TOKEN_MINT",
      1000,
      50,
    );
    expect(buildSwapTransaction).toHaveBeenCalled();
    expect(connection.sendRawTransaction).toHaveBeenCalled();
  }, 180000);

  test("sell calls swap", async () => {
    const signature = await actions.sell({
      tokenMint: "TOKEN_MINT",
      amount: 1000,
    });
    expect(signature).toBeDefined();
    expect(signature).toBe("mockSignature");
    expect(getQuote).toHaveBeenCalledWith(
      "TOKEN_MINT",
      "So11111111111111111111111111111111111111112",
      1000,
      50,
    );
    expect(buildSwapTransaction).toHaveBeenCalled();
    expect(connection.sendRawTransaction).toHaveBeenCalled();
  }, 180000);

  test("sentimentAnalysis returns data and handles errors", async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { bullish: 60, bearish: 20, neutral: 20 },
    });
    let result = await actions.sentimentAnalysis({ symbol: "SOL" });
    expect(result.bullish).toBe(60);

    mockedAxios.get.mockRejectedValueOnce(new Error("API fail"));
    result = await actions.sentimentAnalysis({ symbol: "SOL" });
    expect(result.bullish).toBe(50);
  }, 180000);
});
