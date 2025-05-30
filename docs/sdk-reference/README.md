# TSOTCHKE QRNG SDK Reference

This reference documentation provides detailed information about the TSOTCHKE QRNG SDK for Solana. The SDK offers a simple interface for accessing high-quality quantum-inspired random numbers on the Solana blockchain.

## Installation

```bash
git clone https://github.com/tsotchke-corporation/SolanaQuantumFlux.git
cd SolanaQuantumFlux
```

```bash
cd sdk
npm install
```

```bash
cd ../examples
npm install
```

## QrngClient Class

The `QrngClient` class is the main entry point for interacting with the TSOTCHKE QRNG service.

### Constructor

```typescript
constructor(
  connection: Connection,
  options?: QrngClientOptions
)
```

#### Parameters

- `connection`: A Solana `Connection` instance
- `options`: (Optional) Configuration options for the client

#### QrngClientOptions Interface

```typescript
interface QrngClientOptions {
  /**
   * Program ID of the QRNG service (defaults to mainnet ID)
   */
  programId?: PublicKey;
  
  /**
   * Token mint address for TSOTCHKE (defaults to mainnet mint)
   */
  tokenMint?: PublicKey;
  
  /**
   * Treasury address (defaults to mainnet treasury)
   */
  treasuryAddress?: PublicKey;
  
  /**
   * Compute unit limit for transactions (default: 200_000)
   */
  computeUnitLimit?: number;
  
  /**
   * Priority fee in micro-lamports per compute unit (optional)
   */
  priorityFee?: number;
}
```

### Constants

```typescript
/**
 * Default program ID on Solana mainnet
 */
static readonly DEFAULT_PROGRAM_ID = new PublicKey('F7E268Uek6YJvYCNaeamnxLy1umzPPTfrK2TiATxffQg');

/**
 * Default TSOTCHKE token mint on Solana mainnet
 */
static readonly DEFAULT_TOKEN_MINT = new PublicKey('4mbdysBik3jmzD7mt6FGPDsMxnYcxExSQRFjPucdpump');

/**
 * Default treasury address on Solana mainnet
 */
static readonly DEFAULT_TREASURY_ADDRESS = new PublicKey('3vuKcjqows8T19z7amN2XMkSdVcicqBuf5vVa8ZjaVfc');

/**
 * Default compute unit limit
 */
static readonly DEFAULT_COMPUTE_UNIT_LIMIT = 200_000;
```

### Methods

#### generateRandomU64

Generates a random 64-bit unsigned integer.

```typescript
async generateRandomU64(
  wallet: Keypair | Signer,
  options?: QrngConfirmOptions
): Promise<bigint>
```

##### Parameters

- `wallet`: The wallet that will pay for the transaction (must contain TSOTCHKE tokens)
- `options`: (Optional) Transaction confirmation options

##### Returns

- A Promise that resolves to a BigInt representing the random 64-bit unsigned integer

##### Example

```typescript
const randomU64 = await qrngClient.generateRandomU64(wallet);
console.log(`Random U64: ${randomU64.toString()}`);

// Convert to Number if needed (may lose precision for very large values)
const randomNumber = Number(randomU64);

// Generate a random number between 1 and 100 (inclusive)
const min = 1n;
const max = 100n;
const scaledRandom = (randomU64 % (max - min + 1n)) + min;
```

#### generateRandomDouble

Generates a random double-precision floating-point number between 0 and 1.

```typescript
async generateRandomDouble(
  wallet: Keypair | Signer,
  options?: QrngConfirmOptions
): Promise<number>
```

##### Parameters

- `wallet`: The wallet that will pay for the transaction (must contain TSOTCHKE tokens)
- `options`: (Optional) Transaction confirmation options

##### Returns

- A Promise that resolves to a number between 0 and 1

##### Example

```typescript
const randomDouble = await qrngClient.generateRandomDouble(wallet);
console.log(`Random Double: ${randomDouble}`);

// Use for probability-based logic
if (randomDouble < 0.25) {
  console.log('25% chance event occurred!');
}

// Use for weighted random selection
const options = ['Rare Item', 'Uncommon Item', 'Common Item'];
const weights = [0.1, 0.3, 0.6]; // 10%, 30%, 60% chances

let cumulativeWeight = 0;
let selectedIndex = options.length - 1; // Default to last option

for (let i = 0; i < weights.length; i++) {
  cumulativeWeight += weights[i];
  if (randomDouble <= cumulativeWeight) {
    selectedIndex = i;
    break;
  }
}

const selectedItem = options[selectedIndex];
```

#### generateRandomBoolean

Generates a random boolean value.

```typescript
async generateRandomBoolean(
  wallet: Keypair | Signer,
  options?: QrngConfirmOptions
): Promise<boolean>
```

##### Parameters

- `wallet`: The wallet that will pay for the transaction (must contain TSOTCHKE tokens)
- `options`: (Optional) Transaction confirmation options

##### Returns

- A Promise that resolves to a boolean (true or false)

##### Example

```typescript
const randomBoolean = await qrngClient.generateRandomBoolean(wallet);
console.log(`Random Boolean: ${randomBoolean}`);

// Use for binary decisions
if (randomBoolean) {
  console.log('Heads!');
} else {
  console.log('Tails!');
}
```

#### getTokenBalance

Utility method to check the TSOTCHKE token balance for a given wallet.

```typescript
async getTokenBalance(
  walletPublicKey: PublicKey
): Promise<number>
```

##### Parameters

- `walletPublicKey`: The public key of the wallet to check

##### Returns

- A Promise that resolves to the number of TSOTCHKE tokens (as a decimal number)

##### Example

```typescript
const balance = await qrngClient.getTokenBalance(wallet.publicKey);
console.log(`TSOTCHKE Balance: ${balance}`);

if (balance < 10) {
  console.log('Warning: Low token balance!');
}
```

#### findConfigAddress

Utility method to find the program's configuration PDA.

```typescript
findConfigAddress(): [PublicKey, number]
```

##### Returns

- A tuple containing the config address PublicKey and the bump seed

##### Example

```typescript
const [configAddress, bump] = qrngClient.findConfigAddress();
console.log(`Config Address: ${configAddress.toString()}`);
```

## QrngConfirmOptions Interface

Options for transaction confirmation.

```typescript
interface QrngConfirmOptions {
  /**
   * Commitment level for the transaction
   */
  commitment?: Commitment;
  
  /**
   * Maximum time to wait for confirmation (in milliseconds)
   */
  timeout?: number;
}
```

## Error Handling

The SDK throws specific error types to help with debugging and error handling:

### QrngError

Base error class for all QRNG-related errors.

```typescript
class QrngError extends Error {
  public readonly type: QrngErrorType;
}
```

### Error Types

- **QrngInsufficientBalanceError**: Thrown when the wallet doesn't have enough TSOTCHKE tokens
- **QrngTransactionError**: Thrown when a transaction fails (includes transaction signature)
- **QrngTimeoutError**: Thrown when a transaction confirmation times out
- **QrngInvalidTreasuryError**: Thrown when there's an issue with the treasury account
- **QrngInvalidReturnDataError**: Thrown when the transaction doesn't return expected data

### Example Error Handling

```typescript
import { 
  QrngError, 
  QrngInsufficientBalanceError,
  QrngTransactionError,
  QrngTimeoutError
} from '@tsotchke/solana-qrng';

try {
  const randomValue = await qrngClient.generateRandomU64(wallet);
  // Use the random value
} catch (error) {
  if (error instanceof QrngInsufficientBalanceError) {
    console.error('Not enough TSOTCHKE tokens:', error.message);
  } else if (error instanceof QrngTransactionError) {
    console.error('Transaction failed:', error.message);
    console.error('Transaction ID:', error.signature);
  } else if (error instanceof QrngTimeoutError) {
    console.error('Transaction timed out:', error.message);
  } else if (error instanceof QrngError) {
    console.error('QRNG service error:', error.message);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Advanced Usage

### Random Shuffling

Shuffle an array using quantum-inspired randomness:

```typescript
async function quantumShuffle<T>(array: T[], wallet: Keypair): Promise<T[]> {
  const result = [...array];
  
  for (let i = result.length - 1; i > 0; i--) {
    // Get random index
    const randomU64 = await qrngClient.generateRandomU64(wallet);
    const j = Number(randomU64 % BigInt(i + 1));
    
    // Swap elements
    [result[i], result[j]] = [result[j], result[i]];
  }
  
  return result;
}
```

### Custom Network Configuration

```typescript
// Connect to devnet for testing
const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

// Use devnet program ID and token mint
const qrngClient = new QrngClient(connection, {
  programId: new PublicKey('your_devnet_program_id'),
  tokenMint: new PublicKey('your_devnet_token_mint'),
  treasuryAddress: new PublicKey('your_devnet_treasury_address')
});
```

### Web3 Wallet Adapter Integration

```typescript
import { useWallet } from '@solana/wallet-adapter-react';

// In your React component
const { publicKey, signTransaction, signAllTransactions } = useWallet();

// Create a wallet adapter signer
const walletAdapter = {
  publicKey,
  signTransaction,
  signAllTransactions
};

// Use the wallet adapter with the QRNG client
const randomValue = await qrngClient.generateRandomU64(walletAdapter);
```

### Transaction Batching

While each random number costs 1 TSOTCHKE token, you can optimize your application by requesting multiple random numbers in a session:

```typescript
// Get multiple random numbers in sequence (more efficient than parallel)
const random1 = await qrngClient.generateRandomU64(wallet);
const random2 = await qrngClient.generateRandomDouble(wallet);
const random3 = await qrngClient.generateRandomBoolean(wallet);

// Use the values together
const gameState = {
  playerPosition: Number(random1 % BigInt(mapSize)),
  enemyStrength: random2 * 100,
  specialItemDropped: random3
};
```

## Best Practices

1. **Check Token Balance**: Always verify that the wallet has sufficient TSOTCHKE tokens before making requests
2. **Handle Errors Gracefully**: Implement comprehensive error handling for different failure scenarios
3. **Transaction Confirmation**: Use appropriate commitment levels based on your application's needs
4. **Batch Requests**: When possible, request multiple random numbers in a single session
5. **Secure Private Keys**: Never expose wallet private keys in client-side code
6. **Rate Limiting**: Implement rate limiting in your application to prevent accidental token depletion

## Troubleshooting

### Common Errors

#### Insufficient Token Balance

```
QrngInsufficientBalanceError: Insufficient TSOTCHKE tokens. You have 0.5 but need at least 1.0.
```

**Solution**: Ensure your wallet has at least 1.0 TSOTCHKE token per random number request.

#### Invalid Treasury Account

```
QrngInvalidTreasuryError: Invalid treasury token account
```

**Solution**: Check that you're using the correct program ID and treasury address.

#### Transaction Timeout

```
QrngTimeoutError: Transaction confirmation timeout
```

**Solution**: The Solana network might be congested. Try increasing the timeout in your confirmation options or retry the transaction.

#### Invalid Return Data

```
QrngInvalidReturnDataError: No return data found in transaction
```

**Solution**: The program didn't return the expected data. This could be due to a network issue or a problem with the on-chain program. Check for network issues and try again.

## Compatibility

- Node.js: v14.0.0 or higher
- Browser: Modern browsers with ES6 support
- Solana Web3.js: v1.73.0 or higher
- Solana SPL Token: v0.3.7 or higher

## Further Resources

- [GitHub Repository](https://github.com/tsotchke-corporation/SolanaQuantumFlux)
- [NPM Package](https://www.npmjs.com/package/@tsotchke/solana-qrng)
- [Technical Documentation](../technical/README.md)
- [Example Applications](../../examples/)
- [Basic Usage Example](../../sdk/examples/basic-usage.ts)
