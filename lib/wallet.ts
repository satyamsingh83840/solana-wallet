"use client";

import bip39 from "bip39";
import { derivePath } from "ed25519-hd-key";
import {
  Keypair,
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

export type NetworkType = "mainnet" | "devnet";

// pick RPC by network
export const getConnection = (network: NetworkType) => {
  const url =
    network === "mainnet"
      ? process.env.NEXT_PUBLIC_ALCHEMY_MAINNET!
      : process.env.NEXT_PUBLIC_ALCHEMY_DEVNET!;

  return new Connection(url, "confirmed");
};

// generate mnemonic
export const generateMnemonic = () => {
  try {
    const mnemonic = bip39.generateMnemonic();
    console.log("Generated:", mnemonic);
    return mnemonic;
  } catch (err) {
    console.error("Mnemonic error:", err);
    return "";
  }
};
// derive N accounts from mnemonic
export const deriveAccounts = async (mnemonic: string, count: number) => {
  const clean = mnemonic.trim().replace(/\s+/g, " ");

  if (!bip39.validateMnemonic(clean)) {
    throw new Error("Invalid seed phrase");
  }

  const seed = await bip39.mnemonicToSeed(clean);

  const accounts: {
    index: number;
    publicKey: string;
    secretKey: string;
  }[] = [];

  for (let i = 0; i < count; i++) {
    const path = `m/44'/501'/${i}'/0'`;
    const derived = derivePath(path, seed.toString("hex")).key;
    const kp = Keypair.fromSeed(derived);

    accounts.push({
      index: i,
      publicKey: kp.publicKey.toBase58(),
      secretKey: Buffer.from(kp.secretKey).toString("hex"),
    });
  }

  return accounts;
};

// fetch balances in parallel
export const attachBalances = async (
  accounts: { publicKey: string }[],
  network: NetworkType
) => {
  const connection = getConnection(network);

  const balances = await Promise.all(
    accounts.map((acc) =>
      connection.getBalance(new PublicKey(acc.publicKey))
    )
  );

  return accounts.map((acc, i) => ({
    ...acc,
    balance: balances[i] / LAMPORTS_PER_SOL,
  }));
};