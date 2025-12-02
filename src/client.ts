import { Program, AnchorProvider, BN } from "@coral-xyz/anchor";
import { Connection, PublicKey, SystemProgram, Keypair } from "@solana/web3.js";
import { XORAX_IDL, XoraxProgram } from "./idl";
import {
  generateDepositCredentials,
  computeCommitment,
  toArray,
  fromHex,
  toHex,
} from "./crypto";

export const PROGRAM_ID = new PublicKey(
  "XoPB2WDHGJrnhR78xG9EfuU8PGYHchcPvygycaHuHGz"
);
export const MIXING_FEE = 10_000_000; // 0.01 SOL in lamports
export const MIN_DEPOSIT_AMOUNT = 0.01; // 0.01 SOL minimum

export interface DepositRecordAccount {
  commitment: number[];
  amount: BN;
  timestamp: BN;
  withdrawalDelay: BN;
  withdrawn: boolean;
}

export interface DepositResult {
  signature: string;
  commitment: string;
  secret: string;
  nullifier: string;
}

export interface WithdrawResult {
  signature: string;
}

export class XoraxClient {
  private program: Program<XoraxProgram>;
  private connection: Connection;
  public readonly programId: PublicKey;

  constructor(connection: Connection, wallet: any) {
    this.connection = connection;
    this.programId = PROGRAM_ID;

    const provider = new AnchorProvider(
      connection,
      wallet,
      AnchorProvider.defaultOptions()
    );

    this.program = new Program(XORAX_IDL, provider) as Program<XoraxProgram>;
  }

  /**
   * Get deposit record PDA from commitment
   */
  getDepositRecordPda(commitment: Buffer): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("deposit"), commitment],
      this.programId
    );
  }

  /**
   * Get nullifier record PDA from nullifier
   */
  getNullifierRecordPda(nullifier: Buffer): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("nullifier"), nullifier],
      this.programId
    );
  }

  /**
   * Fetch deposit record by commitment
   */
  async fetchDepositRecord(
    commitment: Buffer
  ): Promise<DepositRecordAccount | null> {
    try {
      const [depositRecordPda] = this.getDepositRecordPda(commitment);
      const record = await (this.program.account as any).depositRecord.fetch(
        depositRecordPda
      );
      return record as any;
    } catch (error) {
      console.error("Error fetching deposit record:", error);
      return null;
    }
  }

  /**
   * Make a deposit with any amount
   * @param amountSol - Amount in SOL (e.g., 0.5 for 0.5 SOL)
   * @param delaySeconds - Withdrawal delay in seconds
   * @returns Deposit credentials needed for withdrawal
   */
  async deposit(
    amountSol: number,
    delaySeconds: number = 300
  ): Promise<DepositResult> {
    if (amountSol < MIN_DEPOSIT_AMOUNT) {
      throw new Error(`Minimum deposit amount is ${MIN_DEPOSIT_AMOUNT} SOL`);
    }

    // Generate credentials
    const credentials = await generateDepositCredentials();
    const commitment = toArray(credentials.commitment);
    const amountLamports = new BN(amountSol * 1e9);

    const commitmentBuffer = Buffer.from(credentials.commitment);
    const [depositRecordPda] = this.getDepositRecordPda(commitmentBuffer);

    const depositor = this.program.provider.publicKey;
    if (!depositor) {
      throw new Error("Wallet not connected");
    }

    // Execute deposit transaction
    const tx = await this.program.methods
      .deposit(commitment, amountLamports, new BN(delaySeconds))
      .accounts({
        deposit_record: depositRecordPda,
        depositor: depositor,
        system_program: SystemProgram.programId,
      } as any)
      .rpc();

    return {
      signature: tx,
      commitment: credentials.commitmentHex,
      secret: credentials.secretHex,
      nullifier: credentials.nullifierHex,
    };
  }

  /**
   * Withdraw funds via relayer (gasless withdrawal)
   * @param relayerUrl - URL of the relayer service
   * @param commitment - Commitment hex string
   * @param secret - Secret hex string
   * @param nullifier - Nullifier hex string
   * @param recipient - Recipient public key
   * @returns Transaction signature
   */
  async withdrawViaRelayer(
    relayerUrl: string,
    commitment: string,
    secret: string,
    nullifier: string,
    recipient: PublicKey
  ): Promise<WithdrawResult> {
    try {
      const response = await fetch(`${relayerUrl}/withdraw`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          commitment,
          secret,
          nullifier,
          recipient: recipient.toString(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Withdrawal failed");
      }

      const result = await response.json();
      return { signature: result.signature };
    } catch (error: any) {
      throw new Error(`Withdrawal failed: ${error.message}`);
    }
  }

  /**
   * Withdraw directly (requires wallet with SOL for gas)
   * @param secret - Secret hex string
   * @param nullifier - Nullifier hex string
   * @param recipient - Recipient public key
   * @returns Transaction signature
   */
  async withdrawDirect(
    secret: string,
    nullifier: string,
    recipient: PublicKey
  ): Promise<WithdrawResult> {
    const secretBytes = fromHex(secret);
    const nullifierBytes = fromHex(nullifier);
    const commitment = await computeCommitment(secretBytes, nullifierBytes);

    const commitmentBuffer = Buffer.from(commitment);
    const nullifierBuffer = Buffer.from(nullifierBytes);

    const [depositRecordPda] = this.getDepositRecordPda(commitmentBuffer);
    const [nullifierRecordPda] = this.getNullifierRecordPda(nullifierBuffer);

    const relayer = this.program.provider.publicKey;
    if (!relayer) {
      throw new Error("Wallet not connected");
    }

    // Execute withdrawal transaction
    const tx = await this.program.methods
      .withdraw(toArray(secretBytes), toArray(nullifierBytes))
      .accounts({
        deposit_record: depositRecordPda,
        nullifier_record: nullifierRecordPda,
        recipient: recipient,
        relayer: relayer,
        system_program: SystemProgram.programId,
      } as any)
      .rpc();

    return { signature: tx };
  }

  /**
   * Check if a deposit can be withdrawn (delay has passed)
   */
  async canWithdraw(commitmentHex: string): Promise<boolean> {
    const commitment = fromHex(commitmentHex);
    const record = await this.fetchDepositRecord(Buffer.from(commitment));

    if (!record || record.withdrawn) {
      return false;
    }

    const now = Math.floor(Date.now() / 1000);
    const withdrawalTime =
      record.timestamp.toNumber() + record.withdrawalDelay.toNumber();

    return now >= withdrawalTime;
  }

  /**
   * Get time remaining until withdrawal is available
   */
  async getWithdrawTimeRemaining(commitmentHex: string): Promise<number> {
    const commitment = fromHex(commitmentHex);
    const record = await this.fetchDepositRecord(Buffer.from(commitment));

    if (!record) {
      throw new Error("Deposit record not found");
    }

    if (record.withdrawn) {
      return 0;
    }

    const now = Math.floor(Date.now() / 1000);
    const withdrawalTime =
      record.timestamp.toNumber() + record.withdrawalDelay.toNumber();
    const remaining = withdrawalTime - now;

    return remaining > 0 ? remaining : 0;
  }
}

/**
 * Create a new XoraxClient instance
 */
export function createClient(connection: Connection, wallet: any): XoraxClient {
  return new XoraxClient(connection, wallet);
}
