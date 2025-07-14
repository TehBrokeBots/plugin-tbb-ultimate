import * as actions from "../actions";
import { setupActionTest } from "../utils/utils";
import axios from "axios";
import { Transaction, PublicKey } from "@solana/web3.js";
import {
  expect,
  test,
  describe,
  jest,
  afterEach,
  beforeEach,
} from "@jest/globals";

const mockSignature = "mockSignature";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock("../providers/solana", () => {
  const { PublicKey, Transaction } = jest.requireActual("@solana/web3.js");
  return {
    connection: {
      getLatestBlockhash: jest
        .fn()
        .mockResolvedValue({ blockhash: "mockBlockhash" }),
      sendRawTransaction: jest.fn().mockResolvedValue(mockSignature),
      confirmTransaction: jest
        .fn()
        .mockResolvedValue({ context: {}, value: {} }),
      getBalance: jest.fn().mockResolvedValue(1000000000),
      getParsedAccountInfo: jest.fn().mockResolvedValue({
        context: { slot: 12345 },
        value: {
          data: {
            parsed: {
              info: { mintAuthority: null, supply: "1000000", decimals: 9 },
            },
          },
          executable: false,
          lamports: 0,
          owner: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
          rentEpoch: 0,
        },
      }),
    },
    keypair: { publicKey: new PublicKey("11111111111111111111111111111111") },
    sendTransaction: jest.fn().mockResolvedValue(mockSignature),
    getParsedTokenAccounts: jest.fn().mockResolvedValue([]),
    getBalance: jest.fn().mockResolvedValue(1000000000),
    getMintInfo: jest.fn().mockResolvedValue({
      mintAuthority: null,
      supply: "1000000",
      decimals: 9,
    }),
    getTokenHolders: jest.fn().mockResolvedValue([]),
  };
});

jest.mock("../providers/jupiter", () => {
  const { Transaction, PublicKey } = jest.requireActual("@solana/web3.js");
  const validTxn = new Transaction();
  validTxn.recentBlockhash = "dummyRecentBlockhash";
  validTxn.feePayer = new PublicKey("11111111111111111111111111111111");
  validTxn.add({
    keys: [],
    programId: new PublicKey("11111111111111111111111111111111"),
    data: Buffer.alloc(0),
  });
  return {
    getQuote: jest.fn().mockResolvedValue({
      price: "1",
      amount: 1000000,
      data: [{ price: "1" }],
    }),
    buildSwapTransaction: jest
      .fn()
      .mockResolvedValue(
        validTxn.serialize({ verifySignatures: false }).toString("base64"),
      ),
  };
});

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
  }, 180000);

  test("buy calls swap", async () => {
    const signature = await actions.buy({
      tokenMint: "TOKEN_MINT",
      amount: 1000,
    });
    expect(signature).toBeDefined();
    expect(signature).toBe("mockSignature");
  }, 180000);

  test("sell calls swap", async () => {
    const signature = await actions.sell({
      tokenMint: "TOKEN_MINT",
      amount: 1000,
    });
    expect(signature).toBeDefined();
    expect(signature).toBe("mockSignature");
  }, 180000);

  test("sentimentAnalysis returns data and handles errors", async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { bullish: 60, bearish: 20, neutral: 20 },
    });
    let result = await actions.sentimentAnalysis({ symbol: "SOL" });
    expect(result).toMatchObject({ bullish: 60, bearish: 20, neutral: 20 });

    mockedAxios.get.mockRejectedValueOnce(new Error("API fail"));
    result = await actions.sentimentAnalysis({ symbol: "SOL" });
    expect(result.bullish).toBe(50);
  }, 180000);
});
