import { createClient, Connection, PublicKey } from "../src";

async function main() {
  // This is a basic usage example
  // In production, use proper wallet adapter

  const connection = new Connection("https://api.devnet.solana.com");

  // Mock wallet for example purposes
  const mockWallet = {
    publicKey: new PublicKey("11111111111111111111111111111111"),
    signTransaction: async (tx: any) => tx,
    signAllTransactions: async (txs: any[]) => txs,
  };

  const client = createClient(connection, mockWallet);

  console.log("Xorax SDK Example");
  console.log("Program ID:", client.programId.toString());
  console.log("\nTo use this SDK:");
  console.log("1. Connect your wallet");
  console.log("2. Call client.deposit(amount, delay)");
  console.log("3. Save the returned credentials");
  console.log("4. Use credentials to withdraw later");

  // Example: Check if a deposit can be withdrawn
  // const canWithdraw = await client.canWithdraw('YOUR_COMMITMENT_HEX');
  // console.log('Can withdraw:', canWithdraw);
}

main().catch(console.error);
