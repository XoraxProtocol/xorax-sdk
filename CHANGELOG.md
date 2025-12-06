# Changelog

All notable changes to the Xorax SDK will be documented in this file.

## [1.1.0] - 2025-12-06

### 🚀 Major Update: Mainnet Deployment

#### Changed

- **Program ID Updated**: Migrated from devnet (`XoPB2WDHGJrnhR78xG9EfuU8PGYHchcPvygycaHuHGz`) to mainnet (`JJWGp5cinhhupX8LNm6oThsuzdt3esnJZZLYTosqMEm`)
- **IDL Updated**: Synchronized with latest on-chain program deployment
- Updated documentation to reflect mainnet-first approach with devnet as alternative
- Enhanced README with mainnet deployment notice

#### Added

- Mainnet RPC endpoint examples in documentation
- Production-ready configuration defaults
- Additional safety notes for mainnet usage

#### Technical Details

- Built with Anchor 0.32.1
- Compatible with Solana web3.js ^1.95.0
- Full TypeScript support maintained
- No breaking changes to API surface

### Migration Guide

If you're upgrading from 1.0.0:

```typescript
// Old (v1.0.0 - Devnet)
const connection = new Connection("https://api.devnet.solana.com");

// New (v1.1.0 - Mainnet)
const connection = new Connection("https://api.mainnet-beta.solana.com");
// Or your preferred mainnet RPC endpoint
```

No other code changes required - the API remains fully compatible!

---

## [1.0.0] - 2025-12-01

### Initial Release

#### Features

- Complete TypeScript SDK for Xorax privacy mixer
- Deposit and withdrawal operations
- Cryptographic utilities (commitment, secret, nullifier generation)
- Relayer support for gasless withdrawals
- Full type safety with TypeScript
- Browser and Node.js compatibility
- Comprehensive documentation and examples

#### Modules

- `XoraxClient` - Main client for interacting with the protocol
- `crypto` - Cryptographic utilities for privacy operations
- `idl` - Program IDL and type definitions

#### Platform Support

- Solana devnet deployment
- Compatible with all major Solana wallet adapters
- Works in browsers and Node.js environments
