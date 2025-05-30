# TSOTCHKE QRNG Examples

This directory contains various examples demonstrating how to use the TSOTCHKE QRNG service in different applications. These examples serve as practical guides for integrating quantum-inspired randomness into your projects.

## Available Examples

### [Basic Examples](./basic/)

Simple examples showing the fundamental usage of the QRNG service:

- **[Simple Randomness](./basic/simple-randomness.ts)**: Demonstrates basic random number generation, range selection, array shuffling, and more common use cases.

### [GameFi Examples](./gamefi/)

Examples for gaming and gambling applications:

- **[GameFi Randomness](./gamefi/gamefi-randomness.ts)**: Shows how to implement character generation, dice rolling, battle mechanics, and loot systems using quantum-inspired randomness.

### [NFT Examples](./nft/)

Examples for NFT creators and marketplaces:

- **[NFT Trait Generator](./nft/nft-trait-generator.ts)**: Demonstrates random trait generation for NFT collections with weighted rarities and fair minting processes.

### [DeFi Examples](./defi/)

Examples for decentralized finance applications:

- **[DeFi Fairness](./defi/defi-fairness.ts)**: Shows how to implement fair liquidation selection, yield distribution, governance selection, and more.

## Getting Started

To run these examples locally:

1. Install the necessary dependencies:

```bash
npm install @solana/web3.js @solana/spl-token @tsotchke/solana-qrng
```

2. Set up your Solana wallet with TSOTCHKE tokens (at least 10 tokens recommended for running multiple examples)

3. Replace the wallet secret key placeholder with your actual wallet:

```typescript
// Replace this line:
const wallet = Keypair.fromSecretKey(/* your wallet secret key */);

// With something like:
const wallet = Keypair.fromSecretKey(Uint8Array.from([/* your private key */]));
```

4. Run an example:

```bash
ts-node examples/basic/simple-randomness.ts
```

## Token Usage

Each random number request costs 1 TSOTCHKE token. The examples are designed to demonstrate functionality while being mindful of token usage. For example:

- **Efficient Randomness**: Where possible, examples extract multiple values from a single random number to minimize token consumption.

- **Balance Checks**: Examples check token balance before executing operations that would require multiple tokens.

- **Optimized Algorithms**: Implementations use algorithms that require minimal random number requests while maintaining quality.

## Code Structure

Each example is organized as follows:

1. **Imports and Setup**: Required libraries and initialization code
2. **Core Implementation**: The main code demonstrating the specific use case
3. **Example Usage**: A runnable example showing how to use the implementation
4. **Comments**: Explanations of what each part does and why

## Important Notes

- These examples are for educational purposes and may need adaptation for production use.
- Always handle wallet private keys securely in production environments.
- For large-scale applications, consider optimizing for token usage by batching requests where possible.
- Remember that each random number costs 1 TSOTCHKE token.

## Further Resources

- [SDK Reference](../docs/sdk-reference/README.md)
- [Technical Documentation](../docs/technical/README.md)
- [Getting Started Guide](../docs/getting-started/README.md)
