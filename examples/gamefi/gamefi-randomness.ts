/**
 * TSOTCHKE QRNG GameFi Example
 * 
 * This example demonstrates how to integrate the TSOTCHKE QRNG service
 * into a GameFi application for various randomness needs.
 */

import { Connection, Keypair } from '@solana/web3.js';
import { QrngClient } from '@tsotchke/solana-qrng';

// Game item definitions
interface GameItem {
  id: number;
  name: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  power: number;
}

// Character definitions
interface Character {
  id: number;
  name: string;
  stats: {
    strength: number;
    dexterity: number;
    intelligence: number;
    luck: number;
  };
  inventory: GameItem[];
}

// Sample game items with different rarities
const GAME_ITEMS: GameItem[] = [
  { id: 1, name: "Wooden Sword", rarity: "common", power: 5 },
  { id: 2, name: "Iron Dagger", rarity: "common", power: 8 },
  { id: 3, name: "Steel Axe", rarity: "uncommon", power: 15 },
  { id: 4, name: "Enchanted Bow", rarity: "rare", power: 25 },
  { id: 5, name: "Dragonbone Staff", rarity: "epic", power: 40 },
  { id: 6, name: "Excalibur", rarity: "legendary", power: 100 },
  { id: 7, name: "Leather Armor", rarity: "common", power: 3 },
  { id: 8, name: "Chain Mail", rarity: "uncommon", power: 12 },
  { id: 9, name: "Crystal Shield", rarity: "rare", power: 20 },
  { id: 10, name: "Phoenix Feather", rarity: "epic", power: 35 },
];

// Rarity distribution for item drops (chances out of 100)
const RARITY_CHANCES = {
  common: 60,     // 60% chance
  uncommon: 25,   // 25% chance
  rare: 10,       // 10% chance
  epic: 4,        // 4% chance
  legendary: 1    // 1% chance
};

/**
 * Main GameFi application that uses QRNG for various random game mechanics
 */
class GameFiApp {
  private qrngClient: QrngClient;
  private gameWallet: Keypair;

  constructor(connection: Connection, gameWallet: Keypair) {
    this.qrngClient = new QrngClient(connection);
    this.gameWallet = gameWallet;
  }

  /**
   * Generate a new character with random attributes
   */
  async generateCharacter(name: string): Promise<Character> {
    console.log(`Generating character: ${name}`);
    
    // Get a random 64-bit number for character stats
    const randomSeed = await this.qrngClient.generateRandomU64(this.gameWallet);
    console.log(`Random seed for character generation: ${randomSeed}`);
    
    // Extract different parts of the random number for different stats
    // This is more efficient than requesting multiple random numbers
    const strengthBase = Number(randomSeed & BigInt(0xFF));
    const dexterityBase = Number((randomSeed >> BigInt(8)) & BigInt(0xFF));
    const intelligenceBase = Number((randomSeed >> BigInt(16)) & BigInt(0xFF));
    const luckBase = Number((randomSeed >> BigInt(24)) & BigInt(0xFF));
    
    // Scale stats to appropriate range (1-20)
    const character: Character = {
      id: Date.now(),  // Simple ID for this example
      name,
      stats: {
        strength: Math.max(1, Math.ceil(strengthBase / 12.75)),
        dexterity: Math.max(1, Math.ceil(dexterityBase / 12.75)),
        intelligence: Math.max(1, Math.ceil(intelligenceBase / 12.75)),
        luck: Math.max(1, Math.ceil(luckBase / 12.75)),
      },
      inventory: []
    };
    
    console.log(`Character created: ${JSON.stringify(character, null, 2)}`);
    return character;
  }

  /**
   * Perform a dice roll with a specified number of sides
   */
  async rollDice(sides: number = 6): Promise<number> {
    console.log(`Rolling a ${sides}-sided die...`);
    
    // Get a random 64-bit number
    const randomNumber = await this.qrngClient.generateRandomU64(this.gameWallet);
    
    // Calculate roll from 1 to specified number of sides
    const roll = Number(randomNumber % BigInt(sides)) + 1;
    console.log(`Rolled: ${roll}`);
    
    return roll;
  }
  
  /**
   * Simulate a battle between a player and an enemy
   * Uses random numbers for attack success, critical hits, and damage
   */
  async simulateBattle(
    playerPower: number, 
    enemyPower: number
  ): Promise<{ 
    winner: 'player' | 'enemy', 
    rounds: number,
    events: string[]
  }> {
    console.log(`Battle starting: Player Power ${playerPower} vs Enemy Power ${enemyPower}`);
    
    let playerHealth = 100;
    let enemyHealth = 100;
    let rounds = 0;
    const events: string[] = [];

    while (playerHealth > 0 && enemyHealth > 0) {
      rounds++;
      events.push(`--- Round ${rounds} ---`);
      
      // Player attack phase
      const playerHitChance = await this.qrngClient.generateRandomDouble(this.gameWallet);
      const playerHits = playerHitChance < (0.5 + playerPower / (playerPower + enemyPower) * 0.3);
      
      if (playerHits) {
        // Check for critical hit
        const criticalCheck = await this.qrngClient.generateRandomBoolean(this.gameWallet);
        const isCritical = criticalCheck;
        
        // Calculate damage
        const damageRandom = await this.qrngClient.generateRandomDouble(this.gameWallet);
        const baseDamage = Math.floor(playerPower * (0.8 + damageRandom * 0.4));
        const actualDamage = isCritical ? baseDamage * 2 : baseDamage;
        
        enemyHealth -= actualDamage;
        events.push(`Player hits for ${actualDamage} damage${isCritical ? " (CRITICAL HIT!)" : ""}!`);
        events.push(`Enemy health: ${Math.max(0, enemyHealth)}`);
      } else {
        events.push("Player's attack missed!");
      }
      
      // Check if enemy is defeated
      if (enemyHealth <= 0) {
        events.push("Enemy defeated!");
        break;
      }
      
      // Enemy attack phase
      const enemyHitChance = await this.qrngClient.generateRandomDouble(this.gameWallet);
      const enemyHits = enemyHitChance < (0.5 + enemyPower / (playerPower + enemyPower) * 0.3);
      
      if (enemyHits) {
        // Calculate damage
        const damageRandom = await this.qrngClient.generateRandomDouble(this.gameWallet);
        const damage = Math.floor(enemyPower * (0.7 + damageRandom * 0.3));
        
        playerHealth -= damage;
        events.push(`Enemy hits for ${damage} damage!`);
        events.push(`Player health: ${Math.max(0, playerHealth)}`);
      } else {
        events.push("Enemy's attack missed!");
      }
    }
    
    const winner = playerHealth > 0 ? 'player' : 'enemy';
    events.push(`Battle ends after ${rounds} rounds. ${winner === 'player' ? 'Player' : 'Enemy'} wins!`);
    
    return { winner, rounds, events };
  }
  
  /**
   * Generate a random loot drop based on rarity chances
   */
  async generateLootDrop(count: number = 1): Promise<GameItem[]> {
    console.log(`Generating ${count} loot items...`);
    const loot: GameItem[] = [];
    
    for (let i = 0; i < count; i++) {
      // Get a random number between 0-1 for rarity determination
      const rarityRoll = await this.qrngClient.generateRandomDouble(this.gameWallet);
      
      // Convert the random number to a value between 1-100
      const roll = Math.floor(rarityRoll * 100) + 1;
      
      // Determine rarity based on roll
      let rarity: GameItem['rarity'];
      if (roll <= RARITY_CHANCES.legendary) {
        rarity = 'legendary';
      } else if (roll <= RARITY_CHANCES.legendary + RARITY_CHANCES.epic) {
        rarity = 'epic';
      } else if (roll <= RARITY_CHANCES.legendary + RARITY_CHANCES.epic + RARITY_CHANCES.rare) {
        rarity = 'rare';
      } else if (roll <= RARITY_CHANCES.legendary + RARITY_CHANCES.epic + RARITY_CHANCES.rare + RARITY_CHANCES.uncommon) {
        rarity = 'uncommon';
      } else {
        rarity = 'common';
      }
      
      // Find items of the determined rarity
      const possibleItems = GAME_ITEMS.filter(item => item.rarity === rarity);
      
      // Select a random item from the possible items
      const itemRandom = await this.qrngClient.generateRandomU64(this.gameWallet);
      const selectedItem = possibleItems[Number(itemRandom % BigInt(possibleItems.length))];
      
      loot.push(selectedItem);
      console.log(`Generated ${selectedItem.rarity} item: ${selectedItem.name}`);
    }
    
    return loot;
  }
}

/**
 * Example usage
 */
async function runGameExample() {
  try {
    // Connect to Solana mainnet
    const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
    
    // Load your game wallet (must have TSOTCHKE tokens)
    // In a real application, you would load your wallet from a secure location
    // For example: const secretKey = new Uint8Array(JSON.parse(fs.readFileSync('./wallet.json', 'utf-8')));
    const gameWallet = Keypair.generate(); // Using a randomly generated keypair for example only
    
    // Initialize the GameFi application
    const gameApp = new GameFiApp(connection, gameWallet);
    
    // Generate a random character
    const character = await gameApp.generateCharacter("Solana Warrior");
    
    // Roll a 20-sided die (like in D&D)
    const diceRoll = await gameApp.rollDice(20);
    console.log(`D20 roll result: ${diceRoll}`);
    
    // Roll a standard 6-sided die using the default
    const standardDiceRoll = await gameApp.rollDice(6);
    console.log(`D6 roll result: ${standardDiceRoll}`);
    
    // Generate loot drops
    const lootItems = await gameApp.generateLootDrop(3);
    console.log(`Loot acquired: ${lootItems.map(item => item.name).join(', ')}`);
    
    // Add items to character inventory
    character.inventory.push(...lootItems);
    
    // Calculate player power from stats and equipment
    const playerPower = 
      character.stats.strength + 
      character.stats.dexterity / 2 + 
      character.inventory.reduce((sum, item) => sum + item.power, 0);
    
    // Generate a random enemy power
    const enemyRoll = await gameApp.rollDice(10);
    const enemyPower = 20 + enemyRoll * 5;  // Enemy power between 25-70
    
    // Simulate a battle
    const battleResult = await gameApp.simulateBattle(playerPower, enemyPower);
    
    // Log battle events
    battleResult.events.forEach(event => console.log(event));
    
    // Check if player won and grant more loot if so
    if (battleResult.winner === 'player') {
      console.log("Victory! Receiving bonus loot...");
      const victoryLoot = await gameApp.generateLootDrop(1);
      character.inventory.push(...victoryLoot);
    }
    
    console.log("\nFinal character state:");
    console.log(JSON.stringify(character, null, 2));
    
  } catch (error) {
    console.error("Error in game example:", error);
  }
}

// Run the example (uncomment to execute)
// runGameExample();

/**
 * This example demonstrates:
 * 1. Character generation with random stats
 * 2. Dice rolling mechanics
 * 3. Random battle outcomes with critical hits
 * 4. Loot generation with rarity distributions
 * 
 * In a real GameFi application, these mechanics would be tied to
 * on-chain transactions, NFTs, and token rewards.
 */
