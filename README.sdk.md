# Xorax SDK

Official TypeScript SDK for Xorax Privacy Mixer on Solana.

## Installation

```bash
npm install @xorax/sdk
```

## Quick Start

```typescript
import { createClient, Connection } from "@xorax/sdk";

const connection = new Connection("https://api.devnet.solana.com");
const client = createClient(connection, wallet);

// Deposit
const result = await client.deposit(0.5, 300);
console.log("Save these:", result.commitment, result.secret, result.nullifier);

// Withdraw (via relayer)
await client.withdrawViaRelayer(
  "https://relayer.xorax.io",
  commitment,
  secret,
  nullifier,
  recipientPublicKey
);
```

## Documentation

Full documentation available at [xorax.io/docs](https://xorax.io/docs)

## Features

- ✅ Easy integration with Solana dApps
- 🔒 Cryptographic privacy with commitment scheme
- ⚡ Built on Solana for speed and low costs
- 🌐 Gasless withdrawals via relayer network
- 📦 Full TypeScript support

## License

MIT
