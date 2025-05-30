# Creating a Provably Fair NFT Drop with TSOTCHKE QRNG

This tutorial guides you through implementing a provably fair NFT minting and distribution system using the TSOTCHKE QRNG service. By integrating true randomness into your NFT project, you can ensure fair distribution of traits and mint order, building trust with your community.

## Prerequisites

- Basic knowledge of Solana development
- Familiarity with NFT concepts and metadata standards
- A Solana wallet with TSOTCHKE tokens
- Node.js environment set up

## Understanding Fairness in NFT Drops

NFT fairness typically involves ensuring:

1. **Trait Distribution**: Random assignment of traits that can't be manipulated
2. **Mint Order**: Fair sequencing that prevents cherry-picking valuable NFTs
3. **Reveal Process**: Transparent revealing of NFT properties after minting
4. **Verifiability**: On-chain proof that the process was truly random

## Step 1: Design the Collection Metadata Structure

Let's start by defining the NFT collection structure:

```typescript
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { QrngClient } from '@tsotchke/solana-qrng';

// Define trait categories and values
interface TraitOption {
  name: string;
  rarity: number; // Percentage (0-100)
  value: string;  // Image file or property value
}

interface TraitCategory {
  name: string;
  options: TraitOption[];
}

// Define the collection metadata
interface CollectionMetadata {
  name: string;
  symbol: string;
  description: string;
  size: number;
  creator: PublicKey;
  royaltyBasisPoints: number; // 100 = 1%
  traitCategories: TraitCategory[];
}

// Example collection definition
const myNftCollection: CollectionMetadata = {
  name: "Quantum Punks",
  symbol: "QPUNK",
  description: "A collection of 10,000 quantum-inspired punk NFTs with provably fair randomness",
  size: 10000,
  creator: new PublicKey('YourCreatorAddressHere'),
  royaltyBasisPoints: 500, // 5% royalty
  traitCategories: [
    {
      name: "Background",
      options: [
        { name: "Blue", rarity: 30, value: "blue.png" },
        { name: "Red", rarity: 25, value: "red.png" },
        { name: "Green", rarity: 20, value: "green.png" },
        { name: "Gold", rarity: 15, value: "gold.png" },
        { name: "Cosmic", rarity: 10, value: "cosmic.png" },
      ]
    },
    {
      name: "Body",
      options: [
        { name: "Human", rarity: 50, value: "human.png" },
        { name: "Robot", rarity: 30, value: "robot.png" },
        { name: "Alien", rarity: 15, value: "alien.png" },
        { name: "Ghost", rarity: 5, value: "ghost.png" },
      ]
    },
    {
      name: "Face",
      options: [
        { name: "Happy", rarity: 40, value: "happy.png" },
        { name: "Serious", rarity: 30, value: "serious.png" },
        { name: "Angry", rarity: 20, value: "angry.png" },
        { name: "Quantum", rarity: 10, value: "quantum.png" },
      ]
    },
    {
      name: "Accessory",
      options: [
        { name: "None", rarity: 30, value: "none.png" },
        { name: "Hat", rarity: 25, value: "hat.png" },
        { name: "Glasses", rarity: 20, value: "glasses.png" },
        { name: "Cigar", rarity: 15, value: "cigar.png" },
        { name: "Quantum Device", rarity: 10, value: "quantum_device.png" },
      ]
    },
    {
      name: "Special Trait",
      options: [
        { name: "None", rarity: 80, value: "none.png" },
        { name: "Laser Eyes", rarity: 10, value: "laser_eyes.png" },
        { name: "Aura", rarity: 7, value: "aura.png" },
        { name: "Halo", rarity: 3, value: "halo.png" },
      ]
    }
  ]
};

// Validate trait rarities add up to 100% for each category
myNftCollection.traitCategories.forEach(category => {
  const totalRarity = category.options.reduce((sum, option) => sum + option.rarity, 0);
  if (Math.abs(totalRarity - 100) > 0.1) {
    console.warn(`Warning: Trait category "${category.name}" has rarities that sum to ${totalRarity}%, not 100%`);
  }
});
```

## Step 2: Create the Provably Fair NFT Generator

Now, let's implement the main system that handles trait generation using TSOTCHKE QRNG:

```typescript
class ProvablyFairNFTGenerator {
  private qrngClient: QrngClient;
  private creatorWallet: Keypair;
  private collection: CollectionMetadata;
  private generatedNfts: Map<number, NFTMetadata> = new Map();
  private mintOrderMapping: Map<number, number> = new Map();
  
  constructor(
    connection: Connection,
    creatorWallet: Keypair,
    collection: CollectionMetadata
  ) {
    this.qrngClient = new QrngClient(connection);
    this.creatorWallet = creatorWallet;
    this.collection = collection;
  }
  
  /**
   * NFT metadata structure
   */
  interface NFTMetadata {
    name: string;
    symbol: string;
    description: string;
    image: string;
    animation_url?: string;
    external_url?: string;
    attributes: {
      trait_type: string;
      value: string;
    }[];
    properties: {
      files: { uri: string; type: string }[];
      category: string;
      creators: { address: string; share: number }[];
    };
    seller_fee_basis_points: number;
    collection: {
      name: string;
      family: string;
    };
    mintOrderIndex?: number;
    mintTimestamp?: number;
    qrngTxId?: string;
  }
  
  /**
   * Generate traits for a single NFT using QRNG
   */
  async generateNFTTraits(nftIndex: number): Promise<NFTMetadata> {
    console.log(`Generating traits for NFT #${nftIndex}...`);
    
    // Check if we've already generated this NFT
    if (this.generatedNfts.has(nftIndex)) {
      return this.generatedNfts.get(nftIndex)!;
    }
    
    // Prepare attributes array
    const attributes: { trait_type: string; value: string }[] = [];
    let traitComboHash = '';
    
    // For each trait category, select a trait using QRNG
    for (const category of this.collection.traitCategories) {
      // Get a random number between 0-1
      const randomValue = await this.qrngClient.generateRandomDouble(this.creatorWallet);
      
      // Scale to 0-100 for percentage calculations
      const roll = randomValue * 100;
      
      // Select trait based on rarity weights
      let selectedTrait: TraitOption | null = null;
      let cumulativeRarity = 0;
      
      for (const option of category.options) {
        cumulativeRarity += option.rarity;
        if (roll <= cumulativeRarity) {
          selectedTrait = option;
          break;
        }
      }
      
      // Fallback to last trait if none was selected (due to rounding)
      if (!selectedTrait) {
        selectedTrait = category.options[category.options.length - 1];
      }
      
      // Add to attributes
      attributes.push({
        trait_type: category.name,
        value: selectedTrait.name
      });
      
      // Update trait combination hash for uniqueness checking
      traitComboHash += `${category.name}:${selectedTrait.name};`;
    }
    
    // Create metadata for this NFT
    const nftMetadata: NFTMetadata = {
      name: `${this.collection.name} #${nftIndex}`,
      symbol: this.collection.symbol,
      description: this.collection.description,
      image: `ipfs://placeholder/${nftIndex}.png`, // Placeholder until final image is generated
      attributes,
      properties: {
        files: [{ uri: `ipfs://placeholder/${nftIndex}.png`, type: "image/png" }],
        category: "image",
        creators: [{ address: this.collection.creator.toString(), share: 100 }]
      },
      seller_fee_basis_points: this.collection.royaltyBasisPoints,
      collection: {
        name: this.collection.name,
        family: this.collection.symbol
      }
    };
    
    // Store the generated NFT
    this.generatedNfts.set(nftIndex, nftMetadata);
    
    console.log(`Generated traits for NFT #${nftIndex}: ${attributes.map(a => `${a.trait_type}=${a.value}`).join(', ')}`);
    
    return nftMetadata;
  }
  
  /**
   * Generate random mint order to prevent cherry-picking
   */
  async generateMintOrder(): Promise<Map<number, number>> {
    console.log(`Generating provably fair mint order for ${this.collection.size} NFTs...`);
    
    // Initialize array with sequential indices
    const indices = Array.from({ length: this.collection.size }, (_, i) => i);
    
    // Fisher-Yates shuffle using QRNG
    for (let i = indices.length - 1; i > 0; i--) {
      // Get random index
      const randomU64 = await this.qrngClient.generateRandomU64(this.creatorWallet);
      const j = Number(randomU64 % BigInt(i + 1));
      
      // Swap elements
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    
    // Create mapping: mint position -> NFT index
    this.mintOrderMapping.clear();
    indices.forEach((nftIndex, mintPosition) => {
      this.mintOrderMapping.set(mintPosition, nftIndex);
    });
    
    console.log(`Mint order generation complete. First 5 mints will be: ${
      Array.from({ length: Math.min(5, indices.length) }, (_, i) => 
        `Mint #${i} → NFT #${this.mintOrderMapping.get(i)}`
      ).join(', ')
    }`);
    
    return this.mintOrderMapping;
  }
  
  /**
   * Simulate the minting process
   */
  async simulateMint(userWallet: PublicKey, mintPosition: number): Promise<{
    nft: NFTMetadata,
    mintIndex: number,
    transactionId: string
  }> {
    console.log(`User ${userWallet.toString().slice(0, 10)}... is minting position ${mintPosition}...`);
    
    // Get the NFT index for this mint position
    if (!this.mintOrderMapping.has(mintPosition)) {
      throw new Error(`Mint position ${mintPosition} not found in mapping. Run generateMintOrder() first.`);
    }
    
    const nftIndex = this.mintOrderMapping.get(mintPosition)!;
    
    // Generate traits if not already generated
    let nftMetadata = this.generatedNfts.get(nftIndex);
    if (!nftMetadata) {
      nftMetadata = await this.generateNFTTraits(nftIndex);
    }
    
    // Add mint information
    nftMetadata.mintOrderIndex = mintPosition;
    nftMetadata.mintTimestamp = Date.now();
    nftMetadata.qrngTxId = `tx_simulation_${Date.now()}`; // In a real system, this would be the actual transaction ID
    
    // In a real implementation, you would:
    // 1. Mint the NFT on chain
    // 2. Pin the metadata to IPFS or Arweave
    // 3. Update the token metadata with the final URI
    
    console.log(`Mint successful! User received NFT #${nftIndex}`);
    
    return {
      nft: nftMetadata,
      mintIndex: nftIndex,
      transactionId: nftMetadata.qrngTxId
    };
  }
  
  /**
   * Generate the composite image for an NFT
   */
  async generateImage(nftIndex: number): Promise<string> {
    // This function would normally:
    // 1. Get the traits for the NFT
    // 2. Compose the image from layer files
    // 3. Upload to IPFS/Arweave
    // 4. Return the URI
    
    // For this tutorial, we'll just return a placeholder
    const nftMetadata = this.generatedNfts.get(nftIndex);
    if (!nftMetadata) {
      throw new Error(`NFT #${nftIndex} not found. Generate traits first.`);
    }
    
    console.log(`Generating image for NFT #${nftIndex} with ${nftMetadata.attributes.length} traits`);
    
    // Simulated image generation
    const imageUri = `ipfs://example/${nftIndex}.png`;
    
    // Update the metadata
    nftMetadata.image = imageUri;
    nftMetadata.properties.files[0].uri = imageUri;
    
    return imageUri;
  }
  
  /**
   * Create verification data for the collection
   */
  async generateVerificationData(): Promise<{
    collectionSeed: string;
    mintOrderProof: string;
    traitGenerationProof: string;
  }> {
    // In a real implementation, you would:
    // 1. Generate a commitment to the random seed
    // 2. Store the commitment on-chain before the mint
    // 3. After mint, reveal the seed and proof
    
    const verificationData = {
      collectionSeed: `qrng_seed_${Date.now()}`,
      mintOrderProof: `https://explorer.solana.com/tx/example_mint_order_tx`,
      traitGenerationProof: `https://explorer.solana.com/tx/example_trait_gen_tx`
    };
    
    console.log('Generated verification data:', verificationData);
    
    return verificationData;
  }
}
```

## Step 3: Implement the Mint Website Integration

Here's how you would integrate this into a mint website:

```typescript
async function implementMintWebsite() {
  // Connect to Solana
  const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
  
  // Set up creator wallet
  const creatorWallet = Keypair.fromSecretKey(/* your wallet secret key */);
  
  // Initialize the NFT generator
  const nftGenerator = new ProvablyFairNFTGenerator(connection, creatorWallet, myNftCollection);
  
  // Generate the mint order (should be done before mint starts)
  const mintOrder = await nftGenerator.generateMintOrder();
  
  // Simulate a user minting
  const userWallet = Keypair.generate().publicKey;
  const mintResult = await nftGenerator.simulateMint(userWallet, 0); // First mint
  
  // Generate the image for the minted NFT
  const imageUri = await nftGenerator.generateImage(mintResult.mintIndex);
  
  console.log(`Mint complete! NFT image available at: ${imageUri}`);
  
  // Generate verification data for the collection
  const verificationData = await nftGenerator.generateVerificationData();
  
  // Display verification information on website
  console.log('Verification URL:', `https://yourmintsite.com/verify?seed=${verificationData.collectionSeed}`);
}
```

## Step 4: Add Trait Probability Estimation

To make your NFT project more transparent, you can show collectors the probability of different trait combinations:

```typescript
/**
 * Calculate the probability of a specific trait combination
 */
function calculateTraitProbability(traits: { trait_type: string; value: string }[]): number {
  let probability = 1.0;
  
  for (const trait of traits) {
    const category = myNftCollection.traitCategories.find(c => c.name === trait.trait_type);
    if (!category) continue;
    
    const option = category.options.find(o => o.name === trait.value);
    if (!option) continue;
    
    // Multiply by the trait's probability
    probability *= option.rarity / 100;
  }
  
  return probability;
}

/**
 * Calculate the rarity score of an NFT (higher = rarer)
 */
function calculateRarityScore(nft: NFTMetadata): number {
  let score = 0;
  
  for (const attribute of nft.attributes) {
    const category = myNftCollection.traitCategories.find(c => c.name === attribute.trait_type);
    if (!category) continue;
    
    const option = category.options.find(o => o.name === attribute.value);
    if (!option) continue;
    
    // Add to score (rarer traits add more points)
    score += (100 - option.rarity);
  }
  
  return score;
}
```

## Step 5: Create Verification Website

For full transparency, implement a verification website where users can check the randomness of the collection:

```typescript
/**
 * HTML for verification page
 */
function createVerificationPage(
  collectionSeed: string,
  mintOrderProof: string,
  traitGenerationProof: string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>Quantum Punks Verification</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    .verification-card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
    .verification-badge { background: #1E88E5; color: white; display: inline-block; padding: 8px 12px; border-radius: 4px; }
    .verification-link { color: #1E88E5; text-decoration: none; }
    .verification-link:hover { text-decoration: underline; }
    .proof-box { background: #f5f5f5; padding: 12px; border-radius: 4px; font-family: monospace; word-break: break-all; }
  </style>
</head>
<body>
  <h1>Quantum Punks Verification</h1>
  
  <div class="verification-card">
    <h2>Collection Seed</h2>
    <p>This seed was used to generate the entire collection:</p>
    <div class="proof-box">${collectionSeed}</div>
    <p>
      <a href="https://explorer.solana.com/tx/example_seed_commitment_tx" class="verification-link" target="_blank">
        View Seed Commitment Transaction
      </a>
    </p>
  </div>
  
  <div class="verification-card">
    <h2>Mint Order Verification</h2>
    <p>The mint order was determined using TSOTCHKE QRNG to ensure fair distribution:</p>
    <div class="proof-box">${mintOrderProof}</div>
    <p>
      <a href="${mintOrderProof}" class="verification-link" target="_blank">
        Verify Mint Order on Solana
      </a>
    </p>
  </div>
  
  <div class="verification-card">
    <h2>Trait Generation Verification</h2>
    <p>All traits were generated using quantum-inspired randomness:</p>
    <div class="proof-box">${traitGenerationProof}</div>
    <p>
      <a href="${traitGenerationProof}" class="verification-link" target="_blank">
        Verify Trait Generation on Solana
      </a>
    </p>
  </div>
  
  <div class="verification-card">
    <h2>Verify Your NFT</h2>
    <p>Enter your NFT ID to verify its traits:</p>
    <input type="number" id="nftId" min="0" max="9999" placeholder="NFT #">
    <button onclick="verifyNft()">Verify</button>
    <div id="verificationResult"></div>
  </div>
  
  <script>
    function verifyNft() {
      // In a real implementation, this would verify the NFT against on-chain data
      const nftId = document.getElementById('nftId').value;
      document.getElementById('verificationResult').innerHTML = 
        \`NFT #\${nftId} verified! Generated using TSOTCHKE QRNG transaction: tx_example_\${nftId}\`;
    }
  </script>
</body>
</html>
  `;
}
```

## Best Practices for Provably Fair NFT Drops

### 1. Pre-commitment

Before your mint begins:
- Generate and publish a commitment hash of your randomness seed
- Store this commitment on-chain
- Document your trait distribution methodology

### 2. Mint Process

During the mint:
- Use QRNG for each mint to determine which NFT from the collection the user receives
- Record transaction IDs for verification
- Implement rate limiting to prevent exploitation

### 3. Post-mint Verification

After the mint completes:
- Reveal the original randomness seed
- Provide tools for users to verify their NFTs
- Make all verification data publicly accessible

### 4. Transparency in Smart Contracts

- Make your mint contract code public and verified
- Include comments explaining the randomness mechanism
- Use a known, audited framework like Metaplex

## Complete Example

Here's a complete example that ties everything together:

```typescript
import { Connection, Keypair } from '@solana/web3.js';
import { QrngClient } from '@tsotchke/solana-qrng';

// ... [Copy the code from steps 1-5] ...

// Main function to run the example
async function main() {
  try {
    await implementMintWebsite();
    
    // Create verification page (in a real project, this would be a separate website)
    const verificationData = await nftGenerator.generateVerificationData();
    const verificationPage = createVerificationPage(
      verificationData.collectionSeed,
      verificationData.mintOrderProof,
      verificationData.traitGenerationProof
    );
    
    // In a real project, you would save this to a file or deploy to a web server
    console.log("Verification page generated successfully");
  } catch (error) {
    console.error("Error in NFT drop implementation:", error);
  }
}

// Uncomment to run
// main();
```

## Conclusion

By following this tutorial, you've built a provably fair NFT minting system that:

1. Uses true quantum-inspired randomness from TSOTCHKE QRNG
2. Ensures fair trait distribution based on predefined rarities
3. Creates a verifiable mint order that prevents cherry-picking
4. Provides transparency to your community with on-chain verification

This approach significantly enhances the value and trustworthiness of your NFT collection. Collectors can verify that rare traits were truly assigned by chance, not by manipulation, which builds confidence in your project's integrity.

## Next Steps

- Integrate with Metaplex for the actual NFT minting functionality
- Add image generation logic using a layering system
- Create an attractive mint website interface
- Implement additional rarity features like trait synergies

For more advanced NFT implementations, check out our [NFT examples](../../examples/nft/nft-trait-generator.ts) in the SDK.
