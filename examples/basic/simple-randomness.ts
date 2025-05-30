/**
 * TSOTCHKE QRNG Basic Example
 * 
 * This simple example demonstrates the most basic usage of the
 * TSOTCHKE QRNG service for everyday randomness needs.
 */

import { Connection, Keypair } from '@solana/web3.js';
import { QrngClient } from '@tsotchke/solana-qrng';

/**
 * Simple demonstrations of QRNG usage
 */
async function basicRandomnessExamples() {
  try {
    console.log('TSOTCHKE QRNG Basic Examples');
    console.log('============================');
    
    // Connect to Solana mainnet
    const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
    
    // Load your wallet (must have TSOTCHKE tokens)
    // In a real app, load a real wallet with TSOTCHKE tokens
    // For example: const secretKey = new Uint8Array(JSON.parse(fs.readFileSync('wallet.json', 'utf-8')));
    const wallet = Keypair.generate(); // Using generated keypair for example only
    
    // Initialize the QRNG client
    const qrngClient = new QrngClient(connection);
    
    // Check token balance before proceeding
    const balance = await qrngClient.getTokenBalance(wallet.publicKey);
    console.log(`\nTSOTCHKE Token Balance: ${balance}`);
    
    if (balance < 5) {
      console.warn('Warning: Low token balance. You need 1 token per random number request.');
      console.warn('Consider acquiring more tokens before running extensive operations.');
    }
    
    // Example 1: Generate a random integer
    console.log('\nExample 1: Random Integer');
    const randomU64 = await qrngClient.generateRandomU64(wallet);
    console.log(`Random U64: ${randomU64}`);
    console.log(`As Number: ${Number(randomU64)}`);
    
    // Example 2: Generate a random number between 1 and 100
    console.log('\nExample 2: Random Number in Range (1-100)');
    const randomInRange = (Number(randomU64) % 100) + 1;
    console.log(`Random number between 1-100: ${randomInRange}`);
    
    // Example 3: Generate a random floating point number between 0-1
    console.log('\nExample 3: Random Floating Point (0-1)');
    const randomDouble = await qrngClient.generateRandomDouble(wallet);
    console.log(`Random double: ${randomDouble}`);
    
    // Example 4: Percentage chance calculation (30% chance)
    console.log('\nExample 4: Percentage Chance (30%)');
    const randomPercentage = await qrngClient.generateRandomDouble(wallet);
    const success = randomPercentage < 0.3;
    console.log(`Random percentage roll: ${randomPercentage}`);
    console.log(`30% chance ${success ? 'succeeded!' : 'failed.'}`);
    
    // Example 5: Coin flip (true/false)
    console.log('\nExample 5: Coin Flip');
    const coinFlip = await qrngClient.generateRandomBoolean(wallet);
    console.log(`Coin flip result: ${coinFlip ? 'Heads' : 'Tails'}`);
    
    // Example 6: Random item from an array
    console.log('\nExample 6: Random Item Selection');
    const items = ['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry', 'Fig', 'Grape'];
    const randomIndexSeed = await qrngClient.generateRandomU64(wallet);
    const randomIndex = Number(randomIndexSeed % BigInt(items.length));
    console.log(`Items: ${items.join(', ')}`);
    console.log(`Randomly selected: ${items[randomIndex]}`);
    
    // Example 7: Shuffle an array
    console.log('\nExample 7: Array Shuffling');
    // We'll use the Fisher-Yates shuffle algorithm with our random numbers
    const originalArray = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
    const shuffledArray = [...originalArray];
    
    console.log(`Original array: ${originalArray.join(', ')}`);
    
    // For a proper shuffle, we need a random number for each swap
    for (let i = shuffledArray.length - 1; i > 0; i--) {
      // Get a random index between 0 and i (inclusive)
      const randomSeed = await qrngClient.generateRandomU64(wallet);
      const j = Number(randomSeed % BigInt(i + 1));
      
      // Swap elements
      [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
    }
    
    console.log(`Shuffled array: ${shuffledArray.join(', ')}`);
    
    // Example 8: Generate a secure random password
    console.log('\nExample 8: Secure Password Generation');
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    let password = '';
    
    // Generate 12 character password
    for (let i = 0; i < 12; i++) {
      const randomCharSeed = await qrngClient.generateRandomU64(wallet);
      const randomCharIndex = Number(randomCharSeed % BigInt(charset.length));
      password += charset[randomCharIndex];
    }
    
    console.log(`Generated password: ${password}`);
    
    // Check final token balance
    const finalBalance = await qrngClient.getTokenBalance(wallet.publicKey);
    console.log(`\nFinal TSOTCHKE Token Balance: ${finalBalance}`);
    console.log(`Tokens used: ${balance - finalBalance}`);
    
  } catch (error) {
    console.error('Error in basic examples:', error);
  }
}

/**
 * Practical example: Lottery ticket generator
 */
async function lotteryTicketGenerator(numberOfTickets: number): Promise<number[][]> {
  try {
    console.log('\nLottery Ticket Generator');
    console.log('=======================');
    
    // Connect to Solana mainnet
    const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
    
    // Load your wallet (must have TSOTCHKE tokens)
    // In a real application, you would load your wallet from a secure location
    // For example: const secretKey = new Uint8Array(JSON.parse(fs.readFileSync('./wallet.json', 'utf-8')));
    const wallet = Keypair.generate(); // Using a randomly generated keypair for example only
    
    // Initialize the QRNG client
    const qrngClient = new QrngClient(connection);
    
    // Check if we have enough tokens
    const balance = await qrngClient.getTokenBalance(wallet.publicKey);
    const estimatedTokens = numberOfTickets; // One random number per ticket
    
    if (balance < estimatedTokens) {
      console.error(`Not enough tokens. Need ${estimatedTokens} but only have ${balance}.`);
      return [];
    }
    
    console.log(`Generating ${numberOfTickets} lottery tickets...`);
    
    const tickets: number[][] = [];
    
    // Generate each ticket
    for (let i = 0; i < numberOfTickets; i++) {
      // For this example, we'll generate 6 numbers between 1-49
      const ticket = new Set<number>();
      
      // Keep adding numbers until we have 6 unique ones
      while (ticket.size < 6) {
        const randomSeed = await qrngClient.generateRandomU64(wallet);
        const number = (Number(randomSeed % BigInt(49)) + 1);
        ticket.add(number);
      }
      
      // Convert to array and sort numerically
      const sortedTicket = Array.from(ticket).sort((a, b) => a - b);
      tickets.push(sortedTicket);
      
      console.log(`Ticket ${i+1}: ${sortedTicket.join(' - ')}`);
    }
    
    // Final token balance
    const finalBalance = await qrngClient.getTokenBalance(wallet.publicKey);
    console.log(`\nTokens used: ${balance - finalBalance}`);
    
    return tickets;
  } catch (error) {
    console.error('Error generating lottery tickets:', error);
    return [];
  }
}

// Run the examples (uncomment to execute)
// basicRandomnessExamples();
// lotteryTicketGenerator(5);

/**
 * This example demonstrates:
 * 1. Basic random number generation (integers, doubles, booleans)
 * 2. Common randomness use cases (range selection, percentage chances)
 * 3. Practical applications (array shuffling, password generation)
 * 4. A complete lottery ticket generator example
 * 
 * Note: Each random number request costs 1 TSOTCHKE token,
 * so optimize your code to minimize unnecessary requests.
 */
