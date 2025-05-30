/**
 * TSOTCHKE QRNG NFT Example
 * 
 * This example demonstrates how to use the TSOTCHKE QRNG service
 * for generating random NFT traits and provably fair collections.
 */

import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { QrngClient } from '@tsotchke/solana-qrng';

// Define NFT trait categories and possible values
interface TraitOption {
  name: string;
  weight: number; // Relative probability weight
  rarity: number; // Rarity percentage (for display)
}

interface TraitCategory {
  name: string;
  options: TraitOption[];
}

// Example trait definitions for an NFT collection
const TRAIT_CATEGORIES: TraitCategory[] = [
  {
    name: "Background",
    options: [
      { name: "Blue Sky", weight: 40, rarity: 40 },
      { name: "Night Sky", weight: 30, rarity: 30 },
      { name: "Cyberpunk City", weight: 15, rarity: 15 },
      { name: "Cosmic Void", weight: 10, rarity: 10 },
      { name: "Golden Paradise", weight: 5, rarity: 5 }
    ]
  },
  {
    name: "Species",
    options: [
      { name: "Human", weight: 50, rarity: 50 },
      { name: "Elf", weight: 25, rarity: 25 },
      { name: "Robot", weight: 15, rarity: 15 },
      { name: "Alien", weight: 8, rarity: 8 },
      { name: "Deity", weight: 2, rarity: 2 }
    ]
  },
  {
    name: "Clothing",
    options: [
      { name: "Casual", weight: 45, rarity: 45 },
      { name: "Formal", weight: 25, rarity: 25 },
      { name: "Armor", weight: 15, rarity: 15 },
      { name: "Futuristic", weight: 10, rarity: 10 },
      { name: "Mythical", weight: 5, rarity: 5 }
    ]
  },
  {
    name: "Accessory",
    options: [
      { name: "None", weight: 30, rarity: 30 },
      { name: "Glasses", weight: 25, rarity: 25 },
      { name: "Hat", weight: 20, rarity: 20 },
      { name: "Necklace", weight: 15, rarity: 15 },
      { name: "Crown", weight: 7, rarity: 7 },
      { name: "Ethereal Aura", weight: 3, rarity: 3 }
    ]
  },
  {
    name: "Special Power",
    options: [
      { name: "None", weight: 70, rarity: 70 },
      { name: "Telekinesis", weight: 10, rarity: 10 },
      { name: "Time Control", weight: 8, rarity: 8 },
      { name: "Elemental Magic", weight: 7, rarity: 7 },
      { name: "Invisibility", weight: 3, rarity: 3 },
      { name: "Omniscience", weight: 2, rarity: 2 }
    ]
  }
];

// Define NFT structure
interface NFT {
  id: number;
  name: string;
  traits: {
    [category: string]: string;
  };
  rarityScore: number;
  image?: string; // In a real implementation, this would be the image URI
}

/**
 * NFT Collection Generator that uses QRNG for trait selection
 */
class NFTCollectionGenerator {
  private qrngClient: QrngClient;
  private creatorWallet: Keypair;
  
  constructor(connection: Connection, creatorWallet: Keypair) {
    this.qrngClient = new QrngClient(connection);
    this.creatorWallet = creatorWallet;
  }
  
  /**
   * Generate a single NFT with random traits
   */
  async generateNFT(id: number, namePrefix: string): Promise<NFT> {
    console.log(`Generating NFT #${id}...`);
    
    const traits: {[category: string]: string} = {};
    let rarityScore = 0;
    
    // Generate traits for each category
    for (const category of TRAIT_CATEGORIES) {
      const traitValue = await this.selectRandomTrait(category);
      traits[category.name] = traitValue.name;
      
      // Calculate rarity contribution (rarer traits = higher score)
      rarityScore += 100 - traitValue.rarity;
    }
    
    // Normalize rarity score (0-100 scale)
    rarityScore = Math.min(100, Math.max(0, rarityScore / TRAIT_CATEGORIES.length));
    
    const nft: NFT = {
      id,
      name: `${namePrefix} #${id}`,
      traits,
      rarityScore: Math.round(rarityScore * 100) / 100 // Round to 2 decimal places
    };
    
    console.log(`Generated NFT: ${nft.name} (Rarity Score: ${nft.rarityScore})`);
    return nft;
  }
  
  /**
   * Select a random trait from a category based on weighted probabilities
   */
  private async selectRandomTrait(category: TraitCategory): Promise<TraitOption> {
    // Get random value between 0-1
    const randomValue = await this.qrngClient.generateRandomDouble(this.creatorWallet);
    
    // Calculate total weight
    const totalWeight = category.options.reduce((sum, option) => sum + option.weight, 0);
    
    // Convert random value to weighted selection
    let cumulativeWeight = 0;
    
    for (const option of category.options) {
      cumulativeWeight += option.weight;
      
      // If the random value falls within this option's range, select it
      if (randomValue <= cumulativeWeight / totalWeight) {
        return option;
      }
    }
    
    // Fallback (should never happen with proper weights)
    return category.options[0];
  }
  
  /**
   * Generate a collection of NFTs
   */
  async generateCollection(
    size: number, 
    collectionName: string
  ): Promise<{ 
    nfts: NFT[], 
    rarityDistribution: {[range: string]: number},
    traitDistribution: {[trait: string]: number}
  }> {
    console.log(`Generating collection: ${collectionName} (${size} NFTs)`);
    
    const nfts: NFT[] = [];
    const traitCounts: {[trait: string]: number} = {};
    
    // Generate each NFT
    for (let i = 1; i <= size; i++) {
      const nft = await this.generateNFT(i, collectionName);
      nfts.push(nft);
      
      // Track trait distributions
      for (const [category, trait] of Object.entries(nft.traits)) {
        const key = `${category}:${trait}`;
        traitCounts[key] = (traitCounts[key] || 0) + 1;
      }
    }
    
    // Calculate rarity distribution
    const rarityRanges = {
      "Common (0-25)": 0,
      "Uncommon (25-50)": 0,
      "Rare (50-75)": 0,
      "Epic (75-90)": 0,
      "Legendary (90-100)": 0
    };
    
    nfts.forEach(nft => {
      if (nft.rarityScore < 25) {
        rarityRanges["Common (0-25)"]++;
      } else if (nft.rarityScore < 50) {
        rarityRanges["Uncommon (25-50)"]++;
      } else if (nft.rarityScore < 75) {
        rarityRanges["Rare (50-75)"]++;
      } else if (nft.rarityScore < 90) {
        rarityRanges["Epic (75-90)"]++;
      } else {
        rarityRanges["Legendary (90-100)"]++;
      }
    });
    
    // Calculate percentage distributions
    const traitDistribution: {[trait: string]: number} = {};
    for (const [trait, count] of Object.entries(traitCounts)) {
      traitDistribution[trait] = Math.round((count / size) * 1000) / 10; // Percentage with 1 decimal
    }
    
    console.log(`Collection generation complete. ${size} NFTs created.`);
    
    return {
      nfts,
      rarityDistribution: rarityRanges,
      traitDistribution
    };
  }
  
  /**
   * Find the rarest NFT in the collection
   */
  findRarestNFT(nfts: NFT[]): NFT {
    return nfts.reduce((rarest, current) => 
      current.rarityScore > rarest.rarityScore ? current : rarest, nfts[0]);
  }
  
  /**
   * Generate a provable random mint index
   * Used for fair minting order from a collection
   */
  async getRandomMintIndex(maxIndex: number): Promise<number> {
    // Get a random U64
    const randomValue = await this.qrngClient.generateRandomU64(this.creatorWallet);
    
    // Convert to a mint index
    return Number(randomValue % BigInt(maxIndex));
  }
  
  /**
   * Simulate an NFT mint from the collection
   */
  async simulateMint(
    collection: NFT[],
    userWallet: PublicKey
  ): Promise<{
    nft: NFT,
    mintIndex: number,
    mintTransaction: string // Simulated transaction ID
  }> {
    // Generate a random mint index
    const mintIndex = await this.getRandomMintIndex(collection.length);
    const nft = collection[mintIndex];
    
    // Simulate a mint transaction (in real implementation, this would be an actual blockchain transaction)
    const mockTxId = `MINT${Date.now().toString().slice(-9)}${userWallet.toString().slice(0, 6)}`;
    
    console.log(`User ${userWallet.toString().slice(0, 10)}... minted NFT #${nft.id}`);
    console.log(`Mint Transaction: ${mockTxId}`);
    
    return {
      nft,
      mintIndex,
      mintTransaction: mockTxId
    };
  }
}

/**
 * Example usage
 */
async function runNFTExample() {
  try {
    // Connect to Solana mainnet
    const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
    
    // Load creator wallet (must have TSOTCHKE tokens)
    // In a real application, you would load your wallet from a secure location
    // For example: const secretKey = new Uint8Array(JSON.parse(fs.readFileSync('./wallet.json', 'utf-8')));
    const creatorWallet = Keypair.generate(); // Using a randomly generated keypair for example only
    
    // Initialize the NFT generator
    const nftGenerator = new NFTCollectionGenerator(connection, creatorWallet);
    
    // Generate a collection of 10 NFTs
    const { nfts, rarityDistribution, traitDistribution } = 
      await nftGenerator.generateCollection(10, "CryptoAdventurers");
    
    // Display collection statistics
    console.log("\nCollection Statistics:");
    console.log("Rarity Distribution:");
    for (const [range, count] of Object.entries(rarityDistribution)) {
      if (count > 0) {
        console.log(`  ${range}: ${count} NFTs (${Math.round(count / nfts.length * 100)}%)`);
      }
    }
    
    console.log("\nTrait Distribution (Top 5):");
    const sortedTraits = Object.entries(traitDistribution)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
    
    for (const [trait, percentage] of sortedTraits) {
      console.log(`  ${trait}: ${percentage}%`);
    }
    
    // Find the rarest NFT
    const rarestNFT = nftGenerator.findRarestNFT(nfts);
    console.log("\nRarest NFT in collection:");
    console.log(`  ${rarestNFT.name} (Rarity Score: ${rarestNFT.rarityScore})`);
    console.log("  Traits:");
    for (const [category, trait] of Object.entries(rarestNFT.traits)) {
      console.log(`    ${category}: ${trait}`);
    }
    
    // Simulate a user minting an NFT
    const userWallet = Keypair.generate().publicKey;
    const mintResult = await nftGenerator.simulateMint(nfts, userWallet);
    
    console.log("\nUser Mint Result:");
    console.log(`  Minted: ${mintResult.nft.name}`);
    console.log(`  Rarity Score: ${mintResult.nft.rarityScore}`);
    console.log(`  Transaction: ${mintResult.mintTransaction}`);
    
  } catch (error) {
    console.error("Error in NFT example:", error);
  }
}

// Run the example (uncomment to execute)
// runNFTExample();

/**
 * This example demonstrates:
 * 1. Using QRNG for truly random trait generation
 * 2. Weighted probability distributions for traits
 * 3. Rarity scoring system for NFTs
 * 4. Provably fair minting process
 * 
 * In a real NFT project, you would:
 * - Store the collection on-chain or in decentralized storage
 * - Use the QRNG service during the actual minting process
 * - Implement metadata standards (e.g., Metaplex)
 * - Handle token creation and sales logic
 */
