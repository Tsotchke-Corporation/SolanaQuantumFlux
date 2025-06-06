# Getting Started with TSOTCHKE QRNG

Welcome to TSOTCHKE QRNG! This guide will help you get up and running with our quantum-inspired random number generation service on the Solana blockchain.

## What is TSOTCHKE QRNG?

TSOTCHKE QRNG is a high-quality random number generation service built on Solana that provides verifiable, unpredictable, and statistically robust random numbers for decentralized applications. It uses quantum-inspired algorithms to deliver superior randomness for gaming, NFTs, DeFi, and more.

## How It Works

1. **Purchase TSOTCHKE Tokens**: Our service operates on a simple token model - 1 TSOTCHKE token = 1 random number
2. **Send Transaction**: Your application makes a request to our on-chain program
3. **Receive Randomness**: The program returns a high-quality random number directly in the transaction as Base64 encoded Hex data
4. **Decode the Result**: The SDK automatically decodes the Base64 data into the appropriate format (integer, double, or boolean)
5. **Use the Result**: Incorporate the random number into your application logic

## Quick Start

### Step 1: Install the SDK - Setup for Local Development

1. Clone this repository:
```bash
git clone https://github.com/tsotchke-corporation/SolanaQuantumFlux.git
cd SolanaQuantumFlux
```

2. Install dependencies for the SDK:
```bash
cd sdk
npm install
```

3. Install dependencies for examples:
```bash
cd ../examples
npm install
```
### Step 2: Set Up Your Environment

```typescript
import { Connection } from '@solana/web3.js';
import { QrngClient } from '@tsotchke/solana-qrng';

// Connect to Solana
const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');

// Initialize the QRNG client
const qrngClient = new QrngClient(connection);
```

### Step 3: Acquire TSOTCHKE Tokens

You'll need TSOTCHKE tokens to use the service. The easiest way to acquire them is through:

- [Jupiter Aggregator](https://jup.ag/tokens/4mbdysBik3jmzD7mt6FGPDsMxnYcxExSQRFjPucdpump)
- Direct purchase from the Treasury
- Participating in upcoming token distribution events

### Step 4: Generate Random Numbers

```typescript
// Import wallet utilities
import { Keypair } from '@solana/web3.js';

// Your wallet with TSOTCHKE tokens
const wallet = Keypair.fromSecretKey(/* your wallet secret key */);

// Generate a random u64 integer
const randomU64 = await qrngClient.generateRandomU64(wallet);
console.log(`Random U64: ${randomU64}`);

// Generate a random double between 0 and 1
const randomDouble = await qrngClient.generateRandomDouble(wallet);
console.log(`Random Double: ${randomDouble}`);

// Generate a random boolean
const randomBoolean = await qrngClient.generateRandomBoolean(wallet);
console.log(`Random Boolean: ${randomBoolean}`);
```

## Output Format

The TSOTCHKE QRNG Solana program returns randomness as **Base64 encoded Hex data** in the transaction return data. Our SDK automatically handles the decoding process for you, converting this encoded data into usable values based on the requested type.

For those implementing direct integrations without our SDK, you'll need to:
1. Extract the Base64 encoded data from the transaction return data
2. Decode the Base64 string to get the raw binary data
3. Parse the binary data according to the requested type:
   - U64 integers: Read as a 64-bit little-endian unsigned integer
   - Doubles: Read as a 64-bit little-endian IEEE 754 floating point value
   - Booleans: Interpret as true if non-zero, false if zero

Our SDK's `client.ts` implementation and the `qrng_decoder.ts` utility handle these conversions automatically, so you don't have to worry about the technical details when using our SDK.

## Different Output Types

TSOTCHKE QRNG offers three different types of random outputs to suit various application needs:

### 1. U64 Integer (64-bit Unsigned Integer)

```typescript
const randomU64 = await qrngClient.generateRandomU64(wallet);
```

**Best for:**
- Maximum entropy applications
- Large range random selections
- Cryptographic applications
- Custom range mapping

### 2. Double (0-1 Range)

```typescript
const randomDouble = await qrngClient.generateRandomDouble(wallet);
```

**Best for:**
- Probability calculations
- Weighted random selections
- Percentage-based systems
- Visual/spatial randomization

### 3. Boolean (True/False)

```typescript
const randomBoolean = await qrngClient.generateRandomBoolean(wallet);
```

**Best for:**
- Binary decisions
- Coin flips
- 50/50 chance systems
- Simple yes/no outcomes

## Common Use Cases

### Gaming

```typescript
// Random dice roll
const diceRoll = (randomU64 % 6) + 1;

// Random card draw
const cards = ['Ace', 'King', 'Queen', 'Jack', '10', '9', '8'];
const drawnCard = cards[randomU64 % cards.length];

// Random critical hit (20% chance)
const isCriticalHit = randomDouble < 0.20;
```

### NFTs

```typescript
// Generate random rarity tier
const rarityTiers = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];
const nftRarity = rarityTiers[randomU64 % rarityTiers.length];

// Random attribute assignment
const attributes = {
  strength: (randomU64 % 100) + 1,
  intelligence: ((randomU64 >> 8) % 100) + 1,
  dexterity: ((randomU64 >> 16) % 100) + 1,
  hasMagicPowers: randomBoolean
};
```

### DeFi

```typescript
// Random selection for yield distribution
const eligibleWallets = [/* list of wallet addresses */];
const selectedWallet = eligibleWallets[randomU64 % eligibleWallets.length];

// Random liquidation selection
const positionsToLiquidate = [/* list of positions */];
const liquidationIndex = randomU64 % positionsToLiquidate.length;
```

## Advanced Configuration

### Setting Compute Budget

To optimize for Solana network conditions, you can configure the compute budget:

```typescript
// Configure client with custom compute units
const qrngClient = new QrngClient(connection, {
  computeUnitLimit: 200_000,  // Default is 200,000
  priorityFee: 5000           // Optional micro-lamports per compute unit
});
```

### Custom Confirmation Strategy

```typescript
// Request with custom confirmation options
const randomNumber = await qrngClient.generateRandomU64(
  wallet,
  { 
    commitment: 'finalized',
    timeout: 60_000 // 60 seconds
  }
);
```

### Error Handling

```typescript
try {
  const randomNumber = await qrngClient.generateRandomU64(wallet);
  // Use the random number
} catch (error) {
  if (error.message.includes('insufficient funds')) {
    console.error('Not enough TSOTCHKE tokens. Please add more tokens to your wallet.');
  } else if (error.message.includes('timeout')) {
    console.error('Transaction confirmation timeout. The network may be congested.');
  } else {
    console.error('Error generating random number:', error);
  }
}
```

## Best Practices

1. **Cache Tokens**: Purchase TSOTCHKE tokens in bulk to reduce the overhead of multiple token acquisitions
2. **Batch Requests**: When possible, request multiple random numbers in a single application session
3. **Handle Failures**: Implement proper error handling and retry mechanisms
4. **Secure Storage**: Never hardcode wallet keys in your application
5. **Verify Results**: For critical applications, verify the transaction on-chain
6. **Use the SDK**: The SDK handles Base64 decoding automatically; use it whenever possible
7. **Test Decoding**: If implementing custom decoding, test thoroughly with different output types

## Next Steps

- Explore our [SDK Reference](../sdk-reference/README.md) for detailed API documentation
- Check out our [Technical Documentation](../technical/README.md) for in-depth details
- Try our [Example Applications](../../examples/README.md) to see QRNG in action
- Join our community on [Telegran](https://t.me/tsotchkecoinOFFICIAL) for support and updates

## Support

If you encounter any issues or have questions, please reach out to our team:

- Email: dev@tsotchke.net
- GitHub Issues: [Report a Bug](https://github.com/tsotchke-corporation/SolanaQuantumFlux/issues)
- Telegram: [Telegran](https://t.me/tsotchkecoinOFFICIAL)
