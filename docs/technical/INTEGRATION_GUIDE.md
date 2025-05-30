# Unlocking True Randomness: Tsotchke QRNG Integration Guide

> *"The easiest way to add military-grade randomness to your Solana application in under 15 minutes."*

This guide transforms your Solana application from using predictable pseudo-randomness to leveraging Tsotchke's revolutionary Quantum-Inspired Random Number Generator (QRNG). Follow these straightforward steps to immediately enhance security, fairness, and user trust in your application.

## Prerequisites

Before you begin integrating Tsotchke QRNG, ensure you have:

- A Solana development environment set up
- Basic familiarity with Solana programming and SPL tokens
- Access to TSOTCHKE tokens for testing and production use
- Node.js and npm/yarn installed for JavaScript/TypeScript integrations

## Basic Usage (TypeScript/JavaScript)

### Initializing the QRNG Client

```typescript
import { Connection, Keypair } from '@solana/web3.js';
import { QrngClient } from '@tsotchke/solana-qrng';

// Connect to Solana (use mainnet for production)
const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');

// Create your wallet (for production, load from secure storage)
// This wallet must hold TSOTCHKE tokens
const wallet = Keypair.fromSecretKey(/* your secret key */);

// Initialize the QRNG client
const qrngClient = new QrngClient(connection);
```

### Checking Token Balance

Before generating random numbers, check if your wallet has enough TSOTCHKE tokens:

```typescript
// Check token balance
const balance = await qrngClient.getTokenBalance(wallet.publicKey);
console.log(`TSOTCHKE Token Balance: ${balance}`);

if (balance < 1) {
  console.error('Insufficient TSOTCHKE tokens. Each random number request costs 1 token.');
  // Handle the insufficient tokens case
  return;
}
```

### Generating Random Numbers

#### Random 64-bit Integer

```typescript
try {
  // Generate a random 64-bit unsigned integer
  const randomU64 = await qrngClient.generateRandomU64(wallet);
  console.log(`Random U64: ${randomU64}`);
  
  // If you need it as a regular JavaScript number (limited precision)
  const asNumber = Number(randomU64);
  console.log(`As Number: ${asNumber}`);
} catch (error) {
  console.error('Error generating random number:', error);
}
```

#### Random Floating-Point Number

```typescript
try {
  // Generate a random floating-point number between 0 and 1
  const randomDouble = await qrngClient.generateRandomDouble(wallet);
  console.log(`Random Double: ${randomDouble}`);
  
  // Scale to a desired range (e.g., 1-100)
  const scaled = 1 + Math.floor(randomDouble * 100);
  console.log(`Scaled to 1-100: ${scaled}`);
} catch (error) {
  console.error('Error generating random number:', error);
}
```

#### Random Boolean

```typescript
try {
  // Generate a random boolean (true/false)
  const randomBoolean = await qrngClient.generateRandomBoolean(wallet);
  console.log(`Random Boolean: ${randomBoolean}`);
} catch (error) {
  console.error('Error generating random boolean:', error);
}
```

## Advanced Usage

### Custom Configuration

You can customize the QRNG client with specific program IDs or treasury addresses:

```typescript
import { PublicKey } from '@solana/web3.js';

// Custom configuration
const customConfig = {
  programId: new PublicKey('F7E268Uek6YJvYCNaeamnxLy1umzPPTfrK2TiATxffQg'),
  tokenMint: new PublicKey('4mbdysBik3jmzD7mt6FGPDsMxnYcxExSQRFjPucdpump'),
  treasuryAddress: new PublicKey('3vuKcjqows8T19z7amN2XMkSdVcicqBuf5vVa8ZjaVfc')
};

// Initialize with custom config
const qrngClient = new QrngClient(connection, customConfig);
```

### Error Handling

Implement proper error handling to address common issues:

```typescript
try {
  const randomU64 = await qrngClient.generateRandomU64(wallet);
  // Process the random number
} catch (error) {
  if (error.message.includes('Insufficient TSOTCHKE tokens')) {
    // Handle insufficient token balance
    console.error('Please acquire more TSOTCHKE tokens to continue');
  } else if (error.message.includes('Transaction simulation failed')) {
    // Handle transaction simulation failures
    console.error('Transaction simulation failed, check Solana network status');
  } else if (error.message.includes('Transaction was not confirmed')) {
    // Handle confirmation timeouts
    console.error('Transaction was not confirmed in time, retry or check status');
  } else {
    // Handle other errors
    console.error('Unexpected error:', error);
  }
}
```

## Common Use Cases

### GameFi: Random Loot Drop

```typescript
async function generateLootDrop(wallet, rarityThresholds) {
  const randomValue = await qrngClient.generateRandomDouble(wallet);
  
  // Determine rarity based on thresholds
  if (randomValue < rarityThresholds.common) {
    return 'common';
  } else if (randomValue < rarityThresholds.uncommon) {
    return 'uncommon';
  } else if (randomValue < rarityThresholds.rare) {
    return 'rare';
  } else if (randomValue < rarityThresholds.epic) {
    return 'epic';
  } else {
    return 'legendary';
  }
}

// Example usage
const rarityThresholds = {
  common: 0.6,      // 60% chance
  uncommon: 0.85,   // 25% chance
  rare: 0.95,       // 10% chance
  epic: 0.99,       // 4% chance
  legendary: 1.0    // 1% chance
};

const lootRarity = await generateLootDrop(wallet, rarityThresholds);
console.log(`Player received ${lootRarity} loot!`);
```

### NFT: Random Trait Generation

```typescript
async function generateNftTraits(wallet, traitOptions) {
  const traits = {};
  
  for (const [traitName, options] of Object.entries(traitOptions)) {
    // Generate a random index
    const randomU64 = await qrngClient.generateRandomU64(wallet);
    const index = Number(randomU64 % BigInt(options.length));
    
    // Assign the trait
    traits[traitName] = options[index];
  }
  
  return traits;
}

// Example usage
const traitOptions = {
  background: ['Blue', 'Red', 'Green', 'Yellow', 'Purple'],
  body: ['Robot', 'Human', 'Alien', 'Animal'],
  eyes: ['Round', 'Square', 'Cat-like', 'Cybernetic'],
  mouth: ['Smile', 'Frown', 'Open', 'Closed']
};

const nftTraits = await generateNftTraits(wallet, traitOptions);
console.log('Generated NFT Traits:', nftTraits);
```

### DeFi: Fair Order Selection

```typescript
async function selectRandomTransactions(wallet, pendingTxs, count) {
  const selected = [];
  const txsCopy = [...pendingTxs];
  
  for (let i = 0; i < count && txsCopy.length > 0; i++) {
    // Generate random index
    const randomU64 = await qrngClient.generateRandomU64(wallet);
    const index = Number(randomU64 % BigInt(txsCopy.length));
    
    // Select transaction and remove from pool
    selected.push(txsCopy[index]);
    txsCopy.splice(index, 1);
  }
  
  return selected;
}

// Example usage
const pendingTransactions = [
  'tx1', 'tx2', 'tx3', 'tx4', 'tx5', 'tx6', 'tx7', 'tx8', 'tx9', 'tx10'
];

const selectedTxs = await selectRandomTransactions(wallet, pendingTransactions, 3);
console.log('Randomly selected transactions:', selectedTxs);
```

## Direct Program Invocation (Advanced)

For applications requiring direct program invocation:

```typescript
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
  SYSVAR_CLOCK_PUBKEY
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress
} from '@solana/spl-token';

async function generateRandomU64Direct(
  connection: Connection,
  wallet: Keypair,
  programId: PublicKey,
  tokenMint: PublicKey,
  treasuryAddress: PublicKey
) {
  // Find token accounts
  const userTokenAccount = await getAssociatedTokenAddress(
    tokenMint,
    wallet.publicKey
  );
  
  const treasuryTokenAccount = await getAssociatedTokenAddress(
    tokenMint,
    treasuryAddress
  );
  
  // Find config PDA
  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('token_qrng_config')],
    programId
  );
  
  // Create instruction
  const instruction = new TransactionInstruction({
    keys: [
      { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
      { pubkey: userTokenAccount, isSigner: false, isWritable: true },
      { pubkey: treasuryTokenAccount, isSigner: false, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: configPda, isSigner: false, isWritable: false },
      { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false }
    ],
    programId,
    data: Buffer.from([1]) // Instruction for generateRandomU64
  });
  
  // Create and send transaction
  const transaction = new Transaction().add(instruction);
  const signature = await sendAndConfirmTransaction(
    connection,
    transaction,
    [wallet],
    { commitment: 'confirmed' }
  );
  
  // Get transaction result with return data
  const txInfo = await connection.getTransaction(signature, {
    commitment: 'confirmed',
  });
  
  // Extract random number from return data
  const meta = txInfo?.meta as any;
  if (!meta || !meta.returnData || !meta.returnData.data) {
    throw new Error('No return data found in transaction');
  }
  
  // Decode the return data
  const returnData = Buffer.from(meta.returnData.data, 'base64');
  const randomU64 = returnData.readBigUInt64LE(0);
  
  return randomU64;
}
```

## Performance Optimization

### Batch Processing

When generating multiple random numbers, consider these approaches:

1. **Sequential Requests**: Simple but slower
   ```typescript
   const results = [];
   for (let i = 0; i < count; i++) {
     results.push(await qrngClient.generateRandomU64(wallet));
   }
   ```

2. **Extracting Multiple Values**: More efficient for some use cases
   ```typescript
   // Generate one 64-bit number and extract multiple values
   const randomU64 = await qrngClient.generateRandomU64(wallet);
   
   // Extract multiple 8-bit values (0-255)
   const values = [];
   for (let i = 0; i < 8; i++) {
     const byteValue = Number((randomU64 >> BigInt(i * 8)) & BigInt(0xFF));
     values.push(byteValue);
   }
   ```

3. **Parallel Requests**: Faster but uses more tokens
   ```typescript
   // Warning: This uses multiple tokens in parallel
   const promises = [];
   for (let i = 0; i < count; i++) {
     promises.push(qrngClient.generateRandomU64(wallet));
   }
   const results = await Promise.all(promises);
   ```

## Troubleshooting

### Common Issues

1. **Insufficient Token Balance**
   - Ensure your wallet has sufficient TSOTCHKE tokens
   - Each random number request costs 1 token

2. **Transaction Confirmation Timeout**
   - Solana network congestion can cause timeouts
   - Try increasing the confirmation commitment level or retry with backoff

3. **Invalid Account Data**
   - Ensure you're using the correct program ID and account addresses
   - Verify treasury and token mint addresses

4. **Error Parsing Return Data**
   - Ensure you're correctly parsing the return data based on the random number type
   - Different instructions return different data formats

### Debug Logs

Enable debug logs for detailed troubleshooting:

```typescript
// Enable debug mode when initializing the client
const qrngClient = new QrngClient(connection, { debug: true });
```

## Security Best Practices

1. **Key Security**
   - Never hardcode wallet private keys
   - Use secure key storage solutions

2. **Request Validation**
   - Verify random number ranges match expected bounds
   - Implement sanity checks on generated values

3. **Error Handling**
   - Gracefully handle and log all errors
   - Implement retry mechanisms with exponential backoff

4. **Token Management**
   - Monitor token balances proactively
   - Implement automatic token replenishment for production systems

## Support & Resources

For support, please refer to the provided documentation and examples in this repository.
