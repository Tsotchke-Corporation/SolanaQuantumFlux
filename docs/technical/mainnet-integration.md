# Mainnet Power: Integrating Tsotchke QRNG Into Production Systems

> *"The difference between a good application and a revolutionary one often comes down to the quality of randomness it employs."*

This comprehensive guide will walk you through the process of integrating Tsotchke's groundbreaking Quantum-Inspired Random Number Generator directly into your production applications on Solana mainnet. Follow these battle-tested steps to transform your application with military-grade randomness that users can truly trust.

## Essential Mainnet Parameters

```
╔═══════════════════╦═══════════════════════════════════════════════════╗
║ Program ID        ║ F7E268Uek6YJvYCNaeamnxLy1umzPPTfrK2TiATxffQg      ║
╠═══════════════════╬═══════════════════════════════════════════════════╣
║ Token Mint        ║ 4mbdysBik3jmzD7mt6FGPDsMxnYcxExSQRFjPucdpump      ║
╠═══════════════════╬═══════════════════════════════════════════════════╣
║ Treasury Address  ║ 3vuKcjqows8T19z7amN2XMkSdVcicqBuf5vVa8ZjaVfc      ║
╠═══════════════════╬═══════════════════════════════════════════════════╣
║ Price Per Request ║ 1.0 TSOTCHKE                                      ║
╚═══════════════════╩═══════════════════════════════════════════════════╝
```

## Prerequisites

To use the QRNG service, you need:

1. A Solana wallet with SOL for transaction fees
2. TSOTCHKE tokens in an associated token account
3. Solana web3.js and SPL Token libraries

## Integration Steps

### 1. Setup Dependencies

Clone this repository:
```bash
git clone https://github.com/tsotchke-corporation/SolanaQuantumFlux.git
cd SolanaQuantumFlux
```

Install dependencies for the SDK:
```bash
cd sdk
npm install
```

Install dependencies for examples:
```bash
cd ../examples
npm install
```

### 2. Import Required Modules

```typescript
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
  ComputeBudgetProgram,
} from '@solana/web3.js';
import {
  getOrCreateAssociatedTokenAccount,
  getAccount,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
```

### 3. Configure Connection and Accounts

```typescript
// Connect to Solana mainnet
const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');

// Program and token information
const PROGRAM_ID = new PublicKey('F7E268Uek6YJvYCNaeamnxLy1umzPPTfrK2TiATxffQg');
const TSOTCHKE_TOKEN_MINT = new PublicKey('4mbdysBik3jmzD7mt6FGPDsMxnYcxExSQRFjPucdpump');
const TREASURY_ADDRESS = new PublicKey('3vuKcjqows8T19z7amN2XMkSdVcicqBuf5vVa8ZjaVfc');

// Load your wallet keypair
const payer = Keypair.fromSecretKey(/* your wallet secret key */);

// Get the user's token account
const userTokenAccount = await getOrCreateAssociatedTokenAccount(
  connection,
  payer,
  TSOTCHKE_TOKEN_MINT,
  payer.publicKey
);

// Get treasury token account
const treasuryTokenAccount = await getOrCreateAssociatedTokenAccount(
  connection,
  payer,  // Only for account creation if it doesn't exist
  TSOTCHKE_TOKEN_MINT,
  TREASURY_ADDRESS,
  true  // Allow off-curve addresses for PDA support
);
```

### 4. Request a Random Number

```typescript
// Instruction types
const GENERATE_RANDOM_U64 = 1;     // For uint64 random number
const GENERATE_RANDOM_DOUBLE = 2;  // For double between 0-1
const GENERATE_RANDOM_BOOLEAN = 3; // For boolean

async function requestRandomNumber() {
  // Find the program config PDA
  const [configAddress, _] = PublicKey.findProgramAddressSync(
    [Buffer.from('token_qrng_config')],
    PROGRAM_ID
  );

  // Create instruction data - use the appropriate type
  const instructionData = Buffer.from([GENERATE_RANDOM_U64]);

  // Optional: Set compute budget to optimize costs
  const computeBudgetIx = ComputeBudgetProgram.setComputeUnitLimit({
    units: 200_000
  });

  // Find the clock sysvar
  const SYSVAR_CLOCK_PUBKEY = new PublicKey('SysvarC1ock11111111111111111111111111111111');

  // Create transaction
  const transaction = new Transaction()
    .add(computeBudgetIx)
    .add({
      keys: [
        { pubkey: payer.publicKey, isSigner: true, isWritable: true },
        { pubkey: userTokenAccount.address, isSigner: false, isWritable: true },
        { pubkey: treasuryTokenAccount.address, isSigner: false, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: configAddress, isSigner: false, isWritable: false },
        { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_ID,
      data: instructionData,
    });

  // Send transaction
  const signature = await sendAndConfirmTransaction(
    connection,
    transaction,
    [payer],
    { commitment: 'confirmed' }
  );

  console.log('Transaction signature:', signature);
  
  return signature;
}
```

### 5. Extract the Random Number

```typescript
async function getRandomNumber(signature) {
  // Get transaction details
  const txInfo = await connection.getTransaction(signature, {
    commitment: 'confirmed',
    maxSupportedTransactionVersion: 0
  });

  const meta = txInfo?.meta;

  if (meta && meta.returnData) {
    const returnData = meta.returnData;
    const encoded = Array.isArray(returnData) ? returnData[0] : '';
    const encoding = Array.isArray(returnData) ? returnData[1] : '';

    if (encoding === 'base64' && encoded) {
      const data = Buffer.from(encoded, 'base64');
      
      // Different formats need different extraction methods
      
      // For U64 (GENERATE_RANDOM_U64)
      if (data.length >= 8) {
        const randomU64BigInt = data.readBigUInt64LE(0);
        const randomU64 = Number(randomU64BigInt);
        console.log(`Generated random U64: ${randomU64}`);
        return { randomU64 };
      }
      
      // For Double (GENERATE_RANDOM_DOUBLE)
      if (data.length >= 8) {
        const randomDouble = data.readDoubleLE(0);
        console.log(`Generated random double: ${randomDouble}`);
        return { randomDouble };
      }
      
      // For Boolean (GENERATE_RANDOM_BOOLEAN)
      if (data.length >= 1) {
        const randomBoolean = data[0] === 1;
        console.log(`Generated random boolean: ${randomBoolean}`);
        return { randomBoolean };
      }
    }
  }
  
  throw new Error('Failed to extract random number from transaction');
}
```

### 6. Complete Example

```typescript
async function main() {
  try {
    // Check token balance first
    const tokenBalance = (await getAccount(connection, userTokenAccount.address)).amount;
    console.log(`Token balance: ${Number(tokenBalance) / 1_000_000} TSOTCHKE`);

    if (Number(tokenBalance) < 1_000_000) {
      console.error('Not enough tokens! Need at least 1.0 TSOTCHKE');
      return;
    }

    // Request random number
    const signature = await requestRandomNumber();
    
    // Extract the random value
    const randomData = await getRandomNumber(signature);
    
    // Use the random number in your application
    console.log(`Using random number:`, randomData);
    
    // Check new token balance
    const newTokenBalance = (await getAccount(connection, userTokenAccount.address)).amount;
    console.log(`New token balance: ${Number(newTokenBalance) / 1_000_000} TSOTCHKE`);
    console.log(`Tokens spent: ${(Number(tokenBalance) - Number(newTokenBalance)) / 1_000_000} TSOTCHKE`);
  } catch (error) {
    console.error('Error:', error);
  }
}
```

## Available Random Number Types

You can request different types of random numbers by changing the instruction data:

1. **GENERATE_RANDOM_U64 (1)** - Produces a random unsigned 64-bit integer
2. **GENERATE_RANDOM_DOUBLE (2)** - Produces a random double between 0 and 1
3. **GENERATE_RANDOM_BOOLEAN (3)** - Produces a random boolean (true/false)

## Using the Random Numbers

Different applications can leverage random numbers in various ways:

### Gaming Applications

```typescript
// Random dice roll (1-6)
const diceRoll = (randomU64 % 6) + 1;

// Random card from a deck (0-51)
const cardIndex = randomU64 % 52;

// Random item drop with 25% chance
const itemDrops = randomDouble < 0.25;
```

### NFT Applications

```typescript
// Generate random NFT attributes
const rarity = randomU64 % 5; // 0-4 rarity tiers
const colorIndex = randomU64 % colorPalette.length;
const hasMagicPower = randomBoolean;
```

### DeFi Applications

```typescript
// Random selection from a set of accounts for rewards
const selectedIndex = randomU64 % accountList.length;
const selectedAccount = accountList[selectedIndex];

// Random reward multiplier between 1.0 and 2.0
const rewardMultiplier = 1.0 + randomDouble;
```

## Optimizing Gas Costs

To minimize transaction costs:

1. Include the compute budget instruction to set an appropriate limit
2. Batch multiple random number requests when possible
3. Use a priority fee only when network congestion is high

## Error Handling

Common errors to handle:

1. **Insufficient token balance** - User doesn't have enough TSOTCHKE
2. **Insufficient SOL balance** - Not enough SOL to pay for gas
3. **Transaction confirmation timeout** - Network congestion issues
4. **Invalid return data** - Program may have changed or encountered an error

## Security Considerations

1. **Token Security** - Secure your TSOTCHKE tokens appropriately
2. **Keypair Protection** - Never expose your wallet's private key
3. **Confirmation Levels** - Wait for appropriate confirmation level for your use case
4. **Rate Limiting** - Implement appropriate rate limiting for your application

## Getting TSOTCHKE Tokens

TSOTCHKE tokens can be acquired through:

1. DEXs like [Jupiter Aggregator][https://jup.ag/tokens/4mbdysBik3jmzD7mt6FGPDsMxnYcxExSQRFjPucdpump]
2. Direct purchase from the Treasury
3. Participating in the project's upcoming token distribution events

For questions or support, please contact the development team through our GitHub repository or via email through dev@tsotchke.net.
