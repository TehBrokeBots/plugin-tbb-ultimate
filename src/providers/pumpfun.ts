// pumpfun.ts imports
import axios from "axios";
import {
  Keypair,
  sendAndConfirmTransaction,
  Transaction,
  Connection,
} from "@solana/web3.js";
import * as dotenv from "dotenv";
dotenv.config();

dotenv.config();

const PUMPFUN_DATA_API = "https://pumpportal.fun/data-api";
const PUMPFUN_TRADING_API = "https://pumpportal.fun/trading-api";

const connection = new Connection(
  process.env.SOLANA_RPC || "https://api.mainnet-beta.solana.com",
  "confirmed",
);
const privateKeyEnv = process.env.PRIVATE_KEY;
let keypair: Keypair;

if (!privateKeyEnv) {
  // For testing purposes, create a dummy keypair if PRIVATE_KEY is not set
  console.warn("PRIVATE_KEY environment variable not set, using dummy keypair for testing");
  keypair = Keypair.generate();
} else {
  const secret = JSON.parse(privateKeyEnv);
  keypair = Keypair.fromSecretKey(Uint8Array.from(secret));
}

export async function getPumpFunData(params: { tokenMint: string }) {
  const resp = await axios.get(
    `${PUMPFUN_DATA_API}/pump-swap/token/${params.tokenMint}`,
  );
  return resp.data;
}

export async function getPumpFunRealTimeTokens() {
  const resp = await axios.get(`${PUMPFUN_DATA_API}/real-time/new-tokens`);
  return resp.data;
}

export async function pumpFunTrade(params: {
  tokenMint: string;
  action: "buy" | "sell";
  amount: number;
}) {
  // This was previously `pumpFunTrade`, rename or alias accordingly
  if (
    !params.tokenMint ||
    !params.amount ||
    !["buy", "sell"].includes(params.action)
  ) {
    throw new Error("Invalid params.");
  }

  const resp = await axios.post(`${PUMPFUN_TRADING_API}/swap`, {
    tokenMint: params.tokenMint,
    side: params.action.toUpperCase(),
    amount: params.amount,
    wallet: keypair.publicKey.toBase58(),
  });

  if (resp.data.transaction) {
    const txn = Transaction.from(Buffer.from(resp.data.transaction, "base64"));
    txn.partialSign(keypair);
    const sig = await sendAndConfirmTransaction(connection, txn, [keypair]);
    return sig;
  } else {
    return resp.data;
  }
}

export async function createPumpFunToken(params: {
  name: string;
  symbol: string;
  initialSupply: number;
}) {
  if (!params.name || !params.symbol || !params.initialSupply) {
    throw new Error("Invalid createPumpFunToken parameters.");
  }
  const resp = await axios.post(`${PUMPFUN_TRADING_API}/create-token`, {
    name: params.name,
    symbol: params.symbol,
    initialSupply: params.initialSupply,
    wallet: keypair.publicKey.toBase58(),
  });

  if (resp.data.transaction) {
    const txn = Transaction.from(Buffer.from(resp.data.transaction, "base64"));
    txn.partialSign(keypair);
    const sig = await sendAndConfirmTransaction(connection, txn, [keypair]);
    return sig;
  } else {
    return resp.data;
  }
}
export const pumpfun = {
  getPumpFunData,
  getPumpFunRealTimeTokens,
  pumpFunTrade,
  createPumpFunToken,
};
