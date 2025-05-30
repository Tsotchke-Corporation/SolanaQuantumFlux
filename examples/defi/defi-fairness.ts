/**
 * TSOTCHKE QRNG DeFi Example
 * 
 * This example demonstrates how to use the TSOTCHKE QRNG service
 * for fair selection processes in DeFi applications, including:
 * - Liquidation selection
 * - Yield distribution
 * - Governance participant selection
 */

import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { QrngClient } from '@tsotchke/solana-qrng';

// Define borrower position structure
interface Position {
  id: string;
  borrower: PublicKey;
  collateralAmount: number;
  borrowedAmount: number;
  healthFactor: number;  // < 1.0 means underwater
  lastUpdated: number;
}

// Define reward distribution participant
interface RewardParticipant {
  wallet: PublicKey;
  stakedAmount: number;
  stakeDuration: number;  // in days
  weight: number;  // calculated from stake amount and duration
}

// Define governance sample structure
interface GovernanceProposal {
  id: string;
  title: string;
  description: string;
  proposer: PublicKey;
  options: string[];
  votes: { [option: string]: number };
  committee: PublicKey[];  // randomly selected validators
}

/**
 * DeFi application that demonstrates various randomness use cases
 */
class DeFiProtocol {
  private qrngClient: QrngClient;
  private protocolWallet: Keypair;
  
  constructor(connection: Connection, protocolWallet: Keypair) {
    this.qrngClient = new QrngClient(connection);
    this.protocolWallet = protocolWallet;
  }
  
  /**
   * Fair Liquidation Selection Process
   * 
   * This function selects positions for liquidation when they fall below
   * a health factor threshold. Instead of a first-come-first-serve approach,
   * which favors MEV bots, we use QRNG to select positions fairly.
   */
  async selectPositionsForLiquidation(
    allPositions: Position[],
    maxLiquidations: number
  ): Promise<Position[]> {
    console.log("Starting fair liquidation selection process...");
    
    // Filter positions that are underwater (health factor < 1.0)
    const liquidatablePositions = allPositions.filter(
      position => position.healthFactor < 1.0
    );
    
    console.log(`Found ${liquidatablePositions.length} positions eligible for liquidation`);
    
    if (liquidatablePositions.length === 0) {
      return [];
    }
    
    // If we have fewer underwater positions than our max, liquidate them all
    if (liquidatablePositions.length <= maxLiquidations) {
      return liquidatablePositions;
    }
    
    // Otherwise, randomly select positions to avoid MEV exploitation
    const selectedPositions: Position[] = [];
    const remainingPositions = [...liquidatablePositions];
    
    for (let i = 0; i < maxLiquidations && remainingPositions.length > 0; i++) {
      // Get a random index using QRNG
      const randomU64 = await this.qrngClient.generateRandomU64(this.protocolWallet);
      const randomIndex = Number(randomU64 % BigInt(remainingPositions.length));
      
      // Select the position at the random index
      const selectedPosition = remainingPositions[randomIndex];
      selectedPositions.push(selectedPosition);
      
      // Remove the selected position from the remaining positions
      remainingPositions.splice(randomIndex, 1);
      
      console.log(`Selected position ${selectedPosition.id} for liquidation (Health Factor: ${selectedPosition.healthFactor})`);
    }
    
    return selectedPositions;
  }
  
  /**
   * Random Bonus Yield Distribution
   * 
   * This function distributes bonus yield to a subset of stakers,
   * selected randomly but weighted by their stake amount and duration.
   */
  async distributeBonusYield(
    participants: RewardParticipant[],
    totalBonusAmount: number,
    numberOfRecipients: number
  ): Promise<{ recipient: PublicKey, amount: number }[]> {
    console.log(`Distributing ${totalBonusAmount} bonus tokens to ${numberOfRecipients} recipients...`);
    
    // Calculate total weight across all participants
    const totalWeight = participants.reduce((sum, p) => sum + p.weight, 0);
    
    // Prepare array for tracking selected recipients
    const selectedRecipients: { recipient: PublicKey, amount: number }[] = [];
    const remainingParticipants = [...participants];
    
    // Select recipients based on weighted probability
    for (let i = 0; i < numberOfRecipients && remainingParticipants.length > 0; i++) {
      // Get random number between 0-1
      const randomValue = await this.qrngClient.generateRandomDouble(this.protocolWallet);
      
      // Find participant based on weighted selection
      let cumulativeWeight = 0;
      let selectedIndex = -1;
      
      for (let j = 0; j < remainingParticipants.length; j++) {
        // Calculate this participant's weight as a fraction of total
        const participant = remainingParticipants[j];
        const weightFraction = participant.weight / totalWeight;
        
        cumulativeWeight += weightFraction;
        
        // If random value is less than cumulative weight, select this participant
        if (randomValue <= cumulativeWeight) {
          selectedIndex = j;
          break;
        }
      }
      
      // If no participant was selected (due to rounding), pick the last one
      if (selectedIndex === -1) {
        selectedIndex = remainingParticipants.length - 1;
      }
      
      // Calculate bonus amount (divide equally among recipients)
      const bonusAmount = totalBonusAmount / numberOfRecipients;
      
      // Add to selected recipients
      const selected = remainingParticipants[selectedIndex];
      selectedRecipients.push({
        recipient: selected.wallet,
        amount: bonusAmount
      });
      
      console.log(`Selected ${selected.wallet.toString().slice(0, 10)}... for bonus yield of ${bonusAmount}`);
      
      // Remove from remaining participants
      remainingParticipants.splice(selectedIndex, 1);
    }
    
    return selectedRecipients;
  }
  
  /**
   * Random Governance Committee Selection
   * 
   * This function randomly selects a committee of validators to oversee
   * a governance proposal, ensuring fair representation.
   */
  async selectGovernanceCommittee(
    allValidators: PublicKey[],
    committeeSize: number,
    proposalId: string
  ): Promise<PublicKey[]> {
    console.log(`Selecting governance committee of size ${committeeSize} for proposal ${proposalId}...`);
    
    // Ensure we don't try to select more validators than are available
    const actualSize = Math.min(committeeSize, allValidators.length);
    
    // Copy the validators array to avoid modifying the original
    const remainingValidators = [...allValidators];
    const committee: PublicKey[] = [];
    
    // Select committee members randomly
    for (let i = 0; i < actualSize; i++) {
      // Generate random index
      const randomU64 = await this.qrngClient.generateRandomU64(this.protocolWallet);
      const randomIndex = Number(randomU64 % BigInt(remainingValidators.length));
      
      // Add the validator at the random index to the committee
      const selectedValidator = remainingValidators[randomIndex];
      committee.push(selectedValidator);
      
      // Remove the selected validator from consideration for the next selection
      remainingValidators.splice(randomIndex, 1);
      
      console.log(`Selected validator ${selectedValidator.toString().slice(0, 10)}... for committee`);
    }
    
    return committee;
  }
  
  /**
   * Pseudorandom but Deterministic Transaction Ordering
   * 
   * This function creates a deterministic but unpredictable ordering of transactions
   * to prevent front-running in AMM trades, IDO participation, etc.
   */
  async createFairTransactionOrdering(
    transactions: { txId: string, sender: PublicKey, timestamp: number }[],
    blockHash: string
  ): Promise<{ txId: string, sender: PublicKey, timestamp: number, priority: number }[]> {
    console.log(`Creating fair transaction ordering for ${transactions.length} transactions...`);
    
    // Use the block hash as a seed for randomness to ensure determinism
    // In a real implementation, this would be an on-chain commitment
    const blockHashSeed = BigInt('0x' + blockHash.slice(0, 16));
    
    // Generate a random number for each transaction using QRNG
    const txWithPriority = await Promise.all(
      transactions.map(async (tx, index) => {
        // In real implementation, this would be done through an on-chain program
        // that uses a combination of the block hash and transaction details
        const randomU64 = await this.qrngClient.generateRandomU64(this.protocolWallet);
        
        // XOR with block hash seed for determinism
        const priorityValue = randomU64 ^ blockHashSeed;
        
        return {
          ...tx,
          priority: Number(priorityValue & BigInt(0xFFFFFFFF)) // Use lower 32 bits for priority
        };
      })
    );
    
    // Sort by priority (higher value = higher priority)
    const orderedTransactions = txWithPriority.sort((a, b) => b.priority - a.priority);
    
    // Log the ordered transactions
    console.log("Transaction ordering:");
    orderedTransactions.forEach((tx, index) => {
      console.log(`${index + 1}. ${tx.txId} (Priority: ${tx.priority})`);
    });
    
    return orderedTransactions;
  }
  
  /**
   * Verifiable Random Price Oracle Sampling
   * 
   * This function randomly selects price oracle feeds to include in an
   * aggregate price calculation, to prevent manipulation.
   */
  async getRandomOracleSample(
    oracleFeeds: { provider: string, price: number }[],
    sampleSize: number
  ): Promise<{ provider: string, price: number, averagePrice: number }> {
    console.log(`Sampling ${sampleSize} oracles from ${oracleFeeds.length} available feeds...`);
    
    // Ensure we don't try to sample more feeds than are available
    const actualSampleSize = Math.min(sampleSize, oracleFeeds.length);
    
    // Copy the feeds array to avoid modifying the original
    const remainingFeeds = [...oracleFeeds];
    const selectedFeeds: { provider: string, price: number }[] = [];
    
    // Select feeds randomly
    for (let i = 0; i < actualSampleSize; i++) {
      // Generate random index
      const randomU64 = await this.qrngClient.generateRandomU64(this.protocolWallet);
      const randomIndex = Number(randomU64 % BigInt(remainingFeeds.length));
      
      // Add the feed at the random index to the selected feeds
      const selectedFeed = remainingFeeds[randomIndex];
      selectedFeeds.push(selectedFeed);
      
      // Remove the selected feed from consideration for the next selection
      remainingFeeds.splice(randomIndex, 1);
      
      console.log(`Selected oracle: ${selectedFeed.provider} (Price: ${selectedFeed.price})`);
    }
    
    // Calculate the average price from the selected feeds
    const totalPrice = selectedFeeds.reduce((sum, feed) => sum + feed.price, 0);
    const averagePrice = totalPrice / selectedFeeds.length;
    
    console.log(`Average oracle price: ${averagePrice}`);
    
    return {
      ...selectedFeeds[0], // Just to maintain the structure, not actually used
      price: selectedFeeds[0].price, // Same as above
      averagePrice
    };
  }
}

/**
 * Example usage
 */
async function runDeFiExample() {
  try {
    // Connect to Solana mainnet
    const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
    
    // Load protocol wallet (must have TSOTCHKE tokens)
    // In a real application, you would load your wallet from a secure location
    // For example: const secretKey = new Uint8Array(JSON.parse(fs.readFileSync('./wallet.json', 'utf-8')));
    const protocolWallet = Keypair.generate(); // Using a randomly generated keypair for example only
    
    // Initialize the DeFi protocol
    const defiProtocol = new DeFiProtocol(connection, protocolWallet);
    
    // ---------------------------------------------------
    // Example 1: Fair Liquidation Selection
    // ---------------------------------------------------
    
    // Create some sample positions (in a real app, these would come from on-chain data)
    const positions: Position[] = [
      {
        id: "pos1",
        borrower: Keypair.generate().publicKey,
        collateralAmount: 1000,
        borrowedAmount: 800,
        healthFactor: 1.2,
        lastUpdated: Date.now()
      },
      {
        id: "pos2",
        borrower: Keypair.generate().publicKey,
        collateralAmount: 500,
        borrowedAmount: 600,
        healthFactor: 0.85,  // underwater
        lastUpdated: Date.now()
      },
      {
        id: "pos3",
        borrower: Keypair.generate().publicKey,
        collateralAmount: 1500,
        borrowedAmount: 1700,
        healthFactor: 0.78,  // underwater
        lastUpdated: Date.now()
      },
      {
        id: "pos4",
        borrower: Keypair.generate().publicKey,
        collateralAmount: 2000,
        borrowedAmount: 1900,
        healthFactor: 0.95,  // underwater
        lastUpdated: Date.now()
      },
      {
        id: "pos5",
        borrower: Keypair.generate().publicKey,
        collateralAmount: 800,
        borrowedAmount: 900,
        healthFactor: 0.82,  // underwater
        lastUpdated: Date.now()
      }
    ];
    
    // Select positions for liquidation (maximum 2 per round)
    console.log("\nExample 1: Fair Liquidation Selection");
    const liquidations = await defiProtocol.selectPositionsForLiquidation(positions, 2);
    console.log(`Selected ${liquidations.length} positions for liquidation`);
    
    // ---------------------------------------------------
    // Example 2: Random Bonus Yield Distribution
    // ---------------------------------------------------
    
    // Create some sample stakers (in a real app, these would come from on-chain data)
    const stakers: RewardParticipant[] = [
      {
        wallet: Keypair.generate().publicKey,
        stakedAmount: 1000,
        stakeDuration: 30,
        weight: 1000 * Math.sqrt(30)  // weight formula: amount * sqrt(duration)
      },
      {
        wallet: Keypair.generate().publicKey,
        stakedAmount: 5000,
        stakeDuration: 90,
        weight: 5000 * Math.sqrt(90)
      },
      {
        wallet: Keypair.generate().publicKey,
        stakedAmount: 500,
        stakeDuration: 180,
        weight: 500 * Math.sqrt(180)
      },
      {
        wallet: Keypair.generate().publicKey,
        stakedAmount: 2000,
        stakeDuration: 60,
        weight: 2000 * Math.sqrt(60)
      },
      {
        wallet: Keypair.generate().publicKey,
        stakedAmount: 3000,
        stakeDuration: 120,
        weight: 3000 * Math.sqrt(120)
      }
    ];
    
    // Distribute bonus yield to 3 lucky stakers
    console.log("\nExample 2: Random Bonus Yield Distribution");
    const bonusDistribution = await defiProtocol.distributeBonusYield(stakers, 1000, 3);
    console.log(`Distributed bonus yield to ${bonusDistribution.length} stakers`);
    
    // ---------------------------------------------------
    // Example 3: Random Governance Committee Selection
    // ---------------------------------------------------
    
    // Create some sample validators (in a real app, these would come from on-chain data)
    const validators = Array.from({ length: 10 }, () => Keypair.generate().publicKey);
    
    // Select a committee of 5 validators for a governance proposal
    console.log("\nExample 3: Random Governance Committee Selection");
    const committee = await defiProtocol.selectGovernanceCommittee(
      validators,
      5,
      "prop-2023-05-improvements"
    );
    console.log(`Selected committee of ${committee.length} validators`);
    
    // ---------------------------------------------------
    // Example 4: Fair Transaction Ordering
    // ---------------------------------------------------
    
    // Create some sample transactions (in a real app, these would be actual txs)
    const transactions = Array.from({ length: 8 }, (_, i) => ({
      txId: `tx-${i+1}`,
      sender: Keypair.generate().publicKey,
      timestamp: Date.now() - (Math.random() * 1000)  // Random timestamp within the last second
    }));
    
    // Create fair ordering based on a block hash
    console.log("\nExample 4: Fair Transaction Ordering");
    const mockBlockHash = "d9b5b0b3a2c1f0e8d7c6b5a4b3c2d1f0";
    const orderedTransactions = await defiProtocol.createFairTransactionOrdering(
      transactions,
      mockBlockHash
    );
    
    // ---------------------------------------------------
    // Example 5: Verifiable Random Price Oracle Sampling
    // ---------------------------------------------------
    
    // Create some sample oracle feeds (in a real app, these would come from on-chain data)
    const oracleFeeds = [
      { provider: "Pyth", price: 1.015 },
      { provider: "Chainlink", price: 1.02 },
      { provider: "Switchboard", price: 1.017 },
      { provider: "Band Protocol", price: 1.022 },
      { provider: "API3", price: 1.018 },
      { provider: "DIA", price: 1.019 },
      { provider: "Tellor", price: 1.021 }
    ];
    
    // Get a random sample of oracle feeds for price calculation
    console.log("\nExample 5: Verifiable Random Price Oracle Sampling");
    const oracleSample = await defiProtocol.getRandomOracleSample(oracleFeeds, 3);
    console.log(`Final oracle price: ${oracleSample.averagePrice}`);
    
  } catch (error) {
    console.error("Error in DeFi example:", error);
  }
}

// Run the example (uncomment to execute)
// runDeFiExample();

/**
 * This example demonstrates several key DeFi use cases for QRNG:
 * 1. Fair liquidation selection to prevent MEV exploitation
 * 2. Random but weighted yield distribution for bonus rewards
 * 3. Unbiased governance committee selection
 * 4. Fair transaction ordering to prevent front-running
 * 5. Random oracle sampling for manipulation-resistant price feeds
 * 
 * In a real DeFi protocol, these functions would be implemented
 * as on-chain programs that call the QRNG service directly.
 */
