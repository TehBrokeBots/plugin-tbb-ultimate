// src/providers/solana.ts
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  ParsedAccountData,
} from "@solana/web3.js";
import axios from "axios";
import * as dotenv from "dotenv";

dotenv.config();

const RPC_ENDPOINT =
  process.env.SOLANA_RPC || "https://api.mainnet-beta.solana.com";
export const connection = new Connection(RPC_ENDPOINT, "confirmed");

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

export { keypair };

export async function sendTransaction(txn: Transaction): Promise<string> {
  if (txn.instructions.length === 0) {
    throw new Error("Transaction has no instructions");
  }
  txn.recentBlockhash = (
    await connection.getLatestBlockhash("confirmed")
  ).blockhash;
  txn.feePayer = keypair.publicKey;
  txn.partialSign(keypair);
  const signature = await connection.sendRawTransaction(
    txn.serialize({ verifySignatures: false }),
  );
  await connection.confirmTransaction(signature, "confirmed");
  return signature;
}

export async function getParsedTokenAccounts(ownerPubkey: PublicKey) {
  const res = await connection.getParsedTokenAccountsByOwner(ownerPubkey, {
    programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
  });
  return res.value;
}

export async function getBalance(pubkey: PublicKey): Promise<number> {
  return connection.getBalance(pubkey, "confirmed");
}

export async function getMintInfo(tokenMint: string): Promise<{
  mintAuthority: string | null;
  supply: string;
  decimals: number;
}> {
  const mintPubkey = new PublicKey(tokenMint);
  const accountInfo = await connection.getParsedAccountInfo(
    mintPubkey,
    "confirmed",
  );
  if (!accountInfo.value) throw new Error("Mint account not found");

  const parsed = (accountInfo.value.data as ParsedAccountData).parsed;
  const info = parsed.info;

  return {
    mintAuthority: info.mintAuthority ?? null,
    supply: info.supply,
    decimals: info.decimals,
  };
}

export async function getTokenHolders(
  tokenMint: string,
): Promise<{ address: string; amount: string }[]> {
  try {
    const url = `https://public-api.solscan.io/token/holders?tokenAddress=${tokenMint}&limit=10`;
    const response = await axios.get(url);
    if (!response.data || !response.data.data) return [];

    return response.data.data.map((holder: any) => ({
      address: holder.owner,
      amount: holder.amount,
    }));
  } catch {
    return [];
  }
}

export const solana = {
  connection,
  keypair,
  sendTransaction,
  getParsedTokenAccounts,
  getBalance,
  getMintInfo,
  getTokenHolders,
};
