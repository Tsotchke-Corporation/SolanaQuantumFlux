# TSOTCHKE Quantum Random Number Generator (QRNG) SDK

A simplified SDK for integrating with TSOTCHKE's on-chain QRNG service on Solana.

## Overview

This SDK provides an easy way to generate true random numbers on Solana using TSOTCHKE's quantum-inspired random number generation service. Each random number request costs 1 TSOTCHKE token.

## Installation

```bash
npm install @tsotchke/solana-qrng
```

## Quick Start

```typescript
import { Connection, Keypair } from '@solana/web3.js';
import { QrngClient } from '@tsotchke/solana-qrng';

// Create a connection to Solana
const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');

// Create your wallet (must hold TSOTCHKE tokens)
// In a real app, load your wallet from a secure source
const wallet = Keypair.fromSecretKey(/* your secret key */);

// Initialize the QRNG client
const qrng = new QrngClient(connection);

// Check your token balance
const balance = await qrng.getTokenBalance(wallet.publicKey);
console.log(`TSOTCHKE token balance: ${balance}`);

// Generate a random 64-bit integer
const randomInt = await qrng.generateRandomU64(wallet);
console.log(`Random U64: ${randomInt}`);

// Generate a random floating-point number between 0 and 1
const randomDouble = await qrng.generateRandomDouble(wallet);
console.log(`Random double: ${randomDouble}`);

// Generate a random boolean
const randomBoolean = await qrng.generateRandomBoolean(wallet);
console.log(`Random boolean: ${randomBoolean}`);
```

## Features

- **Easy to use**: Simple API with just three main methods
- **Reliable**: Uses Solana's on-chain randomness service
- **Quantum-inspired**: High-quality randomness suitable for critical applications
- **Token-based**: Pay-per-use model with TSOTCHKE tokens

## API Reference

### `QrngClient`

Main client for interacting with the QRNG service.

#### Constructor

```typescript
constructor(connection: Connection, options?: QrngClientOptions)
```

- `connection`: Connection to a Solana cluster
- `options` (optional): Configuration options
  - `programId`: Custom program ID (defaults to mainnet ID)
  - `tokenMint`: Custom token mint (defaults to TSOTCHKE token)
  - `treasuryAddress`: Custom treasury address (defaults to TSOTCHKE treasury)

#### Methods

##### `generateRandomU64(wallet: Keypair | Signer): Promise<bigint>`

Generate a random 64-bit unsigned integer.

##### `generateRandomDouble(wallet: Keypair | Signer): Promise<number>`

Generate a random floating-point number between 0 and 1.

##### `generateRandomBoolean(wallet: Keypair | Signer): Promise<boolean>`

Generate a random boolean value.

##### `getTokenBalance(walletPublicKey: PublicKey): Promise<number>`

Get the TSOTCHKE token balance for a wallet.

## Token Usage

Each call to a generation method (`generateRandomU64`, `generateRandomDouble`, `generateRandomBoolean`) costs 1 TSOTCHKE token.

## Common Use Cases

See the [examples directory](../examples) for practical applications:

- Basic random number generation
- GameFi with random encounters and loot drops
- Provably fair DeFi transaction ordering
- Random NFT trait generation

## Error Handling

The SDK throws `QrngError` with descriptive messages for common issues:

```typescript
try {
  const random = await qrng.generateRandomU64(wallet);
  // Use the random number
} catch (error) {
  if (error instanceof QrngError) {
    console.error('QRNG error:', error.message);
    // Handle specific error cases
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## License

TSOTCHKE CORPORATION PROPRIETARY LICENSE
