/**
 * Basic example of using the TSOTCHKE QRNG SDK
 */

import { Connection, Keypair } from '@solana/web3.js';
import { QrngClient } from '../src'; // Using the local SDK

async function basicUsageExample() {
  try {
    console.log('TSOTCHKE QRNG Basic Example');
    console.log('===========================');
    
    // Connect to Solana mainnet
    const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
    
    // Load your wallet (must have TSOTCHKE tokens)
    // In a real app, use a real wallet with tokens
    const wallet = Keypair.generate(); // Just for demo purposes
    
    // Initialize the QRNG client
    const qrng = new QrngClient(connection);
    
    // Check token balance before proceeding
    const balance = await qrng.getTokenBalance(wallet.publicKey);
    console.log(`\nTSOTCHKE Token Balance: ${balance}`);
    
    if (balance < 3) {
      console.warn('Warning: Low token balance. You need 1 token per random number request.');
      console.warn('This example requires at least 3 tokens to run all demonstrations.');
      // Continue anyway for demonstration purposes
    }
    
    // Example 1: Generate a random integer
    console.log('\nExample 1: Random Integer');
    const randomU64 = await qrng.generateRandomU64(wallet);
    console.log(`Random U64: ${randomU64}`);
    console.log(`As Number: ${Number(randomU64)}`);
    
    // Example 2: Generate a random floating point number between 0-1
    console.log('\nExample 2: Random Floating Point (0-1)');
    const randomDouble = await qrng.generateRandomDouble(wallet);
    console.log(`Random double: ${randomDouble}`);
    
    // Example 3: Random boolean (true/false)
    console.log('\nExample 3: Random Boolean');
    const randomBoolean = await qrng.generateRandomBoolean(wallet);
    console.log(`Random boolean: ${randomBoolean ? 'true' : 'false'}`);
    
    // Example 4: Using a random number for a practical purpose - dice roll
    console.log('\nExample 4: Dice Roll (1-6)');
    const diceRoll = (Number(randomU64 % BigInt(6)) + 1);
    console.log(`Dice roll result: ${diceRoll}`);
    
    // Final token balance
    const finalBalance = await qrng.getTokenBalance(wallet.publicKey);
    console.log(`\nFinal TSOTCHKE Token Balance: ${finalBalance}`);
    console.log(`Tokens used: ${balance - finalBalance}`);
    
  } catch (error) {
    console.error('Error in example:', error);
  }
}

// To run this example:
// 1. Make sure you have TSOTCHKE tokens in your wallet
// 2. Uncomment the line below
// basicUsageExample();
