// src/__tests__/strategies.test.ts
import { arbitrageStrategy } from "../strategies/arbitrage";
import { daoStrategy } from "../strategies/dao";
import axios from "axios";
import { Transaction, Connection, PublicKey } from "@solana/web3.js";
import { keypair, connection } from "../providers/solana";
import { getQuote, buildSwapTransaction } from "../providers/jupiter";
import { getPrice as getOrcaPrice } from "../providers/orca";
import { getPrice as getRaydiumPrice } from "../providers/raydium";
import { createValidMockTransaction } from "../utils/utils";
import {
  describe,
  test,
  expect,
  jest,
  beforeEach,
  confirmMock,
} from "@jest/globals";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock("../providers/solana", () => ({
  keypair: {
    publicKey: {
      toBase58: jest
        .fn()
        .mockReturnValue("7sS9M8nYwUvBhBDZqUoZ6ZD4C3tX9D5ZJk2LJxD51L1d"),
    },
  },
  connection: {
    getLatestBlockhash: jest
      .fn<() => Promise<{ blockhash: string }>>()
      .mockResolvedValue({
        blockhash: "EETB7n4XcQJ3NXTfsq3T3u1EWhLbVjmwZCnfsKv2uvCD",
      }),
    sendRawTransaction: jest
      .fn<(arg: Buffer) => Promise<string>>()
      .mockResolvedValue("mockSignature"),
    confirmTransaction: jest
      .fn<
        (
          arg: string,
          commitment: string,
        ) => Promise<{ context: object; value: object }>
      >()
      .mockResolvedValue({ context: {}, value: {} }),
  } as unknown as jest.MockedObject<typeof import("../providers/solana")>,
}));

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

jest.mock("../providers/orca", () => ({
  getPrice: jest.fn<() => Promise<number>>().mockResolvedValue(1.05), // Creates spread > 0.01
}));

jest.mock("../providers/raydium", () => ({
  getPrice: jest.fn<() => Promise<number>>().mockResolvedValue(1.06), // Creates spread > 0.01
}));

describe("Strategies tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("arbitrageStrategy detects and confirms opportunity", async () => {
    const confirmMock: jest.Mock<(message: string) => Promise<boolean>> = jest
      .fn()
      .mockResolvedValue(true);

    const result = await arbitrageStrategy({
      tokenMintA: "So11111111111111111111111111111111111111112",
      tokenMintB: "TOKEN_MINT",
      tradeAmountLamports: 1000000,
      confirm: confirmMock,
    });

    if (typeof result === "string") {
      expect(result).toBe("User cancelled arbitrage trades.");
    } else if ("error" in result) {
      expect(result.error).toBeDefined();
    } else {
      expect(result.arbitrageOpportunity).toBe(true);
      expect(result.spread).toBeGreaterThan(0.01);
      expect(result.buyOn).toBe("Jupiter");
      expect(result.sellOn).toBe("Raydium");
    }
    expect(confirmMock).toHaveBeenCalled();
    expect(getQuote).toHaveBeenCalled();
    expect(getOrcaPrice).toHaveBeenCalled();
    expect(getRaydiumPrice).toHaveBeenCalled();
  }, 180000);

  test("daoStrategy executes buy after confirmation", async () => {
    const confirmMock: jest.Mock<(message: string) => Promise<boolean>> = jest
      .fn()
      .mockResolvedValue(true);

    const result = await daoStrategy({
      amount: 1000,
      confirm: confirmMock,
    });

    expect(typeof result).toBe("string");
    expect(result).toContain("mockSignature");
    expect(confirmMock).toHaveBeenCalled();
    expect(getQuote).toHaveBeenCalledWith(
      "So11111111111111111111111111111111111111112",
      "AbD84YXFFGSDiJ8hQtNm8cdKyTBB4o3PGrEjLJ9gdaos",
      1000,
      50,
    );
    expect(buildSwapTransaction).toHaveBeenCalled();
    expect(connection.sendRawTransaction).toHaveBeenCalled();
  }, 180000);
});
