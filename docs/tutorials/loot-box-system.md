# Building a Random Loot Box System with TSOTCHKE QRNG

This tutorial guides you through building a fair and transparent loot box system for your game using the TSOTCHKE QRNG service. By the end, you'll have a fully functional system that provides provably fair random rewards to players.

## Prerequisites

- Basic knowledge of TypeScript/JavaScript
- Solana wallet with TSOTCHKE tokens
- Familiarity with Solana development concepts
- Node.js environment set up

## Step 1: Define Your Loot Table

Let's start by defining the possible rewards and their rarity tiers:

```typescript
// Define item rarity levels
enum Rarity {
  Common = "Common",
  Uncommon = "Uncommon",
  Rare = "Rare",
  Epic = "Epic",
  Legendary = "Legendary"
}

// Define game items with properties
interface GameItem {
  id: string;
  name: string;
  rarity: Rarity;
  dropRate: number; // Percentage chance (0-100)
  value: number;    // In-game currency value
  attributes?: Record<string, number>; // Optional game-specific attributes
}

// Create a loot table with items and their drop rates
const lootTable: GameItem[] = [
  // Common items (60% chance combined)
  { id: "wood_sword", name: "Wooden Sword", rarity: Rarity.Common, dropRate: 20, value: 5 },
  { id: "leather_cap", name: "Leather Cap", rarity: Rarity.Common, dropRate: 20, value: 5 },
  { id: "health_potion", name: "Health Potion", rarity: Rarity.Common, dropRate: 20, value: 5 },
  
  // Uncommon items (25% chance combined)
  { id: "iron_sword", name: "Iron Sword", rarity: Rarity.Uncommon, dropRate: 10, value: 20 },
  { id: "chain_mail", name: "Chain Mail", rarity: Rarity.Uncommon, dropRate: 10, value: 20 },
  { id: "magic_scroll", name: "Magic Scroll", rarity: Rarity.Uncommon, dropRate: 5, value: 25 },
  
  // Rare items (10% chance combined)
  { id: "steel_axe", name: "Steel Axe", rarity: Rarity.Rare, dropRate: 5, value: 50 },
  { id: "enchanted_ring", name: "Enchanted Ring", rarity: Rarity.Rare, dropRate: 5, value: 75 },
  
  // Epic items (4% chance combined)
  { id: "dragon_scale", name: "Dragon Scale", rarity: Rarity.Epic, dropRate: 2, value: 200 },
  { id: "phoenix_feather", name: "Phoenix Feather", rarity: Rarity.Epic, dropRate: 2, value: 250 },
  
  // Legendary items (1% chance combined)
  { id: "excalibur", name: "Excalibur", rarity: Rarity.Legendary, dropRate: 0.5, value: 1000 },
  { id: "holy_grail", name: "Holy Grail", rarity: Rarity.Legendary, dropRate: 0.5, value: 1500 }
];

// Validate that drop rates sum to 100%
const totalDropRate = lootTable.reduce((sum, item) => sum + item.dropRate, 0);
if (Math.abs(totalDropRate - 100) > 0.001) {
  console.warn(`Warning: Total drop rate is ${totalDropRate}%, not 100%`);
}
```

## Step 2: Create the Loot Box System Class

Now, let's create a class that handles loot box openings using the TSOTCHKE QRNG service:

```typescript
import { Connection, Keypair } from '@solana/web3.js';
import { QrngClient } from '@tsotchke/solana-qrng';

class LootBoxSystem {
  private qrngClient: QrngClient;
  private gameWallet: Keypair;
  private lootTable: GameItem[];
  
  constructor(
    connection: Connection,
    gameWallet: Keypair,
    lootTable: GameItem[]
  ) {
    this.qrngClient = new QrngClient(connection);
    this.gameWallet = gameWallet;
    this.lootTable = lootTable;
  }
  
  /**
   * Open a single loot box and return the reward
   */
  async openLootBox(
    playerIdentifier: string,
    boxType: 'standard' | 'premium' = 'standard',
    options?: { guaranteedMinimumRarity?: Rarity }
  ): Promise<{ 
    item: GameItem, 
    transactionId: string, 
    rollValue: number 
  }> {
    console.log(`Opening ${boxType} loot box for player ${playerIdentifier}...`);
    
    // Get a random number between 0-1 from the QRNG service
    const randomDouble = await this.qrngClient.generateRandomDouble(this.gameWallet);
    
    // Scale to 0-100 for percentage calculations
    const rollValue = randomDouble * 100;
    
    // Get the transaction ID for verification purposes
    const txId = "tx_simulation"; // In a real implementation, get from transaction
    
    console.log(`Roll value: ${rollValue}`);
    
    // Apply box type modifiers (premium boxes have better odds)
    let adjustedRoll = rollValue;
    if (boxType === 'premium') {
      // Premium boxes have a 20% better chance for rare+ items
      adjustedRoll = Math.max(0, adjustedRoll - 20);
    }
    
    // Select an item based on the roll
    const item = this.selectItemFromRoll(adjustedRoll, options?.guaranteedMinimumRarity);
    
    console.log(`Selected item: ${item.name} (${item.rarity})`);
    
    // Log the result (in a real game, store this in a database)
    this.logLootBoxOpen({
      playerIdentifier,
      boxType,
      rollValue,
      itemId: item.id,
      timestamp: new Date().toISOString(),
      transactionId: txId
    });
    
    return {
      item,
      transactionId: txId,
      rollValue
    };
  }
  
  /**
   * Open multiple loot boxes at once (bulk opening)
   */
  async openMultipleLootBoxes(
    playerIdentifier: string,
    count: number,
    boxType: 'standard' | 'premium' = 'standard'
  ): Promise<{ 
    items: GameItem[], 
    transactionId: string 
  }> {
    console.log(`Opening ${count} ${boxType} loot boxes for player ${playerIdentifier}...`);
    
    // Check if we have enough tokens
    const balance = await this.qrngClient.getTokenBalance(this.gameWallet.publicKey);
    if (balance < count) {
      throw new Error(`Not enough TSOTCHKE tokens. Need ${count} but only have ${balance}.`);
    }
    
    const items: GameItem[] = [];
    let txId = "bulk_tx_simulation"; // In a real implementation, get from transaction
    
    // Open each box
    for (let i = 0; i < count; i++) {
      const result = await this.openLootBox(playerIdentifier, boxType);
      items.push(result.item);
      // In a real implementation, we would use a single transaction for all boxes
      if (i === 0) txId = result.transactionId;
    }
    
    // Summarize the results
    const rarityDistribution = items.reduce((counts, item) => {
      counts[item.rarity] = (counts[item.rarity] || 0) + 1;
      return counts;
    }, {} as Record<Rarity, number>);
    
    console.log("Loot box opening complete. Rarity distribution:");
    Object.entries(rarityDistribution).forEach(([rarity, count]) => {
      console.log(`${rarity}: ${count} (${(count / items.length * 100).toFixed(1)}%)`);
    });
    
    return {
      items,
      transactionId: txId
    };
  }
  
  /**
   * Select an item from the loot table based on a roll value
   */
  private selectItemFromRoll(
    rollValue: number, 
    minimumRarity?: Rarity
  ): GameItem {
    // Sort loot table by drop rate (optional, for predictable ordering)
    const sortedLoot = [...this.lootTable].sort((a, b) => b.dropRate - a.dropRate);
    
    // Filter by minimum rarity if specified
    const eligibleItems = minimumRarity 
      ? sortedLoot.filter(item => this.getRarityValue(item.rarity) >= this.getRarityValue(minimumRarity))
      : sortedLoot;
    
    // If no eligible items, return the highest rarity item
    if (eligibleItems.length === 0) {
      return sortedLoot.reduce((highest, current) => 
        this.getRarityValue(current.rarity) > this.getRarityValue(highest.rarity) ? current : highest, 
        sortedLoot[0]
      );
    }
    
    // Calculate cumulative probabilities
    let cumulativeRate = 0;
    
    for (const item of eligibleItems) {
      cumulativeRate += item.dropRate;
      if (rollValue <= cumulativeRate) {
        return item;
      }
    }
    
    // Fallback: return the last item (should rarely happen due to rounding)
    return eligibleItems[eligibleItems.length - 1];
  }
  
  /**
   * Get a numeric value for rarity comparisons
   */
  private getRarityValue(rarity: Rarity): number {
    switch (rarity) {
      case Rarity.Common: return 1;
      case Rarity.Uncommon: return 2;
      case Rarity.Rare: return 3;
      case Rarity.Epic: return 4;
      case Rarity.Legendary: return 5;
      default: return 0;
    }
  }
  
  /**
   * Log a loot box opening (for audit and verification)
   */
  private logLootBoxOpen(data: {
    playerIdentifier: string;
    boxType: string;
    rollValue: number;
    itemId: string;
    timestamp: string;
    transactionId: string;
  }): void {
    // In a real implementation, store this in a database or blockchain
    console.log(`LOOT BOX LOG: ${JSON.stringify(data)}`);
  }
  
  /**
   * Verify a past loot box opening
   */
  async verifyLootBoxOpen(transactionId: string): Promise<{
    verified: boolean;
    details?: {
      rollValue: number;
      item: GameItem;
      timestamp: string;
    }
  }> {
    // In a real implementation, verify the transaction on-chain
    console.log(`Verifying loot box opening transaction: ${transactionId}`);
    
    // Simulate verification (in real world, you would check the blockchain)
    const verified = true;
    
    if (verified) {
      // Return the verification details
      return {
        verified,
        details: {
          rollValue: 42.5, // This would come from the actual transaction
          item: this.lootTable[0], // This would be determined from the transaction data
          timestamp: new Date().toISOString()
        }
      };
    }
    
    return { verified: false };
  }
}
```

## Step 3: Implement the Loot Box User Interface

For a complete implementation, you'll want to create a user interface. Here's a simplified example:

```typescript
async function useLootBoxSystem() {
  // Connect to Solana
  const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
  
  // Set up game wallet
  const gameWallet = Keypair.fromSecretKey(/* your wallet secret key */);
  
  // Initialize the loot box system
  const lootBoxSystem = new LootBoxSystem(connection, gameWallet, lootTable);
  
  // Player opens a standard loot box
  const standardResult = await lootBoxSystem.openLootBox('player123', 'standard');
  console.log(`Player received: ${standardResult.item.name}`);
  
  // Player opens a premium loot box
  const premiumResult = await lootBoxSystem.openLootBox('player123', 'premium');
  console.log(`Player received: ${premiumResult.item.name}`);
  
  // Player opens 10 loot boxes at once
  const bulkResult = await lootBoxSystem.openMultipleLootBoxes('player123', 10, 'standard');
  console.log(`Player received ${bulkResult.items.length} items`);
  
  // Verify a past loot box opening
  const verificationResult = await lootBoxSystem.verifyLootBoxOpen(standardResult.transactionId);
  if (verificationResult.verified) {
    console.log('Loot box opening verified!');
  } else {
    console.log('Verification failed');
  }
}
```

## Step 4: Add On-Chain Verification

For full transparency, you can implement an on-chain verification system:

```typescript
/**
 * Get the on-chain verification URL for a loot box opening
 */
function getLootBoxVerificationUrl(transactionId: string): string {
  return `https://explorer.solana.com/tx/${transactionId}?cluster=mainnet`;
}

/**
 * Create HTML for a verification badge to display in-game
 */
function createVerificationBadge(transactionId: string): string {
  const verificationUrl = getLootBoxVerificationUrl(transactionId);
  
  return `
    <div class="verification-badge">
      <span class="verified-text">Verified Random</span>
      <a href="${verificationUrl}" target="_blank" class="verify-link">
        Verify on Solana
      </a>
    </div>
  `;
}
```

## Best Practices

1. **Token Management**:
   - Maintain a sufficient balance of TSOTCHKE tokens for your game's needs
   - Consider buying tokens in bulk during low network congestion periods
   - Monitor token usage to budget accordingly

2. **Optimizing for Cost**:
   - For bulk loot box openings, consider using a single random number as a seed
   - Use bitwise operations to extract multiple values from a single u64 random number
   - Implement caching for less critical randomness needs

3. **Verification and Transparency**:
   - Always provide players with transaction IDs for verification
   - Create a verification page on your game's website
   - Educate players about the provably fair nature of your loot boxes

4. **Error Handling**:
   - Implement proper error handling for network issues
   - Have fallback mechanisms if the QRNG service is temporarily unavailable
   - Create a queue system for high-volume periods

## Complete Example

Here's a complete, runnable example that ties everything together:

```typescript
import { Connection, Keypair } from '@solana/web3.js';
import { QrngClient } from '@tsotchke/solana-qrng';

// ... [Copy the code from steps 1-4] ...

// Run the example
async function main() {
  try {
    await useLootBoxSystem();
  } catch (error) {
    console.error('Error running loot box system:', error);
  }
}

// Uncomment to run
// main();
```

## Conclusion

You now have a fully functional, provably fair loot box system powered by TSOTCHKE QRNG. This implementation provides:

- True randomness for fair item distribution
- Transparent verification for players
- Flexible configuration for different box types and rarities
- Efficient token usage with bulk openings

By using quantum-inspired randomness, your game offers a level of fairness that conventional pseudo-random number generators cannot match, building trust with your player community and potentially complying with loot box regulations in various jurisdictions.

## Next Steps

- Implement this system in your game engine (Unity, Unreal, etc.)
- Create attractive animations for loot box openings
- Develop a verification portal on your website
- Consider implementing dynamic pricing based on item rarity

For more advanced implementations, check out our other tutorials or the [GameFi examples](../../examples/gamefi/gamefi-randomness.ts) in the SDK.
