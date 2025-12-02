# Xorax SDK

TypeScript SDK for integrating [Xorax](https://xorax.io) privacy mixer into your Solana applications.

## Features

- ✅ **Easy Integration** - Simple API for deposits and withdrawals
- 🔒 **Privacy First** - Cryptographic commitment scheme with secret + nullifier
- ⚡ **Solana Speed** - Fast confirmations and low transaction costs
- 🌐 **Relayer Support** - Gasless withdrawals via relayer network
- 📦 **TypeScript** - Full type safety and IntelliSense support

## Installation

```bash
npm install @xorax/sdk
# or
yarn add @xorax/sdk
# or
pnpm add @xorax/sdk
```

## Quick Start

### 1. Create a Client

```typescript
import { createClient, Connection, PublicKey } from "@xorax/sdk";

// Connect to Solana
const connection = new Connection("https://api.devnet.solana.com");

// Create client with your wallet
const client = createClient(connection, wallet);
```

### 2. Make a Deposit

```typescript
// Deposit 0.5 SOL with 5 minute delay
const result = await client.deposit(0.5, 300);

console.log("Transaction:", result.signature);
console.log("Save these credentials for withdrawal:");
console.log("Commitment:", result.commitment);
console.log("Secret:", result.secret);
console.log("Nullifier:", result.nullifier);

// ⚠️ IMPORTANT: Save these credentials securely!
// You need them to withdraw your funds later
```

### 3. Withdraw Funds

#### Option A: Via Relayer (Gasless)

```typescript
const recipient = new PublicKey("YOUR_RECIPIENT_ADDRESS");

const result = await client.withdrawViaRelayer(
  "https://relayer.xorax.io", // Relayer URL
  commitment,
  secret,
  nullifier,
  recipient
);

console.log("Withdrawal TX:", result.signature);
```

#### Option B: Direct Withdrawal

```typescript
const recipient = new PublicKey("YOUR_RECIPIENT_ADDRESS");

const result = await client.withdrawDirect(secret, nullifier, recipient);

console.log("Withdrawal TX:", result.signature);
```

## API Reference

### `createClient(connection, wallet)`

Create a new Xorax client instance.

**Parameters:**

- `connection: Connection` - Solana connection instance
- `wallet: any` - Wallet adapter (must have `publicKey` and `signTransaction`)

**Returns:** `XoraxClient`

---

### `client.deposit(amountSol, delaySeconds)`

Deposit SOL into the mixer.

**Parameters:**

- `amountSol: number` - Amount to deposit in SOL (minimum 0.01 SOL)
- `delaySeconds: number` - Withdrawal delay in seconds (default: 300)

**Returns:** `Promise<DepositResult>`

```typescript
{
  signature: string; // Transaction signature
  commitment: string; // Hex string - save this!
  secret: string; // Hex string - save this!
  nullifier: string; // Hex string - save this!
}
```

---

### `client.withdrawViaRelayer(relayerUrl, commitment, secret, nullifier, recipient)`

Withdraw via relayer (gasless).

**Parameters:**

- `relayerUrl: string` - Relayer service URL
- `commitment: string` - Commitment hex from deposit
- `secret: string` - Secret hex from deposit
- `nullifier: string` - Nullifier hex from deposit
- `recipient: PublicKey` - Recipient address

**Returns:** `Promise<WithdrawResult>`

```typescript
{
  signature: string; // Transaction signature
}
```

---

### `client.withdrawDirect(secret, nullifier, recipient)`

Withdraw directly (requires SOL for gas).

**Parameters:**

- `secret: string` - Secret hex from deposit
- `nullifier: string` - Nullifier hex from deposit
- `recipient: PublicKey` - Recipient address

**Returns:** `Promise<WithdrawResult>`

---

### `client.canWithdraw(commitmentHex)`

Check if withdrawal delay has passed.

**Parameters:**

- `commitmentHex: string` - Commitment hex from deposit

**Returns:** `Promise<boolean>`

---

### `client.getWithdrawTimeRemaining(commitmentHex)`

Get seconds remaining until withdrawal is available.

**Parameters:**

- `commitmentHex: string` - Commitment hex from deposit

**Returns:** `Promise<number>` - Seconds remaining (0 if ready)

---

### `client.fetchDepositRecord(commitment)`

Fetch deposit record from the blockchain.

**Parameters:**

- `commitment: Buffer` - Commitment buffer

**Returns:** `Promise<DepositRecordAccount | null>`

## Crypto Utilities

The SDK also exports cryptographic utilities:

```typescript
import {
  generateDepositCredentials,
  computeCommitment,
  toHex,
  fromHex,
  toArray,
  verifyCommitment,
} from "@xorax/sdk";

// Generate new credentials
const creds = await generateDepositCredentials();
console.log(creds.secretHex, creds.nullifierHex, creds.commitmentHex);

// Verify a commitment
const isValid = await verifyCommitment(secret, nullifier, expectedCommitment);
```

## Constants

```typescript
import { PROGRAM_ID, MIXING_FEE, MIN_DEPOSIT_AMOUNT } from "@xorax/sdk";

console.log(PROGRAM_ID); // XoPB2WDHGJrnhR78xG9EfuU8PGYHchcPvygycaHuHGz
console.log(MIXING_FEE); // 10000000 (0.01 SOL in lamports)
console.log(MIN_DEPOSIT_AMOUNT); // 0.01
```

## Examples

### Full Example: React Component

```typescript
import { useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { createClient, PublicKey } from "@xorax/sdk";

function MixerComponent() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [credentials, setCredentials] = useState(null);

  const handleDeposit = async () => {
    const client = createClient(connection, wallet);

    try {
      const result = await client.deposit(0.5, 300);
      setCredentials(result);
      alert(`Deposit successful! TX: ${result.signature}`);
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  const handleWithdraw = async () => {
    if (!credentials) return;

    const client = createClient(connection, wallet);
    const recipient = new PublicKey("YOUR_ADDRESS");

    try {
      const result = await client.withdrawViaRelayer(
        "https://relayer.xorax.io",
        credentials.commitment,
        credentials.secret,
        credentials.nullifier,
        recipient
      );
      alert(`Withdrawal successful! TX: ${result.signature}`);
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <div>
      <button onClick={handleDeposit}>Deposit 0.5 SOL</button>
      <button onClick={handleWithdraw} disabled={!credentials}>
        Withdraw
      </button>
    </div>
  );
}
```

### Node.js Example

```typescript
import { createClient, Connection, Keypair } from "@xorax/sdk";
import fs from "fs";

// Load keypair from file
const keypairData = JSON.parse(fs.readFileSync("wallet.json", "utf-8"));
const keypair = Keypair.fromSecretKey(new Uint8Array(keypairData));

// Create connection
const connection = new Connection("https://api.devnet.solana.com");

// Create wallet adapter
const wallet = {
  publicKey: keypair.publicKey,
  signTransaction: async (tx) => {
    tx.partialSign(keypair);
    return tx;
  },
  signAllTransactions: async (txs) => {
    return txs.map((tx) => {
      tx.partialSign(keypair);
      return tx;
    });
  },
};

// Create client
const client = createClient(connection, wallet);

// Make deposit
const result = await client.deposit(1.0, 600);
console.log("Deposit successful:", result);

// Save credentials to file
fs.writeFileSync("credentials.json", JSON.stringify(result, null, 2));
```

## Security Best Practices

⚠️ **CRITICAL**: The `secret`, `nullifier`, and `commitment` are the ONLY way to withdraw your funds. If you lose them, your funds are lost forever!

### Recommendations:

1. **Store credentials securely** - Use encrypted storage, password managers, or secure vaults
2. **Use Tor/VPN** - Hide your IP when depositing and withdrawing
3. **Longer delays = more privacy** - Use 6-24 hour delays for maximum anonymity
4. **Vary amounts** - Don't use round numbers (e.g., use 0.523 SOL instead of 0.5 SOL)
5. **Fresh wallets** - Withdraw to completely new wallet addresses
6. **Don't rush** - Don't withdraw immediately when delay expires

## Network Support

- **Devnet**: `XoPB2WDHGJrnhR78xG9EfuU8PGYHchcPvygycaHuHGz`
- **Mainnet**: Coming soon

## License

MIT

## Links

- [Website](https://xorax.io)
- [Documentation](https://xorax.io/docs)
- [GitHub](https://github.com/xorax)
- [Discord](https://discord.gg/xorax)

## Support

For issues and questions:

- GitHub Issues: https://github.com/xorax/xorax-sdk/issues
- Discord: https://discord.gg/xorax
- Email: support@xorax.io
